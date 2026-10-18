from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
import os
import io
import jwt
import bcrypt
import uuid
import secrets
import re
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@goldenpirates.io').strip().lower()
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Capitaine1023!')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')

app = FastAPI(title="Golden Pirates — Royaume 1023")
api_router = APIRouter(prefix="/api")


def now_utc():
    return datetime.now(timezone.utc)


def safe_text(t: str) -> str:
    """Neutralise les surrogates isolés (payload JSON malformé) qui font échouer
    l'encodage UTF-8 de Mongo. Tout texte valide (chinois, russe, arabe, emoji…) passe intact."""
    return t.encode("utf-8", "ignore").decode("utf-8")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def make_token(email: str, minutes: int) -> str:
    payload = {"sub": email, "exp": now_utc() + timedelta(minutes=minutes)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, email: str):
    token = make_token(email, 60 * 12)
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True,
        samesite="none", max_age=60 * 60 * 12, path="/",
    )


def clean_doc(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


async def require_admin(request: Request) -> str:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Session invalide")
    email = (payload.get("sub") or "").strip().lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Compte introuvable")
    return email


# ---------------- Models ----------------

class ApplicationCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    pseudo: str = Field(min_length=2, max_length=32)
    power: str = Field(min_length=1, max_length=16)
    troops: str = Field(min_length=2, max_length=60)
    activity: str = Field(min_length=2, max_length=60)
    experience: str = Field(default="", max_length=1200)
    discord: str = Field(default="", max_length=60)
    message: str = Field(min_length=10, max_length=2000)


class StatusUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: str
    note: Optional[str] = Field(default=None, max_length=2000)


class LoginInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    password: str


class MessageCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    text: str = Field(min_length=1, max_length=2000)


# ---------------- Public routes ----------------

@api_router.get("/")
async def root():
    return {"message": "Golden Pirates API — Royaume 1023", "status": "ok"}


# Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
@api_router.post("/cron/keep-alive")
async def cron_keep_alive(request: Request):
    secret = os.environ.get("WEBHOOK_CRON_SECRET", "")
    auth = request.headers.get("authorization", "")
    if not secret or not secrets.compare_digest(auth, f"Bearer {secret}"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    # Aucun travail à faire : ce ping maintient l'app en éveil (anti « réveiller le serveur »).
    return {"ok": True, "ts": now_utc().isoformat()}


REAPPLY_COOLDOWN_DAYS = 30
IP_APPLICATIONS_PER_DAY = 6


@api_router.post("/applications")
async def create_application(data: ApplicationCreate, request: Request):
    for _f in ("pseudo", "troops", "activity", "discord", "message"):
        setattr(data, _f, safe_text(getattr(data, _f) or ""))
    if data.experience:
        data.experience = safe_text(data.experience)
    pseudo_key = data.pseudo.strip().lower()
    now = now_utc()

    # Garde 1 — un seul dossier actif par pseudo (pas de doublon qui noie le registre)
    active = await db.applications.find_one(
        {"pseudo_lower": pseudo_key, "status": {"$in": ["pending", "reserve"]}},
        sort=[("created_at", -1)],
    )
    if active:
        raise HTTPException(status_code=409, detail={
            "code": "duplicate_active",
            "msg": "Tu as déjà un dossier en examen ou en réserve — garde ton code de suivi et consulte l'Espace Recrue.",
        })

    # Garde 2 — déjà accepté à bord : pas de nouvelle candidature
    aboard = await db.applications.find_one({"pseudo_lower": pseudo_key, "status": "accepted"})
    if aboard:
        raise HTTPException(status_code=409, detail={
            "code": "already_accepted",
            "msg": "Tu fais déjà partie de l'équipage, marin — vérifie ton dossier dans l'Espace Recrue.",
        })

    # Garde 3 — délai de réflexion après un refus (pas de repostage-instantané).
    # Source 1 : le sanctuaire des refus (survit au brûlage du dossier).
    cooldown_base = None
    rejected_rec = await db.rejections.find_one({"pseudo_lower": pseudo_key})
    if rejected_rec:
        cooldown_base = rejected_rec.get("rejected_at")
    # Source 2 (repli) : dernier dossier refusé encore au registre.
    if not cooldown_base:
        last_rejected = await db.applications.find_one(
            {"pseudo_lower": pseudo_key, "status": "rejected"},
            sort=[("created_at", -1)],
        )
        if last_rejected:
            cooldown_base = last_rejected.get("status_changed_at") or last_rejected.get("created_at")
    if cooldown_base:
        try:
            base_dt = datetime.fromisoformat(cooldown_base)
        except (TypeError, ValueError):
            base_dt = None
        if base_dt and base_dt.tzinfo is None:
            base_dt = base_dt.replace(tzinfo=timezone.utc)
        retry_at = base_dt + timedelta(days=REAPPLY_COOLDOWN_DAYS) if base_dt else None
        if retry_at and retry_at > now:
            raise HTTPException(status_code=429, detail={
                "code": "cooldown",
                "msg": "Dossier refusé récemment — la mer t'apprendra la patience, marin.",
                "retry_at": retry_at.isoformat(),
            })

    # Garde 4 — limite anti-flood par appareil (IP)
    ip = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    if not ip:
        ip = request.client.host if request.client else "unknown"
    day_ago = (now - timedelta(days=1)).isoformat()
    ip_count = await db.applications.count_documents({"ip": ip, "created_at": {"$gte": day_ago}})
    if ip_count >= IP_APPLICATIONS_PER_DAY:
        raise HTTPException(status_code=429, detail={
            "code": "ip_limit",
            "msg": "Trop de candidatures depuis cet appareil aujourd'hui — reviens demain, la mer ne bouge pas.",
        })

    doc = data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "pending"
    doc["note"] = ""
    doc["seen_status"] = "pending"
    doc["seen_note"] = ""
    doc["created_at"] = now.isoformat()
    doc["status_changed_at"] = now.isoformat()
    doc["pseudo_lower"] = pseudo_key
    doc["ip"] = ip
    code = None
    for _ in range(6):
        candidate = "GP-1023-" + "".join(
            secrets.choice("23456789ABCDEFGHJKMNPQRSTUVWXYZ") for _ in range(4)
        )
        if not await db.applications.find_one({"tracking_code": candidate}):
            code = candidate
            break
    if not code:
        raise HTTPException(status_code=500, detail="Génération du code impossible")
    doc["tracking_code"] = code
    await db.applications.insert_one(doc)
    return {"id": doc["id"], "tracking_code": code, "pseudo": doc["pseudo"]}


@api_router.get("/applications/track/{code}")
async def track_application(code: str):
    code = code.strip().upper()
    doc = await db.applications.find_one({"tracking_code": code})
    if not doc:
        raise HTTPException(status_code=404, detail="Aucun parchemin à ce code de suivi")
    new_status = doc["status"] != doc.get("seen_status", doc["status"])
    new_note = bool(doc.get("note")) and doc.get("note", "") != doc.get("seen_note", "")
    if new_status or new_note:
        await db.applications.update_one(
            {"tracking_code": code},
            {"$set": {"seen_status": doc["status"], "seen_note": doc.get("note", "")}},
        )
    reapply_at = None
    if doc["status"] == "rejected":
        base = doc.get("status_changed_at") or doc.get("created_at")
        try:
            base_dt = datetime.fromisoformat(base)
        except (TypeError, ValueError):
            base_dt = None
        if base_dt:
            if base_dt.tzinfo is None:
                base_dt = base_dt.replace(tzinfo=timezone.utc)
            reapply_at = (base_dt + timedelta(days=REAPPLY_COOLDOWN_DAYS)).isoformat()
    return {
        "tracking_code": doc["tracking_code"],
        "pseudo": doc["pseudo"],
        "power": doc.get("power", ""),
        "troops": doc.get("troops", ""),
        "activity": doc.get("activity", ""),
        "experience": doc.get("experience", ""),
        "discord": doc.get("discord", ""),
        "message": doc.get("message", ""),
        "status": doc["status"],
        "note": doc.get("note", ""),
        "created_at": doc.get("created_at"),
        "reapply_at": reapply_at,
        "new_status": new_status,
        "new_note": new_note,
    }


@api_router.get("/notifications/{code}")
async def notifications(code: str):
    code = code.strip().upper()
    doc = await db.applications.find_one({"tracking_code": code}, {"status": 1, "note": 1, "seen_status": 1, "seen_note": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Aucun dossier à ce code de suivi")
    unread = await db.messages.count_documents({
        "conv_code": code, "sender": "council", "deleted": False, "read_by_recruit": False,
    })
    return {
        "unread_messages": unread,
        "new_status": doc["status"] != doc.get("seen_status", doc["status"]),
        "new_note": bool(doc.get("note")) and doc.get("note", "") != doc.get("seen_note", ""),
    }


# ---------------- Auth / Admin routes ----------------

@api_router.post("/admin/login")
async def admin_login(data: LoginInput, request: Request, response: Response):
    email = data.email.strip().lower()
    # Derrière l'ingress, request.client.host est l'IP d'un proxy interne (variable) :
    # identifier basé sur la VRAIE IP client (première entrée de X-Forwarded-For).
    ip = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    ident = f"{ip or (request.client.host if request.client else 'unknown')}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": ident})
    if attempt and attempt.get("locked_until"):
        try:
            if datetime.fromisoformat(attempt["locked_until"]) > now_utc():
                raise HTTPException(status_code=429, detail="Trop de tentatives — réessayez dans 15 minutes")
        except ValueError:
            pass
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        fails = (attempt.get("fails", 0) if attempt else 0) + 1
        update = {"$inc": {"fails": 1}}
        if fails >= 5:
            update["$set"] = {"locked_until": (now_utc() + timedelta(minutes=15)).isoformat()}
        await db.login_attempts.update_one({"identifier": ident}, update, upsert=True)
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    await db.login_attempts.delete_one({"identifier": ident})
    set_auth_cookies(response, email)
    return {"email": email, "role": user.get("role", "admin")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(email: str = Depends(require_admin)):
    return {"email": email, "role": "admin"}


@api_router.get("/admin/applications")
async def list_applications(status: Optional[str] = None, _: str = Depends(require_admin)):
    query = {"status": status} if status else {}
    docs = await db.applications.find(query).sort("created_at", -1).to_list(500)
    return [clean_doc(d) for d in docs]


@api_router.get("/admin/stats")
async def admin_stats(_: str = Depends(require_admin)):
    return {
        "total": await db.applications.count_documents({}),
        "pending": await db.applications.count_documents({"status": "pending"}),
        "accepted": await db.applications.count_documents({"status": "accepted"}),
        "reserve": await db.applications.count_documents({"status": "reserve"}),
        "rejected": await db.applications.count_documents({"status": "rejected"}),
    }


# ---------------- Bouteille perdue : récupération du code de suivi ----------------

class RecoveryCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    pseudo: str = Field(min_length=2, max_length=32)
    discord: Optional[str] = Field(default=None, max_length=60)
    power: Optional[str] = Field(default=None, max_length=16)


RECOVERY_PER_HOUR = 5


@api_router.post("/applications/recover")
async def recover_tracking_code(data: RecoveryCreate, request: Request):
    """La bouteille perdue : la recrue retrouve son code avec son pseudo + UNE
    clé d'identité — son Discord (semi-privé) OU sa puissance exacte (pour les
    joueurs privés de Discord par les blocages pays)."""
    now = now_utc()
    ip = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    if not ip:
        ip = request.client.host if request.client else "unknown"
    hour_ago = now - timedelta(hours=1)
    attempts = await db.recovery_attempts.count_documents({"ip": ip, "at": {"$gte": hour_ago}})
    if attempts >= RECOVERY_PER_HOUR:
        raise HTTPException(status_code=429, detail={
            "code": "recover_limit",
            "msg": "Trop de tentatives depuis cet appareil — réessaie dans une heure.",
        })
    await db.recovery_attempts.insert_one({"ip": ip, "at": now})

    pseudo_key = data.pseudo.strip().lower()
    docs = await db.applications.find({"pseudo_lower": pseudo_key}).sort("created_at", -1).to_list(50)

    def norm(v):
        return re.sub(r"\s+", "", (v or "")).lower()

    target_discord = norm(data.discord)
    target_power = norm(data.power)
    if not target_discord and not target_power:
        raise HTTPException(status_code=400, detail={
            "code": "recover_need_one",
            "msg": "Donne ton Discord OU ta puissance exacte pour retrouver ta bouteille.",
        })
    doc = next(
        (d for d in docs
         if (target_discord and norm(d.get("discord")) == target_discord)
         or (target_power and norm(d.get("power")) == target_power)),
        None,
    )
    if not doc:
        raise HTTPException(status_code=404, detail={
            "code": "recover_not_found",
            "msg": "Aucune bouteille au nom de ce pseudo avec ces infos — vérifie l'orthographe exacte de ta candidature.",
        })
    # Visibilité Conseil : toute récupération de code est horodatée sur le dossier.
    await db.applications.update_one(
        {"_id": doc["_id"]},
        {"$set": {"code_recovered_at": now.isoformat()}},
    )
    return {
        "tracking_code": doc["tracking_code"],
        "pseudo": doc["pseudo"],
        "status": doc["status"],
    }


# ---------------- Exports du registre (Excel / PDF) ----------------

from xml.sax.saxutils import escape

EXPORT_COLUMNS = [
    ("tracking_code", "CODE DE SUIVI"),
    ("pseudo", "PSEUDO"),
    ("power", "PUISSANCE"),
    ("troops", "TROUPES"),
    ("activity", "ACTIVITÉ"),
    ("discord", "DISCORD"),
    ("status", "STATUT"),
    ("note", "NOTE DU CONSEIL"),
    ("created_at", "DÉPOSÉE LE"),
    ("experience", "EXPÉRIENCE"),
    ("message", "MESSAGE"),
]

STATUS_FR = {
    "pending": "EN EXAMEN",
    "accepted": "ACCEPTÉ À BORD",
    "reserve": "EN RÉSERVE",
    "rejected": "REFUSÉ",
}

NAVY_HEX = "#0B192C"
GOLD_HEX = "#D4AF37"
GRAY_HEX = "#5C6B7E"

STATUS_TINT = {  # fonds clairs (Excel sans #, PDF avec #)
    "pending": "FFF4CC",
    "accepted": "DCF3E8",
    "reserve": "FEF3C7",
    "rejected": "FEE2E2",
}

STATUS_HEX = {  # textes colorés
    "pending": "#B8860B",
    "accepted": "#1B7F4C",
    "reserve": "#B45309",
    "rejected": "#B91C1C",
}


def fmt_dt(v):
    if not v:
        return ""
    try:
        return datetime.fromisoformat(v).strftime("%d/%m/%Y %H:%M")
    except (TypeError, ValueError):
        return str(v)


def fmt_row(doc):
    row = []
    for key, _ in EXPORT_COLUMNS:
        v = doc.get(key, "")
        if key == "status":
            v = STATUS_FR.get(v, v)
        elif key == "created_at" and v:
            try:
                v = datetime.fromisoformat(v).strftime("%d/%m/%Y %H:%M")
            except (TypeError, ValueError):
                pass
        row.append("" if v is None else str(v))
    return row


@api_router.get("/admin/export/xlsx")
async def export_xlsx(_: str = Depends(require_admin)):
    docs = await db.applications.find({}).sort("created_at", -1).to_list(2000)
    thin = Side(style="thin", color="D8DEE8")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    wb = openpyxl.Workbook()

    # Feuille 1 — Synthèse décorée
    ws = wb.active
    ws.title = "Synthèse"
    ws.merge_cells("A1:D1")
    for col in "ABCD":
        ws[f"{col}1"].fill = PatternFill("solid", fgColor="0B192C")
    c = ws["A1"]
    c.value = "GOLDEN PIRATES — REGISTRE DES RECRUES"
    c.font = Font(color="D4AF37", bold=True, size=16)
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 34
    ws.merge_cells("A2:D2")
    c = ws["A2"]
    c.value = f"Royaume 1023 · Call of Dragons · édité le {fmt_dt(now_utc().isoformat())}"
    c.font = Font(color="5C6B7E", italic=True, size=10)
    c.alignment = Alignment(horizontal="center", vertical="center")
    kpis = [
        ("Total", len(docs), "0B192C", "D4AF37"),
        ("En examen", sum(1 for d in docs if d.get("status") == "pending"), "FFF4CC", "B8860B"),
        ("Acceptées", sum(1 for d in docs if d.get("status") == "accepted"), "DCF3E8", "1B7F4C"),
        ("En réserve", sum(1 for d in docs if d.get("status") == "reserve"), "FEF3C7", "B45309"),
        ("Refusées", sum(1 for d in docs if d.get("status") == "rejected"), "FEE2E2", "B91C1C"),
    ]
    r = 4
    for label, count, tint, hexc in kpis:
        lc = ws.cell(row=r, column=1, value=label)
        lc.font = Font(bold=True, size=11, color="1A2433")
        lc.border = border
        vc = ws.cell(row=r, column=2, value=count)
        vc.font = Font(bold=True, size=11, color=hexc)
        vc.fill = PatternFill("solid", fgColor=tint)
        vc.alignment = Alignment(horizontal="center", vertical="center")
        vc.border = border
        r += 1
    ws.column_dimensions["A"].width = 24
    ws.column_dimensions["B"].width = 14

    # Feuille 2 — Registre complet
    ws2 = wb.create_sheet("Registre")
    ws2.append([h for _, h in EXPORT_COLUMNS])
    for cell in ws2[1]:
        cell.fill = PatternFill("solid", fgColor="0B192C")
        cell.font = Font(color="D4AF37", bold=True, size=10)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = border
    ws2.row_dimensions[1].height = 24
    status_idx = [k for k, _ in EXPORT_COLUMNS].index("status") + 1
    wrap_idx = {[k for k, _ in EXPORT_COLUMNS].index(k) + 1 for k in ("experience", "message", "note", "activity")}
    for n, d in enumerate(docs):
        ws2.append(fmt_row(d))
        rn = ws2.max_row
        for i in range(1, len(EXPORT_COLUMNS) + 1):
            cell = ws2.cell(row=rn, column=i)
            cell.border = border
            cell.alignment = Alignment(vertical="top", wrap_text=i in wrap_idx)
            if n % 2 == 1:
                cell.fill = PatternFill("solid", fgColor="F7F9FC")
        sc = ws2.cell(row=rn, column=status_idx)
        sc.fill = PatternFill("solid", fgColor=STATUS_TINT.get(d.get("status"), "FFFFFF"))
        sc.font = Font(bold=True, color=STATUS_HEX.get(d.get("status"), "#1A2433").lstrip("#"))
        sc.alignment = Alignment(horizontal="center", vertical="top")
    if not docs:
        ws2.append(["La mer est calme — aucune candidature enregistrée pour l'instant."])
    for i, w in enumerate([15, 20, 12, 20, 24, 18, 15, 36, 17, 42, 52], 1):
        ws2.column_dimensions[get_column_letter(i)].width = w
    ws2.freeze_panes = "A2"
    ws2.auto_filter.ref = ws2.dimensions
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    stamp = now_utc().strftime("%Y-%m-%d")
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="golden-pirates-registre-{stamp}.xlsx"'},
    )


@api_router.get("/admin/export/pdf")
async def export_pdf(_: str = Depends(require_admin)):
    docs = await db.applications.find({}).sort("created_at", -1).to_list(2000)
    buf = io.BytesIO()
    doc_pdf = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=14 * mm, bottomMargin=20 * mm, leftMargin=15 * mm, rightMargin=15 * mm,
        title="Golden Pirates — Registre des recrues",
        author="Conseil des Capitaines — Golden Pirates",
    )
    W = A4[0] - 30 * mm

    band_title = ParagraphStyle("bt", fontName="Helvetica-Bold", fontSize=19, leading=23, textColor=colors.HexColor(GOLD_HEX))
    band_sub = ParagraphStyle("bs", fontName="Helvetica", fontSize=9, leading=13, textColor=colors.HexColor("#C9D3E0"))
    kpi_num = ParagraphStyle("kn", fontName="Helvetica-Bold", fontSize=16, leading=19, alignment=1)
    kpi_lab = ParagraphStyle("kl", fontName="Helvetica", fontSize=7, leading=9, alignment=1, textColor=colors.HexColor(GRAY_HEX))
    lab = ParagraphStyle("cl", fontName="Helvetica-Bold", fontSize=6.8, leading=9, textColor=colors.HexColor(GRAY_HEX))
    val = ParagraphStyle("cv", fontName="Helvetica", fontSize=9.5, leading=12.5, textColor=colors.HexColor("#1A2433"))
    empty_style = ParagraphStyle("es", fontName="Helvetica-Oblique", fontSize=11, leading=16, alignment=1, textColor=colors.HexColor(GRAY_HEX))

    band_inner = [
        Paragraph("GOLDEN PIRATES", band_title),
        Paragraph("REGISTRE DES RECRUES — ROYAUME 1023 · CALL OF DRAGONS", band_sub),
        Paragraph(f"Édité le {fmt_dt(now_utc().isoformat())} · {len(docs)} candidature(s) au registre", band_sub),
    ]
    band = Table([[band_inner]], colWidths=[W])
    band.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(NAVY_HEX)),
        ("LINEBELOW", (0, 0), (-1, -1), 2, colors.HexColor(GOLD_HEX)),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    flow = [band, Spacer(1, 6 * mm)]

    counts = {k: sum(1 for d in docs if d.get("status") == k) for k in STATUS_FR}
    kpis = [
        ("Total", len(docs), NAVY_HEX, "#E8ECF2"),
        ("En examen", counts["pending"], STATUS_HEX["pending"], "#" + STATUS_TINT["pending"]),
        ("Acceptées", counts["accepted"], STATUS_HEX["accepted"], "#" + STATUS_TINT["accepted"]),
        ("En réserve", counts["reserve"], STATUS_HEX["reserve"], "#" + STATUS_TINT["reserve"]),
        ("Refusées", counts["rejected"], STATUS_HEX["rejected"], "#" + STATUS_TINT["rejected"]),
    ]
    kpi_cells = []
    for i, (label, count, hexc, tint) in enumerate(kpis):
        num_style = ParagraphStyle(f"kn{i}", parent=kpi_num, textColor=colors.HexColor(hexc))
        kpi_cells.append([Paragraph(str(count), num_style), Paragraph(label.upper(), kpi_lab)])
    kpi_table = Table([kpi_cells], colWidths=[W / 5] * 5)
    kpi_style = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8DEE8")),
    ]
    for i, (_, _, _, tint) in enumerate(kpis):
        kpi_style.append(("BACKGROUND", (i, 0), (i, 0), colors.HexColor(tint)))
    kpi_table.setStyle(TableStyle(kpi_style))
    flow += [kpi_table, Spacer(1, 7 * mm)]

    def build_card(d, numero):
        status = d.get("status", "pending")
        tint = "#" + STATUS_TINT.get(status, "FFFFFF")
        meta = Paragraph(
            f'<font color="{GOLD_HEX}" size="7.5">DOSSIER N° {numero:02d}</font>'
            f'&nbsp;&nbsp;·&nbsp;&nbsp;<font color="#8FA3BC" size="8.5">{escape(d.get("tracking_code", ""))}</font>',
            ParagraphStyle(f"hm{numero}", fontName="Helvetica", leading=10),
        )
        pseudo_p = Paragraph(
            f'<font color="#FFFFFF" size="14"><b>{escape(d.get("pseudo", ""))}</b></font>',
            ParagraphStyle(f"hp{numero}", fontName="Helvetica", leading=17),
        )
        chip = Paragraph(
            f'<b>{escape(STATUS_FR.get(status, status))}</b>',
            ParagraphStyle(f"hr{numero}", fontName="Helvetica", fontSize=10, leading=13, alignment=1,
                           textColor=colors.HexColor(STATUS_HEX.get(status, "#1A2433"))),
        )
        rows = [
            [meta, "", "", ""],
            [pseudo_p, "", "", chip],
            [Paragraph("PUISSANCE", lab), Paragraph(escape(d.get("power", "")) or "—", val),
             Paragraph("TROUPES", lab), Paragraph(escape(d.get("troops", "")) or "—", val)],
            [Paragraph("ACTIVITÉ", lab), Paragraph(escape(d.get("activity", "")) or "—", val),
             Paragraph("DISCORD", lab), Paragraph(escape(d.get("discord", "")) or "—", val)],
            [Paragraph("DÉPOSÉE LE", lab), Paragraph(fmt_dt(d.get("created_at")) or "—", val), "", ""],
            [Paragraph("EXPÉRIENCE", lab), Paragraph(escape(d.get("experience", "")) or "— aucune ligne dans le journal de bord —", val), "", ""],
            [Paragraph("MESSAGE", lab), Paragraph(escape(d.get("message", "")) or "—", val), "", ""],
        ]
        if d.get("note"):
            rows.append([Paragraph("NOTE DU CONSEIL", lab), Paragraph(escape(d["note"]), val), "", ""])
        t = Table(rows, colWidths=[0.15 * W, 0.35 * W, 0.15 * W, 0.35 * W])
        style = [
            ("SPAN", (0, 0), (3, 0)),
            ("SPAN", (0, 1), (2, 1)),
            ("BACKGROUND", (0, 0), (3, 0), colors.HexColor(NAVY_HEX)),
            ("BACKGROUND", (0, 1), (2, 1), colors.HexColor(NAVY_HEX)),
            ("BACKGROUND", (3, 1), (3, 1), colors.HexColor(tint)),
            ("BACKGROUND", (0, 2), (0, -1), colors.HexColor("#F4F6F9")),
            ("BACKGROUND", (2, 2), (2, 3), colors.HexColor("#F4F6F9")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8DEE8")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]
        for r in (4, 5, 6):
            style.append(("SPAN", (1, r), (3, r)))
        if d.get("note"):
            style.append(("SPAN", (1, 7), (3, 7)))
        t.setStyle(TableStyle(style))
        return t

    if docs:
        for i, d in enumerate(docs, 1):
            flow.append(build_card(d, i))
            flow.append(Spacer(1, 5 * mm))
    else:
        mer = Table([[Paragraph(
            "La mer est calme — aucune candidature enregistrée pour l'instant.<br/>Les recrues ne tarderont pas à frapper au pont.",
            empty_style,
        )]], colWidths=[W])
        mer.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F4F6F9")),
            ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor(GOLD_HEX)),
            ("TOPPADDING", (0, 0), (-1, -1), 24),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 24),
        ]))
        flow.append(mer)

    def _footer(canv, _d):
        canv.saveState()
        canv.setStrokeColor(colors.HexColor("#D8DEE8"))
        canv.setLineWidth(0.5)
        canv.line(15 * mm, 13.5 * mm, A4[0] - 15 * mm, 13.5 * mm)
        canv.setFont("Helvetica", 7.5)
        canv.setFillColor(colors.HexColor(GRAY_HEX))
        canv.drawString(15 * mm, 9.5 * mm, "GOLDEN PIRATES — CONSEIL DES CAPITAINES · ROYAUME 1023 · CALL OF DRAGONS")
        canv.drawRightString(A4[0] - 15 * mm, 9.5 * mm, f"Page {canv.getPageNumber()}")
        canv.restoreState()

    doc_pdf.build(flow, onFirstPage=_footer, onLaterPages=_footer)
    buf.seek(0)
    stamp = now_utc().strftime("%Y-%m-%d")
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="golden-pirates-registre-{stamp}.pdf"'},
    )


