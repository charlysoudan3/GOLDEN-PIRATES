import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ChevronDown, LogOut, Search, Trash2, MessagesSquare, Anchor, Mail, KeyRound, Eye, EyeOff, Lock, Fingerprint, FileSpreadsheet, FileText, Loader2, Feather, X } from "lucide-react";
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

function LoginScreen({ onAuthed, checking = false }) {
  const { c } = useLang();
  const s = c.admin.login;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/admin/login", { email, password });
      toast.success(c.admin.toast.welcome(data.email));
      onAuthed();
      window.dispatchEvent(new Event("gp-auth-changed"));
    } catch (err) {
      if (err?.response?.status === 429) setError(err?.response?.data?.detail || s.sealed);
      else if (err?.response?.status === 401) {
        setFails((f) => Math.min(f + 1, 5));
        setError(s.badSecret);
      } else if (err?.code === "ECONNABORTED" || err?.message === "Network Error") setError(s.storm);
      else setError(formatApiError(err));
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
              {checking && (
                <p
                  data-testid="admin-login-checking"
                  className="mt-3 font-mono2 text-[9px] tracking-[0.3em] text-mist/70 animate-pulse"
                >
                  {s.checking}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 font-mono2 text-[10px] tracking-[0.3em] text-gold mb-2" htmlFor="admin-email">
              <Mail className="w-3.5 h-3.5" /> {s.emailLabel}
            </label>
            <input
              id="admin-email"
              data-testid="admin-login-input-email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
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
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
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

            {fails > 0 && !error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                data-testid="login-attempts"
                className="mt-3 font-mono2 text-[9px] tracking-[0.25em] text-bloodglow flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 shrink-0" /> {s.attemptsLeft(Math.max(0, 5 - fails))}
              </motion.p>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                data-testid="admin-login-error"
                className="mt-3 border border-bloodglow/45 bg-bloodglow/10 px-4 py-3 font-mono2 text-[10px] leading-relaxed tracking-[0.12em] text-bloodglow flex items-start gap-2"
              >
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" /> <span>{error}</span>
              </motion.p>
            )}

            <button
              type="submit"
              data-testid="admin-login-btn"
              disabled={busy}
              className="mt-6 w-full font-display text-2xl tracking-wider py-3.5 bg-gold text-ink hover:bg-goldlight hover:shadow-[0_0_35px_rgba(212,175,55,0.4)] disabled:opacity-60 disabled:cursor-wait transition-all duration-300"
            >
              {busy ? (
                <span className="inline-flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" /> {s.submitting}
                </span>
              ) : (
                s.submit
              )}
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
        <div className="col-span-12 sm:col-span-3 flex items-center gap-3 min-w-0">
          <ChevronDown className={`w-4 h-4 text-gold shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
          <div className="min-w-0">
            <p className="font-display text-xl text-bone truncate">
              {app.pseudo}
              {app.code_recovered_at && (
                <span
                  data-testid={`admin-recovered-badge-${app.id}`}
                  className="ml-2 inline-block align-middle border border-amber-500/50 bg-amber-500/10 text-amber-400 font-mono2 text-[8px] tracking-[0.2em] px-1.5 py-0.5"
                >
                  {d.recoveredBadge}
                </span>
              )}
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
        <div className="hidden sm:block sm:col-span-2 min-w-0">
          <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">{d.power}</p>
          <p className="font-fell text-base text-goldlight truncate">{app.power}</p>
        </div>
        <div className="hidden md:block md:col-span-2 min-w-0">
          <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">{d.troops}</p>
          <p className="font-fell text-base text-bone/80 line-clamp-2">{app.troops}</p>
        </div>
        <div className="hidden lg:block lg:col-span-2 min-w-0">
          <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">{d.discord}</p>
          <p className="font-fell text-base text-bone/80 line-clamp-2">{app.discord}</p>
        </div>
        <div className="col-span-12 sm:col-span-2 flex justify-end min-w-0" onClick={(e) => e.stopPropagation()}>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1">{d.power}</p>
                    <p className="font-fell text-base text-goldlight">{app.power}</p>
                  </div>
                  <div>
                    <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1">{d.discord}</p>
                    <p className="font-fell text-base text-bone/85 break-words">{app.discord}</p>
                  </div>
                </div>
                <div>
                  <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1">{d.troops}</p>
                  <p className="font-fell text-base text-bone/85 break-words">{app.troops}</p>
                </div>
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
                {app.peer_note !== undefined && (
                  <div data-testid={`admin-sea-note-${app.id}`}>
                    <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1 flex items-center gap-1.5">
                      <Feather className="w-3 h-3 text-gold shrink-0" /> {d.seaNote}
                    </p>
                    <p className="font-fell italic text-base text-goldlight/85 whitespace-pre-wrap">
                      {app.peer_note ? `« ${app.peer_note} »` : d.noExp}
                    </p>
                  </div>
                )}
                <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">
                  {d.filedOn}{frDate(app.created_at, locale).toUpperCase()}
                </p>
                {history && (
                  <p
                    data-testid={`admin-prev-decision-${app.id}`}
                    className="font-fell text-sm text-amber-400/90 border-l-2 border-amber-500/40 pl-3"
                  >
                    {d.prevDecision} {c.status[history.prev.status]?.label || "—"} — {frDate(history.prev.created_at, locale)}
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

function ButinPanel() {
  const { c, lang } = useLang();
  const a = c.admin.dash;
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pseudo, setPseudo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [goal, setGoal] = useState("");
  const [goalBusy, setGoalBusy] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);

  const load = () =>
    api.get("/donators")
      .then(({ data }) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setGoal((prev) => (prev === "" ? String(data.goal ?? "") : prev));
      })
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (busy) return;
    const amt = parseFloat((amount || "").replace(",", "."));
    if (pseudo.trim().length < 2 || !(amt >= 0.5)) return;
    setBusy(true);
    try {
      await api.post("/admin/donators", { pseudo: pseudo.trim(), amount: amt });
      setPseudo("");
      setAmount("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await load();
      toast.success(a.butin.added);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/admin/donators/${id}`);
      await load();
      toast.success(a.butin.removed);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const saveGoal = async () => {
    if (goalBusy) return;
    const g = parseFloat((goal || "").replace(",", "."));
    if (!(g >= 1)) {
      toast.error(a.butin.goalInvalid);
      return;
    }
    setGoalBusy(true);
    try {
      await api.put("/admin/butin/goal", { goal: g });
      setGoalSaved(true);
      setTimeout(() => setGoalSaved(false), 2500);
      toast.success(a.butin.goalSaved);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setGoalBusy(false);
    }
  };

  return (
    <div data-testid="admin-butin-panel">
      <p className="font-fell text-base text-mist mb-8 max-w-2xl">{a.butin.sub}</p>

      <div className="grid sm:grid-cols-[1fr_150px_auto] gap-3 items-end border border-gold/25 bg-deck/60 p-5 mb-8">
        <div>
          <label className="block font-mono2 text-[9px] tracking-[0.25em] text-gold/80 mb-1.5">{a.butin.pseudoLabel}</label>
          <input
            data-testid="butin-pseudo-input"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={40}
            autoComplete="off"
            className="w-full bg-ink/70 border border-gold/25 px-4 py-2.5 font-fell text-base text-bone placeholder:text-bone/40 focus:border-gold transition-all"
          />
        </div>
        <div>
          <label className="block font-mono2 text-[9px] tracking-[0.25em] text-gold/80 mb-1.5">{a.butin.amountLabel}</label>
          <input
            data-testid="butin-amount-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            inputMode="decimal"
            maxLength={8}
            autoComplete="off"
            className="w-full bg-ink/70 border border-gold/25 px-4 py-2.5 font-fell text-lg text-bone placeholder:text-bone/40 focus:border-gold transition-all"
          />
        </div>
        <button
          type="button"
          data-testid="butin-add-btn"
          onClick={add}
          disabled={busy || pseudo.trim().length < 2 || !(parseFloat((amount || "").replace(",", ".")) >= 0.5)}
          className={`font-mono2 text-[10px] tracking-[0.2em] px-6 py-3 border transition-all duration-300 ${
            saved ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-300" : "bg-gold text-ink border-gold hover:bg-goldlight"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saved ? a.butin.saved : a.butin.add}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 border border-gold/25 bg-deck/60 p-5 mb-8">
        <div className="flex-1">
          <label className="block font-mono2 text-[9px] tracking-[0.25em] text-gold/80 mb-1.5">{a.butin.goalLabel}</label>
          <input
            data-testid="butin-goal-input"
            value={goal}
            onChange={(e) => setGoal(e.target.value.replace(/[^\d.,]/g, ""))}
            inputMode="decimal"
            maxLength={8}
            autoComplete="off"
            className="w-full bg-ink/70 border border-gold/25 px-4 py-2.5 font-fell text-lg text-bone placeholder:text-bone/40 focus:border-gold transition-all"
          />
        </div>
        <button
          type="button"
          data-testid="butin-goal-save"
          onClick={saveGoal}
          disabled={goalBusy || !(parseFloat((goal || "").replace(",", ".")) >= 1)}
          className={`font-mono2 text-[10px] tracking-[0.2em] px-6 py-3 border transition-all duration-300 ${
            goalSaved ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-300" : "bg-gold text-ink border-gold hover:bg-goldlight"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {goalSaved ? a.butin.goalSaved : a.butin.goalSave}
        </button>
      </div>

      <p className="font-mono2 text-[11px] tracking-[0.3em] text-emerald-300 mb-6" data-testid="butin-total">
        {a.butin.total} : {total.toFixed(2)} € · {items.length} {a.butin.giftsLabel}
      </p>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} data-testid={`butin-row-${it.id}`} className="flex items-center gap-4 border border-gold/20 bg-deck/50 px-4 py-3">
              <div aria-hidden className="w-9 h-9 rounded-full bg-gold border border-goldlight flex items-center justify-center shrink-0 rotate-3">
                <span className="font-display text-base text-ink">{(it.pseudo || "?").trim().charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg text-bone truncate">{it.pseudo}</p>
                <p className="font-mono2 text-[9px] tracking-[0.15em] text-mist mt-0.5" data-testid={`butin-date-${it.id}`}>
                  {it.created_at
                    ? new Date(it.created_at).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
                      " · " +
                      new Date(it.created_at).toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-GB", { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </p>
              </div>
              <p className="font-mono2 text-[10px] tracking-[0.15em] text-gold shrink-0">{it.amount.toFixed(2)} €</p>
              <button
                type="button"
                data-testid={`butin-remove-${it.id}`}
                onClick={() => remove(it.id)}
                className="font-mono2 text-[9px] tracking-[0.2em] text-red-400/80 hover:text-red-400 border border-red-400/30 hover:border-red-400/60 px-3 py-1.5 shrink-0 transition-all"
              >
                {a.butin.remove}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-fell italic text-base text-mist border border-gold/15 bg-deck/40 p-6 text-center">{a.butin.empty}</p>
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
  const [exporting, setExporting] = useState(null);
  const [langAsk, setLangAsk] = useState(null);

  // Lien direct du footer Conseil → onglet MESSAGERIE (/admin#messagerie)
  useEffect(() => {
    if (authed && window.location.hash === "#messagerie") setView("messages");
    if (authed && window.location.hash === "#registry") setView("registry");
  }, [authed]);

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
      window.dispatchEvent(new Event("gp-auth-changed"));
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

  const downloadExport = async (fmt, lang = "fr") => {
    if (exporting) return;
    setExporting(fmt);
    setLangAsk(null);
    try {
      // Délai étendu : un gros registre sur réseau lent ne doit pas casser l'export
      const { data, headers } = await api.get(`/admin/export/${fmt}`, { params: { lang }, responseType: "blob", timeout: 120000 });
      const m = /filename="?([^";]+)"?/.exec(headers?.["content-disposition"] || "");
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = m ? m[1] : `golden-pirates-registre-${new Date().toISOString().slice(0, 10)}.${fmt}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(a.dash.exportDone);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setExporting(null);
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
          {authed !== true && (
            <LoginScreen
              checking={authed === null}
              onAuthed={() => { setAuthed(true); loadAll(); }}
            />
          )}
          {authed === true && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                  <p className="font-mono2 text-[11px] tracking-[0.35em] text-gold mb-3">{a.dash.eyebrow}</p>
                  <h1 className="font-display text-4xl sm:text-5xl text-bone">
                    {view === "messages" ? a.dash.titleMessages : view === "butin" ? a.dash.titleButin : a.dash.title}
                  </h1>
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

              {view === "butin" ? (
                <ButinPanel />
              ) : view === "messages" ? (
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
                    <ChatBox code={activeConv.code} sender="council" testPrefix="admin-chat" peerName={activeConv.pseudo} />
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

                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 mb-8">
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
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto">
                      <div className="flex gap-2" data-testid="admin-export-cluster">
                        <button
                          data-testid="admin-export-xlsx"
                          onClick={() => setLangAsk("xlsx")}
                          disabled={exporting !== null || langAsk !== null}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-mono2 text-[10px] tracking-[0.2em] px-3.5 py-2.5 border border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/60 disabled:opacity-50 transition-all"
                        >
                          <FileSpreadsheet className="w-4 h-4 shrink-0" />
                          {exporting === "xlsx" ? a.dash.exportBusy : a.dash.exportXlsx}
                        </button>
                        <button
                          data-testid="admin-export-pdf"
                          onClick={() => setLangAsk("pdf")}
                          disabled={exporting !== null || langAsk !== null}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-mono2 text-[10px] tracking-[0.2em] px-3.5 py-2.5 border border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/60 disabled:opacity-50 transition-all"
                        >
                          <FileText className="w-4 h-4 shrink-0" />
                          {exporting === "pdf" ? a.dash.exportBusy : a.dash.exportPdf}
                        </button>
                      </div>
                      <div className="relative sm:w-72 shrink-0">
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
      {langAsk && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/85 backdrop-blur-sm px-4"
          onClick={() => setLangAsk(null)}
        >
          <div
            data-testid="export-lang-modal"
            className="relative w-full max-w-md border-2 border-gold/60 bg-deck p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              data-testid="export-lang-cancel"
              onClick={() => setLangAsk(null)}
              aria-label="Fermer"
              className="absolute top-3 right-3 text-mist hover:text-gold transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="font-display text-3xl text-gold uppercase tracking-wide mb-3">{a.dash.exportAskTitle}</p>
            <p className="font-fell text-base text-mist mb-6">{a.dash.exportAskSub}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                data-testid="export-lang-fr"
                onClick={() => downloadExport(langAsk, "fr")}
                className="font-mono2 text-xs tracking-[0.25em] py-3.5 border border-gold/40 text-gold hover:bg-gold/10 transition-all"
              >
                {a.dash.exportFr}
              </button>
              <button
                type="button"
                data-testid="export-lang-en"
                onClick={() => downloadExport(langAsk, "en")}
                className="font-mono2 text-xs tracking-[0.25em] py-3.5 border border-gold/40 text-gold hover:bg-gold/10 transition-all"
              >
                {a.dash.exportEn}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
