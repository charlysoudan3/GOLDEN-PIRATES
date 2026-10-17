import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Compass, FileQuestion } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import ChatBox from "@/components/ChatBox";
import api, { formatApiError } from "@/lib/api";
import { useLang } from "@/lib/i18n";

export default function Suivi() {
  const { c, lang } = useLang();
  const s = c.suivi;
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const check = async (e) => {
    e?.preventDefault();
    if (checking) return;
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError(s.empty);
      setResult(null);
      return;
    }
    setChecking(true);
    setError("");
    try {
      const { data } = await api.get(`/applications/track/${encodeURIComponent(clean)}`);
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err?.response?.status === 404 ? s.notFound : formatApiError(err));
    } finally {
      setChecking(false);
    }
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
              {s.title1}<span className="text-gold">{s.titleGold}</span>
            </h1>
            <p className="font-fell italic text-lg text-bone/75 max-w-xl mx-auto">{s.sub}</p>
          </div>

          <form
            data-testid="status-check-form"
            onSubmit={check}
            className="border border-gold/25 bg-parch/80 frame-plate p-6 sm:p-8"
          >
            <label className="block font-mono2 text-[10px] tracking-[0.3em] text-gold mb-2" htmlFor="track-code">
              {s.codeLabel}
            </label>
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
          </form>

          <AnimatePresence>
            {result && (
              <motion.div
                data-testid="status-result-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 border border-gold/25 bg-deck/80 frame-plate p-7 sm:p-9"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="font-mono2 text-[9px] tracking-[0.3em] text-mist mb-1">{s.codeLabel}</p>
                    <p className="font-display text-3xl text-bone">{result.pseudo}</p>
                  </div>
                  <StatusBadge status={result.status} size="lg" />
                </div>
                <div className="border-t border-gold/15 pt-5 space-y-5">
                  <p className="font-fell text-lg text-bone/85">{c.status[result.status]?.long || c.status.pending.long}</p>
                  <p
                    data-testid="status-wait-note"
                    className="font-mono2 text-[9px] tracking-[0.25em] text-gold border border-gold/25 bg-gold/5 px-3 py-2 inline-block"
                  >
                    {s.waitNote}
                  </p>

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
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-x-8 gap-y-2 pt-2 font-mono2 text-[10px] tracking-[0.2em] text-mist">
                    <span>{c.status.code}<span className="text-gold">{result.tracking_code}</span></span>
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

          {result && (
            <motion.div
              data-testid="chat-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
