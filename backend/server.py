from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
import os
import jwt
import bcrypt
import uuid
import secrets
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
    discord: str = Field(min_length=2, max_length=60)
    message: str = Field(min_length=10, max_length=2000)


class StatusUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: str
    note: Optional[str] = None


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


REAPPLY_COOLDOWN_DAYS = 30
IP_APPLICATIONS_PER_DAY = 3


@api_router.post("/applications")
async def create_application(data: ApplicationCreate, request: Request):
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

    # Garde 3 — délai de reflection après un refus (pas de repostage-instantané)
    last_rejected = await db.applications.find_one(
        {"pseudo_lower": pseudo_key, "status": "rejected"},
        sort=[("created_at", -1)],
    )
    if last_rejected:
        base = last_rejected.get("status_changed_at") or last_rejected.get("created_at")
        try:
            base_dt = datetime.fromisoformat(base)
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
    ip = (request.headers.get("x-forwarded-for") or "").split(",")[-1].strip()
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
    ident = f"{request.client.host if request.client else 'unknown'}:{email}"
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


@api_router.patch("/admin/applications/{app_id}")
async def update_application(app_id: str, data: StatusUpdate, _: str = Depends(require_admin)):
    if data.status not in ("pending", "accepted", "rejected", "reserve"):
        raise HTTPException(status_code=400, detail="Statut invalide")
    current = await db.applications.find_one({"id": app_id}, {"status": 1})
    if not current:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    update = {"note": data.note or ""}
    if current["status"] != data.status:
        update["status"] = data.status
        update["status_changed_at"] = now_utc().isoformat()
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
    text = data.text.strip()
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
    text = data.text.strip()
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
