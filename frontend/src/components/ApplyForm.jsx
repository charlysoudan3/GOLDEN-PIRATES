import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Copy, Check, X, Anchor, ListChecks, Hourglass, Megaphone, Skull, Swords, Radio, Feather, LifeBuoy } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useLang, fmtPower } from "@/lib/i18n";
import Countdown from "@/components/Countdown";

const EASE = [0.16, 1, 0.3, 1];

const inputCls =
  "w-full bg-ink/70 border border-gold/25 px-4 py-3 font-fell text-base text-bone placeholder:text-mist/50 focus:border-gold focus:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all duration-300";
const labelCls = "block font-mono2 text-[10px] tracking-[0.3em] text-gold mb-2";

export default function ApplyForm() {
  const { c, lang } = useLang();
  const s = c.apply;
  const [form, setForm] = useState(() => ({
    pseudo: "",
    power: "",
    troops: c.apply.troopsOptions[1],
    activity: c.apply.activityOptions[1],
    experience: "",
    discord: "",
    message: "",
  }));
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    if (!form.pseudo.trim() || form.pseudo.trim().length < 2) {
      toast.error(s.errors.pseudo);
      return;
    }
    if (!form.power.trim()) {
      toast.error(fmtPower(s.errors.power));
      return;
    }
    if (form.message.trim().length < 10) {
      toast.error(s.errors.message);
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post("/applications", form);
      setResult(data);
      toast.success(s.toastSuccess(data.tracking_code));
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const code = detail?.code;
      const locale = lang === "fr" ? "fr-FR" : "en-GB";
      if (code === "duplicate_active") toast.error(s.errors.duplicateActive);
      else if (code === "already_accepted") toast.error(s.errors.alreadyAccepted);
      else if (code === "cooldown") {
        const dstr = detail?.retry_at
          ? new Date(detail.retry_at).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
          : null;
        toast.error(dstr ? s.errors.cooldown(dstr) : formatApiError(err));
      } else if (code === "ip_limit") toast.error(s.errors.ipLimit);
      else toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(result.tracking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(s.errors.copyFail);
    }
  };

  return (
    <section id="postuler" data-testid="application-section" className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <p className="font-mono2 text-[11px] tracking-[0.35em] text-gold mb-5 uppercase">{s.eyebrow}</p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-bone leading-[1.02] mb-8 uppercase">
              {s.title1}<span className="text-gold">{s.titleGold}</span>
            </h2>
            <p
              data-testid="migration-banner"
              className="inline-flex items-start gap-2.5 border border-blood/50 bg-blood/10 px-4 py-3 font-mono2 text-[9px] sm:text-[10px] tracking-[0.25em] text-bloodglow mb-6"
            >
              <Megaphone className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{fmtPower(s.migrationBanner)}</span>
            </p>
            <div className="mb-6" data-testid="apply-countdown-wrap">
              <Countdown variant="line" testid="apply-countdown" />
            </div>
            <p className="font-fell text-lg text-bone/80 leading-relaxed mb-6">{s.intro}</p>
            <ul className="space-y-4 border-l-2 border-gold/30 pl-5">
              {s.bullets.map((item) => (
                <li key={item} className="font-fell text-base text-bone/75 flex items-start gap-3">
                  <Anchor className="w-4 h-4 text-gold mt-1 shrink-0" />
                  {fmtPower(item)}
                </li>
              ))}
            </ul>
          </div>

          <motion.form
            data-testid="application-form"
            onSubmit={submit}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="lg:col-span-7 relative border border-gold/25 bg-parch/80 frame-plate p-6 sm:p-10"
          >
            <div className="space-y-9">
              <fieldset data-testid="form-group-identity">
                <legend className="flex items-center gap-3 w-full mb-5">
                  <Skull className="w-4 h-4 text-gold shrink-0" />
                  <span className="font-mono2 text-[10px] tracking-[0.3em] text-gold uppercase">{s.groups.identity}</span>
                  <span className="flex-1 h-px bg-gold/15" />
                  <span className="font-mono2 text-[9px] tracking-[0.2em] text-mist/70">I</span>
                </legend>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls} htmlFor="f-pseudo">{s.labels.pseudo}</label>
                    <input
                      id="f-pseudo"
                      data-testid="input-pseudo"
                      className={inputCls}
                      value={form.pseudo}
                      onChange={set("pseudo")}
                      placeholder={s.ph.pseudo}
                      maxLength={32}
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-power">{s.labels.power}</label>
                    <input
                      id="f-power"
                      data-testid="input-power"
                      className={inputCls}
                      value={form.power}
                      onChange={set("power")}
                      placeholder={fmtPower(s.ph.power)}
                      maxLength={16}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset data-testid="form-group-force">
                <legend className="flex items-center gap-3 w-full mb-5">
                  <Swords className="w-4 h-4 text-gold shrink-0" />
                  <span className="font-mono2 text-[10px] tracking-[0.3em] text-gold uppercase">{s.groups.force}</span>
                  <span className="flex-1 h-px bg-gold/15" />
                  <span className="font-mono2 text-[9px] tracking-[0.2em] text-mist/70">II</span>
                </legend>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls} htmlFor="f-troops">{s.labels.troops}</label>
                    <select
                      id="f-troops"
                      data-testid="select-troops"
                      className={`${inputCls} appearance-none cursor-pointer`}
                      value={form.troops}
                      onChange={set("troops")}
                    >
                      {s.troopsOptions.map((o) => (
                        <option key={o} value={o} className="bg-deck text-bone">{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-activity">{s.labels.activity}</label>
                    <select
                      id="f-activity"
                      data-testid="select-activity"
                      className={`${inputCls} appearance-none cursor-pointer`}
                      value={form.activity}
                      onChange={set("activity")}
                    >
                      {s.activityOptions.map((o) => (
                        <option key={o} value={o} className="bg-deck text-bone">{o}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </fieldset>

              <fieldset data-testid="form-group-signals">
                <legend className="flex items-center gap-3 w-full mb-5">
                  <Radio className="w-4 h-4 text-gold shrink-0" />
                  <span className="font-mono2 text-[10px] tracking-[0.3em] text-gold uppercase">{s.groups.signals}</span>
                  <span className="flex-1 h-px bg-gold/15" />
                  <span className="font-mono2 text-[9px] tracking-[0.2em] text-mist/70">III</span>
                </legend>
                <div>
                  <label className={labelCls} htmlFor="f-discord">{s.labels.discord}</label>
                  <input
                    id="f-discord"
                    data-testid="input-discord"
                    className={inputCls}
                    value={form.discord}
                    onChange={set("discord")}
                    placeholder={s.ph.discord}
                    maxLength={60}
                  />
                  <p
                    data-testid="no-discord-note"
                    className="mt-3 flex items-start gap-2 font-mono2 text-[9px] tracking-[0.2em] text-mist/80 leading-relaxed"
                  >
                    <LifeBuoy className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                    <span>{s.noDiscord}</span>
                  </p>
                </div>
              </fieldset>

              <fieldset data-testid="form-group-letter">
                <legend className="flex items-center gap-3 w-full mb-5">
                  <Feather className="w-4 h-4 text-gold shrink-0" />
                  <span className="font-mono2 text-[10px] tracking-[0.3em] text-gold uppercase">{s.groups.letter}</span>
                  <span className="flex-1 h-px bg-gold/15" />
                  <span className="font-mono2 text-[9px] tracking-[0.2em] text-mist/70">IV</span>
                </legend>
                <div className="space-y-5">
                  <div>
                    <label className={labelCls} htmlFor="f-experience">{s.labels.experience}</label>
                    <textarea
                      id="f-experience"
                      data-testid="textarea-experience"
                      className={`${inputCls} min-h-[90px] resize-y`}
                      value={form.experience}
                      onChange={set("experience")}
                      placeholder={s.ph.experience}
                      maxLength={1200}
                    />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="f-message">{s.labels.message}</label>
                    <textarea
                      id="f-message"
                      data-testid="textarea-message"
                      className={`${inputCls} min-h-[110px] resize-y`}
                      value={form.message}
                      onChange={set("message")}
                      placeholder={s.ph.message}
                      maxLength={2000}
                    />
                  </div>
                </div>
              </fieldset>
            </div>
            <button
              type="submit"
              data-testid="submit-application-btn"
              disabled={sending}
              className="mt-8 w-full font-display text-2xl tracking-wider uppercase py-4 bg-gold text-ink hover:bg-goldlight hover:shadow-[0_0_40px_rgba(212,175,55,0.45)] disabled:opacity-60 disabled:cursor-wait transition-all duration-300"
            >
              {sending ? s.submitting : s.submit}
            </button>
            <p className="mt-4 font-mono2 text-[9px] tracking-[0.25em] text-mist text-center">{s.oathNote}</p>
          </motion.form>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-ink/90 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => setResult(null)}
          >
            <motion.div
              data-testid="application-success-modal"
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto border-2 border-gold/60 bg-parch frame-plate p-8 sm:p-10 text-center"
            >
              <button
                data-testid="success-modal-close"
                onClick={() => setResult(null)}
                aria-label="Fermer / Close"
                className="absolute top-4 right-4 text-mist hover:text-gold transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-gold flex items-center justify-center">
                <Check className="w-8 h-8 text-gold" />
              </div>
              <h3 className="font-display text-3xl sm:text-4xl text-gold mb-3">{s.modal.title(result.pseudo)}</h3>
              <p className="font-fell text-base text-bone/80 mb-6">{s.modal.text}</p>
              <div
                data-testid="generated-tracking-code"
                className="font-mono2 text-3xl sm:text-4xl tracking-[0.15em] text-goldlight bg-ink/60 border border-gold/40 px-6 py-4 mb-2 select-all"
              >
                {result.tracking_code}
              </div>
              <p className="font-mono2 text-[9px] tracking-[0.25em] text-mist mb-6">{s.modal.codeCaption}</p>
              <div data-testid="modal-next-steps" className="text-left border border-gold/20 bg-deck/60 p-5 mb-4">
                <p className="font-mono2 text-[10px] tracking-[0.3em] text-gold mb-3 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 shrink-0" /> {s.modal.nowTitle}
                </p>
                <ol className="space-y-2">
                  {s.modal.next.map((n, i) => (
                    <li key={n} className="flex gap-3 font-fell text-sm text-bone/80 leading-snug">
                      <span className="font-mono2 text-xs text-gold mt-0.5 shrink-0">{i + 1}.</span>
                      <span>{n}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div data-testid="modal-wait-time" className="text-left border border-gold/20 bg-deck/60 p-5 mb-6">
                <p className="font-mono2 text-[10px] tracking-[0.3em] text-gold mb-2 flex items-center gap-2">
                  <Hourglass className="w-4 h-4 shrink-0" /> {s.modal.waitTitle}
                </p>
                <p className="font-fell text-sm text-bone/80 leading-snug">{s.modal.wait}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  data-testid="copy-tracking-code-btn"
                  onClick={copyCode}
                  className="inline-flex items-center justify-center gap-2 font-mono2 text-xs tracking-[0.25em] px-6 py-3 border border-gold/50 text-gold hover:bg-gold/10 transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? s.modal.copied : s.modal.copy}
                </button>
                <Link
                  data-testid="goto-suivi-btn"
                  to="/suivi"
                  className="inline-flex items-center justify-center gap-2 font-mono2 text-xs tracking-[0.25em] px-6 py-3 bg-gold text-ink hover:bg-goldlight transition-all"
                >
                  {s.modal.follow}
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
