import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import Seo from "@/lib/Seo";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { Ship, TrendingUp, Beer, Lock, ShieldCheck, Anchor, Feather, Coins } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];
const WHY_ICONS = { ship: Ship, growth: TrendingUp, fest: Beer, free: Lock };

export default function Donations() {
  const { c, lang } = useLang();
  const d = c.donations;
  const [picked, setPicked] = useState(null);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [coming, setComing] = useState(false);
  const [hallItems, setHallItems] = useState([]);
  const [hallTotal, setHallTotal] = useState(0);

  useEffect(() => {
    let dead = false;
    api.get("/donators")
      .then(({ data }) => {
        if (dead) return;
        setHallItems(data.items || []);
        setHallTotal(data.total || 0);
      })
      .catch(() => {});
    return () => { dead = true; };
  }, []);

  const chosenAmount = picked === "free"
    ? (parseFloat((custom || "").replace(",", ".")) || 0)
    : picked;

  const drop = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.get("/donations/paypal", {
        params: chosenAmount >= 1 ? { amount: Math.min(chosenAmount, 10000) } : {},
      });
      if (data.configured && data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
        setComing(false);
      } else {
        setComing(true);
      }
    } catch {
      setComing(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-bone overflow-x-hidden">
      <Seo route="/donations" />
      <Nav />
      <main data-testid="donations-main" className="pt-28 sm:pt-36">
        {/* HERO — le trésor du navire */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="inline-flex items-center gap-2 font-mono2 text-[10px] tracking-[0.35em] text-gold border border-gold/40 bg-gold/5 px-4 py-2 mb-6"
              data-testid="donations-eyebrow"
            >
              <Coins className="w-3.5 h-3.5 shrink-0" /> {d.eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.8, ease: EASE }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl text-bone leading-[1.05] mb-6"
              data-testid="donations-title"
            >
              {d.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.8, ease: EASE }}
              className="font-fell text-lg text-bone/85 leading-relaxed mb-8 max-w-xl"
              data-testid="donations-lead"
            >
              {d.lead}
            </motion.p>
            <motion.a
              href="#soutien"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36, duration: 0.8, ease: EASE }}
              className="inline-flex items-center gap-2.5 font-display text-2xl tracking-wider uppercase px-8 py-4 bg-gold text-ink hover:bg-goldlight hover:shadow-[0_0_45px_rgba(212,175,55,0.5)] transition-all duration-300"
              data-testid="donations-cta"
            >
              <Anchor className="w-5 h-5 shrink-0" /> {d.cta}
            </motion.a>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.9, ease: EASE }}
            className="relative border border-gold/40 bg-deck/60 p-3 sm:p-4 max-w-md w-full mx-auto lg:mx-0 lg:ml-auto"
            data-testid="donations-illustration"
          >
            <img
              src="/butin-tresor.png"
              alt={d.title}
              className="w-full h-[420px] sm:h-[520px] object-cover"
              loading="eager"
            />
            <span className="absolute -bottom-3.5 left-6 font-mono2 text-[9px] tracking-[0.3em] text-gold bg-ink px-3 py-1.5 border border-gold/30">
              G.P. — 1023
            </span>
          </motion.div>
        </section>

        {/* L'ENTRÉE EST LIBRE — 100 % GRATUIT */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 mt-16 sm:mt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative border-2 border-emerald-400/50 bg-emerald-500/10 p-6 sm:p-8 flex items-start gap-4"
            data-testid="donations-free-banner"
          >
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-xl sm:text-2xl text-emerald-300 uppercase tracking-wide mb-2" data-testid="donations-free-title">
                {d.freeTitle}
              </p>
              <p className="font-fell text-base text-bone/85 leading-relaxed" data-testid="donations-free-text">
                {d.freeText}
              </p>
            </div>
          </motion.div>
        </section>

        {/* POURQUOI LARGUER UNE PIÈCE */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 mt-16 sm:mt-20">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="font-display text-3xl sm:text-4xl text-gold uppercase tracking-wide mb-8"
            data-testid="donations-why-title"
          >
            {d.whyTitle}
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {d.why.map((w, i) => {
              const Icon = WHY_ICONS[w.key] || Coins;
              return (
                <motion.div
                  key={w.key}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
                  className="border border-gold/25 bg-deck/60 p-6 hover:border-gold/60 hover:bg-gold/5 transition-all duration-300"
                  data-testid={`donations-why-${w.key}`}
                >
                  <Icon className="w-7 h-7 text-gold mb-4" />
                  <p className="font-display text-xl text-gold uppercase tracking-wide mb-2">{w.title}</p>
                  <p className="font-fell text-base text-bone/80 leading-relaxed">{w.text}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* LE TRÉBUCHET — choix du soutien */}
        <section id="soutien" className="max-w-4xl mx-auto px-5 sm:px-8 mt-16 sm:mt-24 scroll-mt-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <h2 className="font-display text-3xl sm:text-4xl text-gold uppercase tracking-wide mb-2 text-center" data-testid="donations-tiers-title">
              {d.tiersTitle}
            </h2>
            <p className="font-fell italic text-base text-mist text-center mb-8">{d.tiersSub}</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {d.tierAmounts.map((amount, i) => (
              <motion.button
                key={amount}
                type="button"
                data-testid={`donations-tier-${amount}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
                onClick={() => { setPicked(picked === amount ? null : amount); setComing(false); }}
                className={`relative border p-6 text-center transition-all duration-300 ${
                  picked === amount
                    ? "border-gold bg-gold/15 shadow-[0_0_35px_rgba(212,175,55,0.25)]"
                    : "border-gold/30 bg-deck/60 hover:border-gold/70 hover:bg-gold/5"
                }`}
              >
                <Coins className={`w-6 h-6 mx-auto mb-3 ${picked === amount ? "text-gold" : "text-gold/60"}`} />
                <p className={`font-display text-3xl mb-1 ${picked === amount ? "text-gold" : "text-bone"}`}>{amount} €</p>
                <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">{d.tierLabels[i]}</p>
              </motion.button>
            ))}
          </div>

          <div className="border border-gold/25 bg-deck/60 p-5 sm:p-6 mb-6" data-testid="donations-free-block">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <p className="font-mono2 text-[9px] tracking-[0.25em] text-gold/80 mb-1.5">{d.freeAmount}</p>
                <input
                  data-testid="donations-custom-input"
                  value={custom}
                  onChange={(e) => { setCustom(e.target.value.replace(/[^\d.,]/g, "")); setPicked("free"); setComing(false); }}
                  placeholder={d.freeAmountPh}
                  inputMode="decimal"
                  maxLength={7}
                  autoComplete="off"
                  className="w-full bg-ink/70 border border-gold/25 px-4 py-3 font-fell text-lg text-bone placeholder:text-bone/40 focus:border-gold transition-all"
                />
              </div>
            </div>
          </div>

          <div className="text-center">
            <motion.button
              type="button"
              data-testid="donations-drop-btn"
              whileTap={{ scale: 0.97 }}
              onClick={drop}
              disabled={busy || (picked === "free" && !(parseFloat((custom || "").replace(",", ".")) > 0))}
              className="inline-flex items-center gap-2.5 font-display text-2xl tracking-wider uppercase px-10 py-4 bg-gold text-ink hover:bg-goldlight hover:shadow-[0_0_45px_rgba(212,175,55,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <Coins className="w-6 h-6 shrink-0" />
              {busy ? d.dropBusy : d.dropBtn}
            </motion.button>
            {coming && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="mt-6 mx-auto max-w-lg border border-gold/40 bg-gold/5 p-5"
                data-testid="donations-coming"
              >
                <p className="font-display text-xl text-gold uppercase tracking-wide mb-1.5 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" /> {d.comingTitle}
                </p>
                <p className="font-fell text-base text-bone/80">{d.comingText}</p>
              </motion.div>
            )}
          </div>
        </section>

        {/* CHAQUE PIÈCE VA AU NAVIRE */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 mt-16 sm:mt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="border-l-4 border-gold bg-deck/60 p-6 sm:p-8"
            data-testid="donations-trust"
          >
            <p className="font-display text-2xl text-gold uppercase tracking-wide mb-3 flex items-center gap-2.5">
              <Feather className="w-5 h-5 shrink-0" /> {d.trustTitle}
            </p>
            <p className="font-fell text-base text-bone/85 leading-relaxed">{d.trustText}</p>
          </motion.div>
        </section>

        {/* LE HALL DES DONATEURS */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 mt-16 sm:mt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <h2 className="font-display text-3xl sm:text-4xl text-gold uppercase tracking-wide text-center" data-testid="donations-hall-title">
              {d.hall.title}
            </h2>
            <p className="font-fell italic text-base text-mist text-center mt-2 mb-8">{d.hall.sub}</p>
            <p className="font-mono2 text-[11px] tracking-[0.3em] text-emerald-300 text-center mb-8" data-testid="donations-hall-total">
              {d.hall.total} : {hallTotal.toFixed(2)} €
            </p>
            {hallItems.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {hallItems.map((it) => {
                  const tierName = it.amount >= 15 ? d.tierLabels[2] : it.amount >= 7 ? d.tierLabels[1] : d.tierLabels[0];
                  return (
                    <div
                      key={it.id}
                      data-testid="donations-hall-item"
                      className="flex items-center gap-4 border border-gold/45 bg-gradient-to-r from-gold/12 via-gold/5 to-transparent p-4"
                    >
                      <div aria-hidden className="w-11 h-11 rounded-full bg-gold border-2 border-goldlight flex items-center justify-center shrink-0 rotate-3">
                        <span className="font-display text-lg text-ink">{(it.pseudo || "?").trim().charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-lg text-bone truncate">{it.pseudo}</p>
                        <p className="font-mono2 text-[8px] tracking-[0.2em] text-gold/80">
                          {it.amount.toFixed(2)} € · {tierName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="font-fell italic text-lg text-mist text-center border border-gold/20 bg-deck/50 p-8" data-testid="donations-hall-empty">
                {d.hall.empty}
              </p>
            )}
          </motion.div>
        </section>

        {/* MER À TOUS */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 mt-14 sm:mt-20 mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE }}
            data-testid="donations-thanks"
          >
            <Anchor className="w-8 h-8 text-gold mx-auto mb-4" />
            <p className="font-display text-2xl sm:text-3xl text-bone uppercase tracking-wide mb-3">{d.thanksTitle}</p>
            <p className="font-fell text-lg text-bone/80 leading-relaxed">{d.thanksText}</p>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}