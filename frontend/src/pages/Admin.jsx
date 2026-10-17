import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ChevronDown, LogOut, Search, Trash2, MessagesSquare, Anchor, Mail, KeyRound, Eye, EyeOff, Lock, Fingerprint } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import ChatBox from "@/components/ChatBox";
import { SkullIcon } from "@/components/LogoMark";
import api, { formatApiError } from "@/lib/api";
import { useLang } from "@/lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

const statCls = {
  total: "text-bone",
  pending: "text-gold",
  accepted: "text-emerald-400",
  reserve: "text-amber-400",
  rejected: "text-bloodglow",
};

const frDate = (iso, locale) =>
  iso
    ? new Date(iso).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const RIVETS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
  return { left: `${50 + 47 * Math.cos(a)}%`, top: `${50 + 47 * Math.sin(a)}%` };
});

const KeyholeSVG = ({ className = "w-32 h-32" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
    <circle cx="50" cy="40" r="14" stroke="#D4AF37" strokeWidth="4.5" className="drop-shadow-[0_0_14px_rgba(212,175,55,0.7)]" />
    <path d="M44.5 50 L37 78 L63 78 L55.5 50 Z" stroke="#D4AF37" strokeWidth="4.5" fill="rgba(212,175,55,0.18)" strokeLinejoin="round" />
  </svg>
);

function LoginScreen({ onAuthed }) {
  const { c } = useLang();
  const s = c.admin.login;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post("/admin/login", { email, password });
      toast.success(c.admin.toast.welcome(data.email));
      onAuthed();
    } catch (err) {
      if (err?.response?.status === 429) toast.error(s.sealed);
      else if (err?.response?.status === 401) setFails((f) => Math.min(f + 1, 5));
      else toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 relative overflow-hidden flex items-center justify-center px-5 py-14" data-testid="admin-login-screen">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_30%,rgba(11,25,44,0.95),transparent_62%)]" />
        <div className="absolute inset-x-0 top-1/3 h-1/2 bg-[radial-gradient(ellipse_at_60%_45%,rgba(120,150,170,0.1),transparent_65%)] animate-fog" />
        <SkullIcon className="absolute right-[-6%] bottom-[-12%] w-[52vw] max-w-[460px] text-gold/[0.05]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
          className="hidden lg:flex flex-col items-center text-center"
        >
          <div className="relative w-72 h-72 xl:w-80 xl:h-80">
            <div className="absolute inset-0 rounded-full border border-dashed border-gold/30 animate-spin-slow" />
            {RIVETS.map((r, i) => (
              <span
                key={i}
                className="absolute w-2 h-2 rounded-full bg-gold/70 shadow-[0_0_8px_rgba(212,175,55,0.5)]"
                style={{ left: r.left, top: r.top, transform: "translate(-50%, -50%)" }}
              />
            ))}
            <div className="absolute inset-5 rounded-full border-2 border-gold/40 bg-deep frame-plate" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse">
                <KeyholeSVG className="w-36 h-36 xl:w-44 xl:h-44" />
              </div>
            </div>
          </div>
          <p className="mt-8 font-mono2 text-[10px] tracking-[0.4em] text-gold/70">{s.vaultCaption}</p>
          <p className="mt-3 flex items-center gap-2 font-mono2 text-[9px] tracking-[0.3em] text-bloodglow">
            <Fingerprint className="w-3.5 h-3.5" /> {s.zoneWarning}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
          <motion.form
            key={fails}
            animate={fails ? { x: [0, -9, 9, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            data-testid="admin-login-form"
            onSubmit={submit}
            className="relative border-2 border-gold/30 bg-parch/90 frame-plate p-8 sm:p-10"
          >
            {[["top-2", "left-2"], ["top-2", "right-2"], ["bottom-2", "left-2"], ["bottom-2", "right-2"]].map(([v, h]) => (
              <span key={v + h} className={`absolute ${v} ${h} w-2 h-2 rounded-full bg-gold/50`} aria-hidden="true" />
            ))}

            <div className="text-center mb-8">
              <div className="mx-auto mb-3 w-16 h-16 lg:hidden">
                <KeyholeSVG className="w-16 h-16" />
              </div>
              <h1 className="font-display text-3xl sm:text-4xl text-gold mb-2">{s.title}</h1>
              <p className="font-fell italic text-base text-bone/70">{s.subtitle}</p>
            </div>

            <label className="flex items-center gap-2 font-mono2 text-[10px] tracking-[0.3em] text-gold mb-2" htmlFor="admin-email">
              <Mail className="w-3.5 h-3.5" /> {s.emailLabel}
            </label>
            <input
              id="admin-email"
              data-testid="admin-login-input-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full bg-ink/70 border border-gold/25 px-4 py-3 font-fell text-base text-bone focus:border-gold focus:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all mb-5"
            />

            <label className="flex items-center gap-2 font-mono2 text-[10px] tracking-[0.3em] text-gold mb-2" htmlFor="admin-password">
              <KeyRound className="w-3.5 h-3.5" /> {s.pwLabel}
            </label>
            <div className="relative mb-2">
              <input
                id="admin-password"
                data-testid="admin-login-input-password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={s.pwPh}
                autoComplete="current-password"
                className="w-full bg-ink/70 border border-gold/25 px-4 py-3 pr-12 font-fell text-base text-bone focus:border-gold focus:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all"
              />
              <button
                type="button"
                data-testid="admin-login-toggle-pw"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? s.hidePw : s.showPw}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mist hover:text-gold transition-colors"
              >
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {fails > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                data-testid="login-attempts"
                className="mt-3 font-mono2 text-[9px] tracking-[0.25em] text-bloodglow flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 shrink-0" /> {s.attemptsLeft(Math.max(0, 5 - fails))}
              </motion.p>
            )}

            <button
              type="submit"
              data-testid="admin-login-btn"
              disabled={busy}
              className="mt-6 w-full font-display text-2xl tracking-wider py-3.5 bg-gold text-ink hover:bg-goldlight hover:shadow-[0_0_35px_rgba(212,175,55,0.4)] disabled:opacity-60 transition-all duration-300"
            >
              {busy ? s.submitting : s.submit}
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            data-testid="login-recruit-box"
            className="mt-6 border border-gold/20 bg-deck/70 p-5 text-center"
          >
            <p className="font-display text-xl text-bone mb-1">{s.recruitTitle}</p>
            <p className="font-fell italic text-sm text-bone/70 mb-3">{s.recruitText}</p>
            <button
              data-testid="login-recruit-btn"
              onClick={() => navigate("/suivi")}
              className="inline-flex items-center gap-2 font-mono2 text-[10px] tracking-[0.3em] text-gold border border-gold/40 px-5 py-2.5 hover:bg-gold/10 transition-all"
            >
              <Anchor className="w-4 h-4" /> {s.recruitBtn}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function AppRow({ app, onUpdate, onDelete, history }) {
  const { c, lang } = useLang();
  const d = c.admin.dash;
  const locale = lang === "fr" ? "fr-FR" : "en-GB";
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(app.note || "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      data-testid={`admin-app-row-${app.id}`}
      className="border border-gold/15 bg-deck/60 hover:border-gold/35 transition-colors"
    >
      <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center px-4 sm:px-6 py-4 cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <div className="col-span-11 sm:col-span-3 flex items-center gap-3 min-w-0">
          <ChevronDown className={`w-4 h-4 text-gold shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
          <div className="min-w-0">
            <p className="font-display text-xl text-bone truncate">
              {app.pseudo}
              {history && (
                <span
                  data-testid={`admin-attempt-badge-${app.id}`}
                  className="ml-2 inline-block align-middle border border-amber-500/50 bg-amber-500/10 text-amber-400 font-mono2 text-[8px] tracking-[0.2em] px-1.5 py-0.5"
                >
                  {d.attemptBadge(history.attempt)}
                </span>
              )}
            </p>
            <p className="font-mono2 text-[9px] tracking-[0.2em] text-gold">{app.tracking_code}</p>
          </div>
        </div>
        <div className="hidden sm:block sm:col-span-2">
          <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">{d.power}</p>
          <p className="font-fell text-base text-goldlight">{app.power}</p>
        </div>
        <div className="hidden md:block md:col-span-2">
          <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">{d.troops}</p>
          <p className="font-fell text-base text-bone/80 truncate">{app.troops}</p>
        </div>
        <div className="hidden lg:block lg:col-span-2">
          <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">{d.discord}</p>
          <p className="font-fell text-base text-bone/80 truncate">{app.discord}</p>
        </div>
        <div className="col-span-1 sm:col-span-1 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <StatusBadge status={app.status} />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden border-t border-gold/10"
          >
            <div className="px-4 sm:px-6 py-5 grid md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div>
                  <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1">{d.activity}</p>
                  <p className="font-fell text-base text-bone/85">{app.activity}</p>
                </div>
                <div>
                  <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1">{d.experience}</p>
                  <p className="font-fell text-base text-bone/85 whitespace-pre-wrap">
                    {app.experience || d.noExp}
                  </p>
                </div>
                <div>
                  <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1">{d.message}</p>
                  <p className="font-fell text-base text-bone/85 whitespace-pre-wrap">{app.message}</p>
                </div>
                <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">
                  {d.filedOn}{frDate(app.created_at, locale).toUpperCase()}
                </p>
                {history && (
                  <p
                    data-testid={`admin-prev-decision-${app.id}`}
                    className="font-fell text-sm text-amber-400/90 border-l-2 border-amber-500/40 pl-3"
                  >
                    {d.prevDecision} {c.status[history.prev.status]?.label} — {frDate(history.prev.created_at, locale)}
                  </p>
                )}
              </div>
              <div>
                <label className="block font-mono2 text-[9px] tracking-[0.2em] text-gold mb-2" htmlFor={`note-${app.id}`}>
                  {d.noteLabel}
                </label>
                <textarea
                  id={`note-${app.id}`}
                  data-testid={`admin-note-input-${app.id}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={d.notePh}
                  className="w-full bg-ink/70 border border-gold/25 px-3 py-2.5 font-fell text-sm text-bone focus:border-gold transition-all min-h-[70px] resize-y mb-4"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    data-testid={`admin-action-approve-${app.id}`}
                    onClick={() => onUpdate(app, "accepted", note)}
                    className="font-mono2 text-[10px] tracking-[0.2em] px-4 py-2.5 border border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  >
                    {d.accept}
                  </button>
                  <button
                    data-testid={`admin-action-reject-${app.id}`}
                    onClick={() => onUpdate(app, "rejected", note)}
                    className="font-mono2 text-[10px] tracking-[0.2em] px-4 py-2.5 border border-blood/60 text-bloodglow hover:bg-blood/10 transition-all"
                  >
                    {d.reject}
                  </button>
                  <button
                    data-testid={`admin-action-pending-${app.id}`}
                    onClick={() => onUpdate(app, "pending", note)}
                    className="font-mono2 text-[10px] tracking-[0.2em] px-4 py-2.5 border border-gold/40 text-gold hover:bg-gold/10 transition-all"
                  >
                    {d.pending}
                  </button>
                  <button
                    data-testid={`admin-action-reserve-${app.id}`}
                    onClick={() => onUpdate(app, "reserve", note)}
                    className="font-mono2 text-[10px] tracking-[0.2em] px-4 py-2.5 border border-amber-500/60 text-amber-400 hover:bg-amber-500/10 transition-all"
                  >
                    {d.reserve}
                  </button>
                  <button
                    data-testid={`admin-action-delete-${app.id}`}
                    onClick={() => onDelete(app)}
                    className="ml-auto inline-flex items-center gap-1.5 font-mono2 text-[10px] tracking-[0.2em] px-3 py-2.5 text-mist hover:text-bloodglow transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {d.burn}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ConvList({ onOpen }) {
  const { c, lang } = useLang();
  const d = c.admin.dash;
  const [convs, setConvs] = useState(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("unread");
  const locale = lang === "fr" ? "fr-FR" : "en-GB";

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/conversations");
      setConvs(data);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  if (convs === null) {
    return <p className="text-center font-mono2 text-xs tracking-[0.3em] text-mist pt-14">{c.admin.loading}</p>;
  }

  const visible = convs
    .filter((cv) => {
      if (!q.trim()) return true;
      const needle = q.trim().toLowerCase();
      return (
        cv.pseudo.toLowerCase().includes(needle) ||
        cv.code.toLowerCase().includes(needle) ||
        (cv.last_text || "").toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => {
      if (sort === "unread") {
        return (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0) || b.last_at.localeCompare(a.last_at);
      }
      if (sort === "alpha") return a.pseudo.localeCompare(b.pseudo, "fr");
      return b.last_at.localeCompare(a.last_at);
    });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6" data-testid="admin-conv-toolbar">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-mist absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            data-testid="admin-conv-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={d.convSearch}
            className="w-full bg-ink/70 border border-gold/25 pl-10 pr-4 py-2.5 font-fell text-sm text-bone placeholder:text-mist/50 focus:border-gold transition-all"
          />
        </div>
        <select
          data-testid="admin-conv-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-ink/70 border border-gold/25 px-4 py-2.5 font-mono2 text-[10px] tracking-[0.2em] text-gold cursor-pointer focus:border-gold transition-all"
        >
          {d.convSort.map((o) => (
            <option key={o.key} value={o.key} className="bg-deck text-bone">{o.label}</option>
          ))}
        </select>
        <span
          data-testid="admin-conv-count"
          className="hidden sm:inline-flex items-center font-mono2 text-[9px] tracking-[0.25em] text-mist border border-gold/15 px-3"
        >
          {convs.length} {d.convCountLabel}
        </span>
      </div>

      {convs.length === 0 ? (
        <div data-testid="admin-conv-empty" className="border border-dashed border-gold/25 bg-deck/40 p-14 text-center">
          <Anchor className="w-8 h-8 text-gold/60 mx-auto mb-4" />
          <p className="font-display text-2xl text-bone/70 mb-2">{d.emptyTitle}</p>
          <p className="font-fell italic text-base text-mist">{d.convEmpty}</p>
        </div>
      ) : visible.length === 0 ? (
        <div data-testid="admin-conv-nomatch" className="border border-dashed border-gold/25 bg-deck/40 p-14 text-center">
          <p className="font-fell italic text-base text-mist">{d.convNoMatch}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((cv) => (
            <button
              key={cv.code}
              data-testid={`admin-conv-${cv.code}`}
              onClick={() => onOpen(cv)}
              className={`w-full text-left border p-5 flex items-center justify-between gap-4 transition-all ${
                cv.unread > 0
                  ? "border-gold/45 bg-gold/[0.06] hover:border-gold"
                  : "border-gold/15 bg-deck/60 hover:border-gold/45"
              }`}
            >
              <div className="min-w-0">
                <p className="font-display text-xl text-bone truncate">
                  {cv.unread > 0 && <span className="inline-block w-2 h-2 rounded-full bg-bloodglow mr-2 align-middle" />}
                  {cv.pseudo}{" "}
                  <span className="font-mono2 text-[9px] tracking-[0.2em] text-gold ml-1">{cv.code}</span>
                </p>
                <p className={`font-fell text-sm truncate ${cv.unread > 0 ? "text-bone/90" : "text-bone/60"}`}>
                  {cv.last_text ? `${cv.last_sender === "council" ? "⚖ " : ""}${cv.last_text}` : "…"}
                </p>
                <p className="font-mono2 text-[8px] tracking-[0.2em] text-mist mt-1">
                  {frDate(cv.last_at, locale).toUpperCase()}
                </p>
              </div>
              {cv.unread > 0 && (
                <span
                  data-testid={`admin-conv-unread-${cv.code}`}
                  className="shrink-0 bg-blood text-bone font-mono2 text-[9px] tracking-[0.2em] px-2.5 py-1.5"
                >
                  {cv.unread} {d.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { c } = useLang();
  const a = c.admin;
  const [authed, setAuthed] = useState(null);
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("registry");
  const [activeConv, setActiveConv] = useState(null);
  const [badges, setBadges] = useState({ unread: 0, pending: 0 });

  const loadAll = useCallback(async () => {
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get("/admin/applications"),
        api.get("/admin/stats"),
      ]);
      setApps(listRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  }, []);

  useEffect(() => {
    api
      .get("/auth/me")
      .then(() => {
        setAuthed(true);
        loadAll();
      })
      .catch(() => setAuthed(false));
  }, [loadAll]);

  useEffect(() => {
    if (authed !== true) return;
    let stop = false;
    const load = async () => {
      try {
        const [convRes, statsRes] = await Promise.all([api.get("/admin/conversations"), api.get("/admin/stats")]);
        if (stop) return;
        setBadges({
          unread: convRes.data.reduce((acc, x) => acc + (x.unread || 0), 0),
          pending: statsRes.data.pending,
        });
        setStats(statsRes.data);
      } catch {
        /* polling silencieux — jamais de crash */
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [authed]);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAuthed(false);
      setApps([]);
      setStats(null);
      setActiveConv(null);
      setView("registry");
      toast.success(a.toast.logout);
    }
  };

  const onUpdate = async (app, status, note) => {
    try {
      const { data } = await api.patch(`/admin/applications/${app.id}`, { status, note });
      setApps((list) => list.map((x) => (x.id === app.id ? data : x)));
      await loadAll();
      toast.success(a.toast.updated(data.pseudo));
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const onDelete = async (app) => {
    if (!window.confirm(a.toast.confirm(app.pseudo))) return;
    try {
      await api.delete(`/admin/applications/${app.id}`);
      setApps((list) => list.filter((x) => x.id !== app.id));
      await loadAll();
      toast.success(a.toast.burned(app.pseudo));
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const pseudoGroups = {};
  apps.forEach((a) => {
    const k = (a.pseudo || "").trim().toLowerCase();
    (pseudoGroups[k] = pseudoGroups[k] || []).push(a);
  });
  Object.values(pseudoGroups).forEach((list) =>
    list.sort((x, y) => (x.created_at || "").localeCompare(y.created_at || ""))
  );
  const getHistory = (app) => {
    const list = pseudoGroups[(app.pseudo || "").trim().toLowerCase()] || [];
    const idx = list.indexOf(app);
    return idx > 0 ? { attempt: idx + 1, prev: list[idx - 1] } : null;
  };

  const visible = apps.filter((x) => {
    if (filter !== "all" && x.status !== filter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        x.pseudo.toLowerCase().includes(q) ||
        x.tracking_code.toLowerCase().includes(q) ||
        x.discord.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-ink min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 pt-28 md:pt-36 pb-24" data-testid="admin-section">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {authed === null && (
            <p className="text-center font-mono2 text-xs tracking-[0.3em] text-mist pt-20">{a.loading}</p>
          )}
          {authed === false && <LoginScreen onAuthed={() => { setAuthed(true); loadAll(); }} />}
          {authed === true && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                  <p className="font-mono2 text-[11px] tracking-[0.35em] text-gold mb-3">{a.dash.eyebrow}</p>
                  <h1 className="font-display text-4xl sm:text-5xl text-bone">{a.dash.title}</h1>
                </div>
                <button
                  data-testid="admin-logout-btn"
                  onClick={logout}
                  className="inline-flex items-center gap-2 font-mono2 text-[10px] tracking-[0.25em] px-5 py-3 border border-gold/40 text-gold hover:bg-gold/10 transition-all"
                >
                  <LogOut className="w-4 h-4" /> {a.dash.logout}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-10" data-testid="admin-tabs">
                {a.dash.tabs.map((t) => (
                  <button
                    key={t.key}
                    data-testid={`admin-tab-${t.key}`}
                    onClick={() => {
                      setView(t.key);
                      setActiveConv(null);
                    }}
                    className={`inline-flex items-center gap-2 font-mono2 text-[10px] tracking-[0.25em] px-5 py-3 border transition-all ${
                      view === t.key
                        ? "border-gold text-gold bg-gold/10"
                        : "border-gold/20 text-mist hover:border-gold/50 hover:text-gold"
                    }`}
                  >
                    {t.key === "messages" && <MessagesSquare className="w-4 h-4" />}
                    {t.label}
                    {((t.key === "messages" && badges.unread > 0) || (t.key === "registry" && badges.pending > 0)) && (
                      <span
                        data-testid={`admin-tab-badge-${t.key}`}
                        className="bg-blood text-bone font-mono2 text-[9px] tracking-[0.1em] px-1.5 py-0.5"
                      >
                        {t.key === "messages" ? badges.unread : badges.pending}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {view === "messages" ? (
                activeConv ? (
                  <div data-testid="admin-thread">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div>
                        <p className="font-display text-2xl sm:text-3xl text-bone">{activeConv.pseudo}</p>
                        <p className="font-mono2 text-[9px] tracking-[0.25em] text-gold">{activeConv.code}</p>
                      </div>
                      <button
                        data-testid="admin-thread-back"
                        onClick={() => setActiveConv(null)}
                        className="font-mono2 text-[10px] tracking-[0.25em] px-4 py-2.5 border border-gold/40 text-gold hover:bg-gold/10 transition-all"
                      >
                        {a.dash.convBack}
                      </button>
                    </div>
                    <ChatBox code={activeConv.code} sender="council" testPrefix="admin-chat" />
                  </div>
                ) : (
                  <ConvList onOpen={setActiveConv} />
                )
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10" data-testid="admin-dashboard">
                    {a.dash.stats.map((st) => (
                      <div key={st.key} data-testid={`admin-stat-${st.key}`} className="border border-gold/15 bg-deck/60 p-5">
                        <p className={`font-display text-4xl sm:text-5xl ${statCls[st.key]}`}>{stats?.[st.key] ?? 0}</p>
                        <p className="font-mono2 text-[9px] tracking-[0.3em] text-mist mt-2">{st.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="flex flex-wrap gap-2">
                      {a.dash.filters.map((f) => (
                        <button
                          key={f.key}
                          data-testid={`admin-filter-${f.key}`}
                          onClick={() => setFilter(f.key)}
                          className={`font-mono2 text-[10px] tracking-[0.25em] px-4 py-2.5 border transition-all ${
                            filter === f.key
                              ? "border-gold text-gold bg-gold/10"
                              : "border-gold/20 text-mist hover:border-gold/50 hover:text-gold"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <div className="relative sm:ml-auto sm:w-72">
                      <Search className="w-4 h-4 text-mist absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        data-testid="admin-search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={a.dash.searchPh}
                        className="w-full bg-ink/70 border border-gold/25 pl-10 pr-4 py-2.5 font-fell text-sm text-bone placeholder:text-mist/50 focus:border-gold transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {visible.length === 0 ? (
                      <div data-testid="admin-empty-state" className="border border-dashed border-gold/25 bg-deck/40 p-14 text-center">
                        <p className="font-display text-2xl text-bone/70 mb-2">{a.dash.emptyTitle}</p>
                        <p className="font-fell italic text-base text-mist">{a.dash.emptyText}</p>
                      </div>
                    ) : (
                      visible.map((app) => (
                        <AppRow key={app.id} app={app} onUpdate={onUpdate} onDelete={onDelete} history={getHistory(app)} />
                      ))
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
