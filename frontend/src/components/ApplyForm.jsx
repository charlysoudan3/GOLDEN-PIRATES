import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Copy, Check, X, Anchor } from "lucide-react";
import api, { formatApiError } from "@/lib/api";

const EASE = [0.16, 1, 0.3, 1];
const MIN_POWER = "100M";

const TROOP_OPTIONS = ["T5 — L'élite de la flotte", "T4/T5 — Mixte", "T4 — Vétéran", "T3 et moins — En progression"];
const ACTIVITY_OPTIONS = ["Quotidienne — 1 h / jour", "Régulière — 2-3 h / jour", "Intensive — 4 h et plus / jour", "Soirs & week-ends"];

const inputCls =
  "w-full bg-ink/70 border border-gold/25 px-4 py-3 font-fell text-base text-bone placeholder:text-mist/50 focus:border-gold focus:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all duration-300";
const labelCls = "block font-mono2 text-[10px] tracking-[0.3em] text-gold mb-2";

const initialForm = {
  pseudo: "",
  power: "",
  troops: TROOP_OPTIONS[1],
  activity: ACTIVITY_OPTIONS[1],
  experience: "",
  discord: "",
  message: "",
};

export default function ApplyForm() {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    if (!form.pseudo.trim() || form.pseudo.trim().length < 2) {
      toast.error("Ton pseudo de marin est requis (2 caractères minimum).");
      return;
    }
    if (!form.power.trim()) {
      toast.error(`Indique ta puissance (minimum requis : ${MIN_POWER}).`);
      return;
    }
    if (!form.discord.trim()) {
      toast.error("Ton tag Discord est requis — c'est là que le Conseil t'appellera.");
      return;
    }
    if (form.message.trim().length < 10) {
      toast.error("Laisse un message de 10 caractères minimum — fais bonne impression !");
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post("/applications", form);
      setResult(data);
      toast.success(`Candidature déposée — code ${data.tracking_code}`);
    } catch (err) {
      toast.error(formatApiError(err));
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
      toast.error("Copie impossible — recopie le code à la main, moussaillon.");
    }
  };

  return (
    <section id="postuler" data-testid="application-section" className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <p className="font-mono2 text-[11px] tracking-[0.35em] text-gold mb-5">
              SIGNER LES ARTICLES — 05
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-bone leading-[1.02] mb-8">
              MONTE À BORD, <span className="text-gold">MARIN</span>
            </h2>
            <p className="font-fell text-lg text-bone/80 leading-relaxed mb-6">
              Le recrutement officiel s'ouvre à la fin de la Saison 2 — c'est la règle du Royaume.
              Mais les candidatures déposées dès maintenant passent la Barbene en premier : le
              Conseil les examine en priorité dès l'ouverture.
            </p>
            <ul className="space-y-4 border-l-2 border-gold/30 pl-5">
              {[
                `Puissance minimum : ${MIN_POWER} (Article I du Code)`,
                "Réponse du Conseil après entretien Discord",
                "Un code de suivi t'est remis dès l'envoi — garde-le sur toi",
              ].map((item) => (
                <li key={item} className="font-fell text-base text-bone/75 flex items-start gap-3">
                  <Anchor className="w-4 h-4 text-gold mt-1 shrink-0" />
                  {item}
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
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls} htmlFor="f-pseudo">PSEUDO CALL OF DRAGONS *</label>
                <input
                  id="f-pseudo"
                  data-testid="input-pseudo"
                  className={inputCls}
                  value={form.pseudo}
                  onChange={set("pseudo")}
                  placeholder="ex : KrakenDuNord"
                  maxLength={32}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="f-power">PUISSANCE ACTUELLE *</label>
                <input
                  id="f-power"
                  data-testid="input-power"
                  className={inputCls}
                  value={form.power}
                  onChange={set("power")}
                  placeholder={`ex : 120M (min. ${MIN_POWER})`}
                  maxLength={16}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="f-troops">NIVEAU DE TROUPES *</label>
                <select
                  id="f-troops"
                  data-testid="select-troops"
                  className={`${inputCls} appearance-none cursor-pointer`}
                  value={form.troops}
                  onChange={set("troops")}
                >
                  {TROOP_OPTIONS.map((o) => (
                    <option key={o} value={o} className="bg-deck text-bone">{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="f-activity">ACTIVITÉ QUOTIDIENNE *</label>
                <select
                  id="f-activity"
                  data-testid="select-activity"
                  className={`${inputCls} appearance-none cursor-pointer`}
                  value={form.activity}
                  onChange={set("activity")}
                >
                  {ACTIVITY_OPTIONS.map((o) => (
                    <option key={o} value={o} className="bg-deck text-bone">{o}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="f-discord">TAG DISCORD *</label>
                <input
                  id="f-discord"
                  data-testid="input-discord"
                  className={inputCls}
                  value={form.discord}
                  onChange={set("discord")}
                  placeholder="ex : krakendunord"
                  maxLength={60}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="f-experience">
                  EXPÉRIENCE — KVK & ALLIANCES PRÉCÉDENTES
                </label>
                <textarea
                  id="f-experience"
                  data-testid="textarea-experience"
                  className={`${inputCls} min-h-[90px] resize-y`}
                  value={form.experience}
                  onChange={set("experience")}
                  placeholder="Saisons jouées, rôles tenus, faits d'armes dont tu es fier…"
                  maxLength={1200}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="f-message">TON MESSAGE AU CONSEIL *</label>
                <textarea
                  id="f-message"
                  data-testid="textarea-message"
                  className={`${inputCls} min-h-[110px] resize-y`}
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Pourquoi les GOLDEN PIRATES ? Qu'est-ce que tu apportes à l'équipage ?"
                  maxLength={2000}
                />
              </div>
            </div>
            <button
              type="submit"
              data-testid="submit-application-btn"
              disabled={sending}
              className="mt-8 w-full font-display text-2xl tracking-wider py-4 bg-gold text-ink hover:bg-goldlight hover:shadow-[0_0_40px_rgba(212,175,55,0.45)] disabled:opacity-60 disabled:cursor-wait transition-all duration-300"
            >
              {sending ? "LA CIRE FOND…" : "SIGNER LES ARTICLES DE L'ÉQUIPAGE"}
            </button>
            <p className="mt-4 font-mono2 text-[9px] tracking-[0.25em] text-mist text-center">
              EN SIGNANT, TU JURES LOYAUTÉ À L'ÉQUIPAGE — ARTICLE V DU CODE
            </p>
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
              className="relative w-full max-w-lg border-2 border-gold/60 bg-parch frame-plate p-8 sm:p-10 text-center"
            >
              <button
                data-testid="success-modal-close"
                onClick={() => setResult(null)}
                aria-label="Fermer"
                className="absolute top-4 right-4 text-mist hover:text-gold transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-gold flex items-center justify-center">
                <Check className="w-8 h-8 text-gold" />
              </div>
              <h3 className="font-display text-3xl sm:text-4xl text-gold mb-3">
                Bien à bord, {result.pseudo} !
              </h3>
              <p className="font-fell text-base text-bone/80 mb-7">
                Ta candidature est scellée dans le registre du Conseil. Voici ton code de suivi
                unique — garde-le précieusement pour suivre son examen.
              </p>
              <div
                data-testid="generated-tracking-code"
                className="font-mono2 text-3xl sm:text-4xl tracking-[0.15em] text-goldlight bg-ink/60 border border-gold/40 px-6 py-4 mb-7 select-all"
              >
                {result.tracking_code}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  data-testid="copy-tracking-code-btn"
                  onClick={copyCode}
                  className="inline-flex items-center justify-center gap-2 font-mono2 text-xs tracking-[0.25em] px-6 py-3 border border-gold/50 text-gold hover:bg-gold/10 transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "COPIÉ" : "COPIER LE CODE"}
                </button>
                <Link
                  data-testid="goto-suivi-btn"
                  to="/suivi"
                  className="inline-flex items-center justify-center gap-2 font-mono2 text-xs tracking-[0.25em] px-6 py-3 bg-gold text-ink hover:bg-goldlight transition-all"
                >
                  SUIVRE MA CANDIDATURE
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