@api_router.patch("/admin/applications/{app_id}")
async def update_application(app_id: str, data: StatusUpdate, _: str = Depends(require_admin)):
    if data.status not in ("pending", "accepted", "rejected", "reserve"):
        raise HTTPException(status_code=400, detail="Statut invalide")
    current = await db.applications.find_one({"id": app_id}, {"status": 1, "pseudo_lower": 1, "pseudo": 1})
    if not current:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    update = {"note": safe_text(data.note or "")}
    if current["status"] != data.status:
        update["status"] = data.status
        now_iso = now_utc().isoformat()
        update["status_changed_at"] = now_iso
        pkey = current.get("pseudo_lower") or (current.get("pseudo") or "").strip().lower()
        if pkey and data.status == "rejected":
            # Le refus est inscrit au sanctuaire : il survit au brûlage du dossier.
            await db.rejections.update_one(
                {"pseudo_lower": pkey},
                {"$set": {"pseudo_lower": pkey, "rejected_at": now_iso}},
                upsert=True,
            )
        elif pkey:
            # Pardon explicite : repasser le dossier en examen/accepté/réserve lève le sanctuaire.
            await db.rejections.delete_one({"pseudo_lower": pkey})
    doc = await db.applications.find_one_and_update(
        {"id": app_id},
        {"$set": update},
        return_document=ReturnDocument.AFTER,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    return clean_doc(doc)


@api_router.delete("/admin/applications/{app_id}")
async def delete_application(app_id: str, _: str = Depends(require_admin)):
    doc = await db.applications.find_one({"id": app_id}, {"tracking_code": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    await db.messages.delete_many({"conv_code": doc["tracking_code"]})
    await db.applications.delete_one({"id": app_id})
    return {"ok": True}


# ---------------- Messaging (La Bouteille à la Mer) ----------------

def clean_msg(doc: dict) -> dict:
    doc = dict(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/messages/{code}")
async def get_messages(code: str):
    code = code.strip().upper()
    if not await db.applications.find_one({"tracking_code": code}):
        raise HTTPException(status_code=404, detail="Aucun dossier à ce code de suivi")
    docs = await db.messages.find({"conv_code": code}).sort("created_at", 1).to_list(1000)
    new_ids = {d["id"] for d in docs if d["sender"] == "council" and not d.get("deleted") and not d.get("read_by_recruit")}
    if new_ids:
        await db.messages.update_many(
            {"conv_code": code, "id": {"$in": list(new_ids)}},
            {"$set": {"read_by_recruit": True}},
        )
    out = []
    for d in docs:
        if d["id"] in new_ids:
            d["was_new"] = True
        out.append(clean_msg(d))
    return out


@api_router.post("/messages/{code}")
async def send_message(code: str, data: MessageCreate):
    code = code.strip().upper()
    if not await db.applications.find_one({"tracking_code": code}):
        raise HTTPException(status_code=404, detail="Aucun dossier à ce code de suivi")
    text = safe_text(data.text).strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message vide")
    minute_ago = (now_utc() - timedelta(minutes=1)).isoformat()
    recent = await db.messages.count_documents({
        "conv_code": code, "sender": "recruit", "created_at": {"$gte": minute_ago},
    })
    if recent >= 10:
        raise HTTPException(status_code=429, detail="Flood")
    doc = {
        "id": str(uuid.uuid4()),
        "conv_code": code,
        "sender": "recruit",
        "text": text[:2000],
        "created_at": now_utc().isoformat(),
        "deleted": False,
        "read_by_council": False,
    }
    await db.messages.insert_one(doc)
    return clean_msg(doc)


@api_router.delete("/messages/{code}/{message_id}")
async def delete_message(code: str, message_id: str):
    code = code.strip().upper()
    res = await db.messages.find_one_and_update(
        {"id": message_id, "conv_code": code, "sender": "recruit"},
        {"$set": {"deleted": True, "text": ""}},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        raise HTTPException(status_code=404, detail="Message introuvable")
    return clean_msg(res)


# ---------------- Tanière des recrues (messagerie recrue ↔ recrue) ----------------

class PeerMessageCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    from_code: str = Field(min_length=4, max_length=20)
    to_app_id: str = Field(min_length=8, max_length=64)
    text: str = Field(min_length=1, max_length=1000)

@api_router.get("/peers/search")
async def peers_search(q: str, code: str):
    # Protégée par un code de suivi valide ; n'expose JAMAIS discord / email / code d'autrui.
    me = (code or "").strip().upper()
    mine = await db.applications.find_one({"tracking_code": me})
    if not mine:
        raise HTTPException(status_code=404, detail="Aucun dossier à ce code de suivi")
    q = (q or "").strip()
    if len(q) < 2:
        return []
    docs = await db.applications.find({
        "pseudo": {"$regex": re.escape(q), "$options": "i"},
        "tracking_code": {"$ne": me},
    }).sort("created_at", -1).to_list(12)
    return [{
        "app_id": d["id"],
        "pseudo": d["pseudo"],
        "power": d.get("power", ""),
        "troops": d.get("troops", ""),
        "status": d.get("status", "pending"),
    } for d in docs]

@api_router.get("/peers/threads")
async def peers_threads(code: str):
    me = (code or "").strip().upper()
    mine = await db.applications.find_one({"tracking_code": me})
    if not mine:
        raise HTTPException(status_code=404, detail="Aucun dossier à ce code de suivi")
    my_id = mine["id"]
    docs = await db.peer_messages.find({
        "$or": [{"from_id": my_id}, {"to_id": my_id}],
        "deleted": {"$ne": True},
    }).sort("created_at", -1).to_list(1000)
    threads = {}
    for d in docs:
        from_me = d["from_id"] == my_id
        peer_id = d["to_id"] if from_me else d["from_id"]
        t = threads.setdefault(peer_id, {
            "app_id": peer_id,
            "pseudo": d["to_pseudo"] if from_me else d["from_pseudo"],
            "last": d["text"][:80],
            "last_at": d["created_at"],
            "unread": 0,
        })
        if not from_me and not d.get("read"):
            t["unread"] += 1
    return list(threads.values())

@api_router.get("/peers/thread")
async def peers_thread(code: str, peer: str):
    me = (code or "").strip().upper()
    mine = await db.applications.find_one({"tracking_code": me})
    if not mine:
        raise HTTPException(status_code=404, detail="Aucun dossier à ce code de suivi")
    other = await db.applications.find_one({"id": peer})
    if not other:
        raise HTTPException(status_code=404, detail="Recrue introuvable")
    key = "|".join(sorted([mine["id"], peer]))
    docs = await db.peer_messages.find({"thread": key, "deleted": {"$ne": True}}).sort("created_at", 1).to_list(500)
    await db.peer_messages.update_many(
        {"thread": key, "from_id": peer, "read": {"$ne": True}},
        {"$set": {"read": True}},
    )
    return {
        "peer": {"app_id": peer, "pseudo": other["pseudo"]},
        "messages": [{
            "id": d["id"],
            "from_me": d["from_id"] == mine["id"],
            "text": d["text"],
            "created_at": d["created_at"],
        } for d in docs],
    }

@api_router.post("/peers/messages")
async def peers_send(data: PeerMessageCreate):
    me = (data.from_code or "").strip().upper()
    mine = await db.applications.find_one({"tracking_code": me})
    if not mine:
        raise HTTPException(status_code=404, detail="Aucun dossier à ce code de suivi")
    other = await db.applications.find_one({"id": data.to_app_id})
    if not other:
        raise HTTPException(status_code=404, detail="Recrue introuvable")
    if other["id"] == mine["id"]:
        raise HTTPException(status_code=400, detail="Tu ne peux pas t'écrire toi-même, marin.")
    text = safe_text(data.text).strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message vide")
    hour_ago = (now_utc() - timedelta(hours=1)).isoformat()
    recent = await db.peer_messages.count_documents({
        "from_id": mine["id"], "created_at": {"$gte": hour_ago},
    })
    if recent >= 20:
        raise HTTPException(status_code=429, detail="Relâche la manivelle — 20 messages par heure maximum entre recrues.")
    doc = {
        "id": str(uuid.uuid4()),
        "thread": "|".join(sorted([mine["id"], other["id"]])),
        "from_id": mine["id"],
        "to_id": other["id"],
        "from_pseudo": mine["pseudo"],
        "to_pseudo": other["pseudo"],
        "text": text[:1000],
        "created_at": now_utc().isoformat(),
        "deleted": False,
        "read": False,
    }
    await db.peer_messages.insert_one(doc)
    return {"id": doc["id"], "from_me": True, "text": doc["text"], "created_at": doc["created_at"]}


@api_router.get("/admin/conversations")
async def admin_conversations(_: str = Depends(require_admin)):
    msgs = await db.messages.find({}).sort("created_at", 1).to_list(5000)
    convs = {}
    for m in msgs:
        conv = convs.setdefault(m["conv_code"], {"last": None, "last_at": "", "unread": 0, "total": 0})
        conv["total"] += 1
        conv["last_at"] = m["created_at"]
        conv["last"] = m
        if m["sender"] == "recruit" and not m.get("deleted") and not m.get("read_by_council"):
            conv["unread"] += 1
    codes = list(convs.keys())
    pseudo_by = {}
    if codes:
        apps = await db.applications.find({"tracking_code": {"$in": codes}}).to_list(200)
        pseudo_by = {a["tracking_code"]: a["pseudo"] for a in apps}
    out = []
    for code, cv in convs.items():
        last = cv["last"] or {}
        out.append({
            "code": code,
            "pseudo": pseudo_by.get(code, code),
            "last_text": "" if last.get("deleted") else last.get("text", ""),
            "last_sender": last.get("sender", ""),
            "last_at": cv["last_at"],
            "unread": cv["unread"],
            "total": cv["total"],
        })
    out.sort(key=lambda x: x["last_at"], reverse=True)
    return out


@api_router.get("/admin/conversations/{code}")
async def admin_thread(code: str, _: str = Depends(require_admin)):
    code = code.strip().upper()
    docs = await db.messages.find({"conv_code": code}).sort("created_at", 1).to_list(1000)
    new_ids = {d["id"] for d in docs if d["sender"] == "recruit" and not d.get("deleted") and not d.get("read_by_council")}
    out = []
    for d in docs:
        if d["id"] in new_ids:
            d["was_new"] = True
        out.append(clean_msg(d))
    return out


@api_router.post("/admin/conversations/{code}")
async def admin_send_message(code: str, data: MessageCreate, _: str = Depends(require_admin)):
    code = code.strip().upper()
    if not await db.applications.find_one({"tracking_code": code}):
        raise HTTPException(status_code=404, detail="Aucun dossier à ce code de suivi")
    text = safe_text(data.text).strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message vide")
    minute_ago = (now_utc() - timedelta(minutes=1)).isoformat()
    recent = await db.messages.count_documents({
        "conv_code": code, "sender": "council", "created_at": {"$gte": minute_ago},
    })
    if recent >= 10:
        raise HTTPException(status_code=429, detail="Flood")
    doc = {
        "id": str(uuid.uuid4()),
        "conv_code": code,
        "sender": "council",
        "text": text[:2000],
        "created_at": now_utc().isoformat(),
        "deleted": False,
        "read_by_council": True,
        "read_by_recruit": False,
    }
    await db.messages.insert_one(doc)
    return clean_msg(doc)


@api_router.delete("/admin/conversations/{code}/{message_id}")
async def admin_delete_message(code: str, message_id: str, _: str = Depends(require_admin)):
    code = code.strip().upper()
    res = await db.messages.find_one_and_update(
        {"id": message_id, "conv_code": code, "sender": "council"},
        {"$set": {"deleted": True, "text": ""}},
        return_document=ReturnDocument.AFTER,
    )
    if not res:
        raise HTTPException(status_code=404, detail="Message introuvable")
    return clean_msg(res)


@api_router.post("/admin/conversations/{code}/read")
async def admin_mark_read(code: str, _: str = Depends(require_admin)):
    code = code.strip().upper()
    await db.messages.update_many(
        {"conv_code": code, "sender": "recruit"},
        {"$set": {"read_by_council": True}},
    )
    return {"ok": True}


# ---------------- Startup seed ----------------

async def seed():
    await db.users.create_index("email", unique=True)
    await db.applications.create_index("tracking_code", unique=True)
    await db.applications.create_index("pseudo_lower")
    await db.applications.create_index("ip")
    await db.applications.update_many(
        {"pseudo_lower": {"$exists": False}},
        [{"$set": {
            "pseudo_lower": {"$toLower": {"$trim": {"input": "$pseudo"}}},
            "status_changed_at": "$created_at",
        }}],
    )
    # Sanctuaire des refus : le délai de re-postulation survit au brûlage.
    await db.rejections.create_index("pseudo_lower", unique=True)
    # Tentatives de récupération de code : auto-purge au bout de 2 h.
    await db.recovery_attempts.create_index("at", expireAfterSeconds=7200)
    async for rej_doc in db.applications.find(
        {"status": "rejected"},
        {"pseudo": 1, "pseudo_lower": 1, "status_changed_at": 1, "created_at": 1},
    ).sort("created_at", 1):
        rej_key = rej_doc.get("pseudo_lower") or (rej_doc.get("pseudo") or "").strip().lower()
        if not rej_key:
            continue
        await db.rejections.update_one(
            {"pseudo_lower": rej_key},
            {"$set": {"rejected_at": rej_doc.get("status_changed_at") or rej_doc.get("created_at")}},
            upsert=True,
        )
    await db.login_attempts.create_index("identifier")
    await db.messages.create_index([("conv_code", 1), ("created_at", 1)])
    admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if admin is None:
        await db.users.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "created_at": now_utc().isoformat(),
        })
    elif not verify_password(ADMIN_PASSWORD, admin.get("password_hash", "")):
        await db.users.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
        )


@app.on_event("startup")
async def startup():
    await seed()


app.include_router(api_router)


# Bouclier : une validation échouée (ex: caractères Unicode malformés dans le JSON)
# doit renvoyer un 422 PROPRE — jamais l'écho de l'input, qui peut planter la sérialisation.
@app.exception_handler(RequestValidationError)
async def safe_validation_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": "Requête invalide — vérifie les champs envoyés."},
    )

origins = [
    o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',')
    if o.strip() and o.strip() != '*'
]
if FRONTEND_URL not in origins:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
