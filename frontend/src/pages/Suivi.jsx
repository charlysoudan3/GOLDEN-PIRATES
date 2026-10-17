import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Compass, FileQuestion, Bell, RefreshCw, ScrollText, Anchor as AnchorIcon, RotateCcw, X } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import ChatBox from "@/components/ChatBox";
import api, { formatApiError } from "@/lib/api";
import { useLang } from "@/lib/i18n";

const EASE = [0.16, 1, 0.3, 1];
const RACK_KEY = "gp_bottles";

const loadRack = () => {
  try {
    const v = JSON.parse(localStorage.getItem(RACK_KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const STATUS_DOT = {
  pending: "bg-gold",
  accepted: "bg-emerald-400",
  rejected: "bg-bloodglow",
  reserve: "bg-amber-400",
};

export default function Suivi() {
  const { c, lang } = useLang();
  const s = c.suivi;
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [notif, setNotif] = useState(null);
  const [rack, setRack] = useState(loadRack);

  useEffect(() => {
    if (!result) {
      setNotif(null);
      return;
    }
    let stop = false;
    const load = async () => {
      try {
        const { data } = await api.get(`/notifications/${result.tracking_code}`);
        if (!stop) setNotif(data);
      } catch {
        if (!stop) setNotif(null);
      }
    };
    load();
    const t = setInterval(load, 10000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [result]);

  useEffect(() => {
    const base = "GOLDEN PIRATES — Royaume 1023 | Call of Dragons";
    document.title = notif?.unread_messages ? `(${notif.unread_messages}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [notif?.unread_messages]);

  const persistRack = (next) => {
    try {
      localStorage.setItem(RACK_KEY, JSON.stringify(next));
    } catch {
      /* stockage indisponible : l'étagère vivra seulement pour la session */
    }
  };

  const saveToRack = (tcode, pseudo, status) => {
    setRack((prev) => {
      const next = [{ code: tcode, pseudo, status, at: Date.now() }, ...prev.filter((x) => x.code !== tcode)].slice(0, 6);
      persistRack(next);
      return next;
    });
  };

  const dropFromRack = (tcode) => {
    setRack((prev) => {
      const next = prev.filter((x) => x.code !== tcode);
      persistRack(next);
      return next;
    });
  };

  const runCheck = async (raw) => {
    const clean = raw.trim().toUpperCase();
    if (!clean) {
      setError(s.empty);
      setNotFound(false);
      setResult(null);
      return;
    }
    setChecking(true);
    setError("");
    setNotFound(false);
    try {
      const { data } = await api.get(`/applications/track/${encodeURIComponent(clean)}`);
      setResult(data);
      saveToRack(data.tracking_code, data.pseudo, data.status);
    } catch (err) {
      setResult(null);
      const is404 = err?.response?.status === 404;
      setNotFound(is404);
      setError(is404 ? s.notFound : formatApiError(err));
    } finally {
      setChecking(false);
    }
  };

  const check = (e) => {
    e?.preventDefault();
    runCheck(code);
  };

  const reset = () => {
    setResult(null);
    setCode("");
    setError("");
    setNotFound(false);
    document.getElementById("suivi-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const viewRackCode = (tcode) => {
    setCode(tcode);
    runCheck(tcode);
    setTimeout(() => {
      document.getElementById("suivi-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const locale = lang === "fr" ? "fr-FR" : "en-GB";

  return (
    <div className="bg-ink min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 pt-28 md:pt-36 pb-24">
        <section data-testid="status-section" className="max-w-3xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <p className="font-mono2 text-[11px] tracking-[0.35em] text-gold mb-4">{s.eyebrow}</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-bone leading-[1.02] mb-5 uppercase">
              {s.title1}
              <span className="text-gold">{s.titleGold}</span>
            </h1>
            <p className="font-fell italic text-lg text-bone/75 max-w-xl mx-auto">{s.sub}</p>
          </div>

          <form
            id="suivi-form"
            data-testid="status-check-form"
            onSubmit={check}
            className="border border-gold/25 bg-parch/80 frame-plate p-6 sm:p-8"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <label className="font-mono2 text-[10px] tracking-[0.3em] text-gold" htmlFor="track-code">
                {s.codeLabel}
              </label>
              {(result || error) && (
                <button
                  type="button"
                  data-testid="reset-code-btn"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 font-mono2 text-[9px] tracking-[0.25em] text-mist hover:text-gold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {s.resetBtn}
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="track-code"
                data-testid="status-input-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={s.codePh}
                maxLength={12}
                className="flex-1 bg-ink/70 border border-gold/25 px-4 py-3.5 font-mono2 text-lg tracking-[0.2em] text-goldlight placeholder:text-mist/40 focus:border-gold transition-all"
              />
              <button
                type="submit"
                data-testid="status-check-btn"
                disabled={checking}
                className="inline-flex items-center justify-center gap-2 font-display text-xl tracking-wider px-8 py-3.5 bg-gold text-ink hover:bg-goldlight hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] disabled:opacity-60 transition-all duration-300"
              >
                {checking ? <Compass className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {checking ? s.checking : s.check}
              </button>
            </div>
            {error && (
              <p data-testid="status-error" className="mt-4 font-fell text-base text-bloodglow flex items-center gap-2">
                <FileQuestion className="w-5 h-5 shrink-0" /> {error}
              </p>
            )}
            {error && notFound && (
              <p className="mt-2 font-fell italic text-sm text-mist">{s.notFoundHint}</p>
            )}
          </form>

          {notif && (notif.unread_messages > 0 || notif.new_status || notif.new_note) && (
            <motion.div
              data-testid="notif-panel"
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mt-8 border border-blood/50 bg-blood/10 p-5 sm:p-6"
            >
              <p className="flex items-center gap-2 font-mono2 text-[10px] tracking-[0.35em] text-bloodglow mb-4">
                <Bell className="w-4 h-4" />
                {c.notif.title}
                <span
                  data-testid="notif-count"
                  className="ml-auto bg-blood text-bone font-mono2 text-[9px] tracking-[0.2em] px-2 py-1"
                >
                  {(notif.unread_messages > 0 ? 1 : 0) + (notif.new_status ? 1 : 0) + (notif.new_note ? 1 : 0)}
                </span>
              </p>
              <ul className="space-y-3">
                {notif.unread_messages > 0 && (
                  <li data-testid="notif-item-messages" className="font-fell text-base text-bone/90 flex items-center gap-2.5">
                    <ScrollText className="w-4 h-4 text-gold shrink-0" />
                    {c.notif.newMsgs(notif.unread_messages)}
                  </li>
                )}
                {notif.new_status && (
                  <li data-testid="notif-item-status" className="font-fell text-base text-bone/90 flex flex-wrap items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 text-gold shrink-0" />
                    {c.notif.statusChanged}
                    <button
                      data-testid="notif-update-btn"
                      onClick={() => runCheck(result.tracking_code)}
                      className="font-mono2 text-[9px] tracking-[0.25em] border border-gold/50 text-gold px-3 py-1.5 hover:bg-gold/10 transition-all"
                    >
                      {c.notif.updateBtn}
                    </button>
                  </li>
                )}
                {notif.new_note && (
                  <li data-testid="notif-item-note" className="font-fell text-base text-bone/90 flex items-center gap-2.5">
                    <AnchorIcon className="w-4 h-4 text-gold shrink-0" />
                    {c.notif.noteChanged}
                  </li>
                )}
              </ul>
            </motion.div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                data-testid="status-result-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="mt-8 border border-gold/25 bg-deck/80 frame-plate p-7 sm:p-9"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="font-mono2 text-[9px] tracking-[0.3em] text-mist mb-1">{s.codeLabel}</p>
                    <p className="font-display text-3xl text-bone">{result.pseudo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={result.status} size="lg" />
                    {result.new_status && (
                      <span
                        data-testid="status-new-chip"
                        className="bg-blood text-bone font-mono2 text-[9px] tracking-[0.25em] px-2 py-1"
                      >
                        {c.notif.newChip}
                      </span>
                    )}
                  </div>
                </div>
                <div className="border-t border-gold/15 pt-5 space-y-5">
                  <p className="font-fell text-lg text-bone/85">{c.status[result.status]?.long || c.status.pending.long}</p>
                  {result.status === "pending" && (
                    <p
                      data-testid="status-wait-note"
                      className="font-mono2 text-[9px] tracking-[0.25em] text-gold border border-gold/25 bg-gold/5 px-3 py-2 inline-block"
                    >
                      {s.waitNote}
                    </p>
                  )}

                  <div data-testid="status-dossier" className="border border-gold/20 bg-ink/40 p-5">
                    <p className="font-mono2 text-[10px] tracking-[0.3em] text-gold mb-4">{s.dossierTitle}</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        [s.fields.pseudo, result.pseudo],
                        [s.fields.power, result.power],
                        [s.fields.troops, result.troops],
                        [s.fields.activity, result.activity],
                        [s.fields.discord, result.discord],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1">{label}</p>
                          <p className="font-fell text-base text-bone/85 break-words">{value || "—"}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1">{s.fields.experience}</p>
                      <p className="font-fell text-base text-bone/85 whitespace-pre-wrap break-words">
                        {result.experience || s.noExp}
                      </p>
                    </div>
                    <div className="mt-4">
                      <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1">{s.fields.message}</p>
                      <p className="font-fell text-base text-bone/85 whitespace-pre-wrap break-words">{result.message}</p>
                    </div>
                  </div>

                  {result.note ? (
                    <p className="font-fell italic text-base text-goldlight border-l-2 border-gold/40 pl-4">
                      {c.status.note}
                      {result.note}
                      {result.new_note && (
                        <span
                          data-testid="note-new-chip"
                          className="ml-2 bg-blood text-bone font-mono2 text-[9px] tracking-[0.25em] px-2 py-0.5"
                        >
                          {c.notif.newChip}
                        </span>
                      )}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-x-8 gap-y-2 pt-2 font-mono2 text-[10px] tracking-[0.2em] text-mist">
                    <span>
                      {c.status.code}
                      <span className="text-gold">{result.tracking_code}</span>
                    </span>
                    {result.created_at ? (
                      <span>
                        {c.status.filedOn}
                        <span className="text-bone/80">
                          {new Date(result.created_at).toLocaleDateString(locale, {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {result && result.status === "rejected" && (() => {
            const locked = !!result.reapply_at && new Date(result.reapply_at) > new Date();
            return (
              <motion.div
                data-testid="reapply-block"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="mt-6 border border-amber-500/40 bg-amber-500/5 p-6 text-center"
              >
                <p className="font-fell italic text-base text-bone/80 mb-4">
                  {locked
                    ? s.reapplyLocked(new Date(result.reapply_at).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }))
                    : s.reapplyHint}
                </p>
                {locked ? (
                  <span
                    data-testid="reapply-locked-chip"
                    className="inline-block font-mono2 text-[10px] tracking-[0.25em] text-amber-400 border border-amber-500/50 bg-amber-500/10 px-4 py-2"
                  >
                    {s.reapplyLockedLabel}
                  </span>
                ) : (
                  <button
                    data-testid="reapply-btn"
                    onClick={() => navigate("/#postuler")}
                    className="font-display text-xl tracking-wider uppercase px-8 py-3 bg-gold text-ink hover:bg-goldlight hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300"
                  >
                    {s.reapply}
                  </button>
                )}
              </motion.div>
            );
          })()}

          {rack.length > 0 && (
            <motion.div
              data-testid="bottle-rack"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mt-8 border border-gold/20 bg-deck/60 p-5 sm:p-6"
            >
              <p className="flex items-center gap-2 font-mono2 text-[10px] tracking-[0.3em] text-gold mb-4">
                <AnchorIcon className="w-4 h-4" /> {s.rackTitle}
              </p>
              <ul className="space-y-2">
                {rack.map((b) => (
                  <li
                    key={b.code}
                    data-testid={`rack-item-${b.code}`}
                    className="flex items-center justify-between gap-3 border border-gold/15 bg-ink/50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-lg text-bone truncate">
                        {b.pseudo} <span className="font-mono2 text-[9px] text-gold ml-1">{b.code}</span>
                      </p>
                      <p className="font-mono2 text-[8px] tracking-[0.25em] text-mist flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[b.status] || STATUS_DOT.pending}`} />
                        {c.status[b.status]?.label || c.status.pending.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        data-testid={`rack-view-${b.code}`}
                        onClick={() => viewRackCode(b.code)}
                        className="font-mono2 text-[9px] tracking-[0.25em] text-gold border border-gold/40 px-3 py-1.5 hover:bg-gold/10 transition-all"
                      >
                        {s.rackView}
                      </button>
                      <button
                        data-testid={`rack-drop-${b.code}`}
                        onClick={() => dropFromRack(b.code)}
                        aria-label={s.rackRemove}
                        className="p-1.5 text-mist/60 hover:text-bloodglow transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                data-testid="rack-reapply"
                onClick={() => navigate("/#postuler")}
                className="mt-4 w-full font-display text-xl tracking-wider uppercase py-3 border border-gold/40 text-gold hover:bg-gold/10 transition-all"
              >
                {s.reapply}
              </button>
            </motion.div>
          )}

          {result && (
            <motion.div
              data-testid="chat-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mt-10"
            >
              <ChatBox code={result.tracking_code} sender="recruit" testPrefix="chat" />
            </motion.div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
