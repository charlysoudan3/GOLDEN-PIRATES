import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];
// Puissance minimum affichée — à ajuster selon la décision de l'alliance
const MIN_POWER = "100M";
const COINS_IMG = "https://images.unsplash.com/photo-1599038988300-2e3f04d87f8b?q=85&w=900";

const ARTICLES = [
  {
    num: "I",
    tid: "code-req-power",
    title: "Puissance minimum",
    value: `${MIN_POWER} de puissance`,
    tag: "OBLIGATOIRE",
    tagStyle: "border-blood text-bloodglow",
    text: "La puissance reflète la discipline d'un marin. Les profils proches du seuil sont étudiés avec attention : le Conseil tranche en âme et conscience.",
  },
  {
    num: "II",
    tid: "code-req-troops",
    title: "Troupes de guerre",
    value: "T4 exigé — T5 priorisé",
    tag: "OBLIGATOIRE",
    tagStyle: "border-blood text-bloodglow",
    text: "Behemoths, sièges et passages n'attendent pas. Tes troupes doivent suivre le rythme de la flotte.",
  },
  {
    num: "III",
    tid: "code-req-discord",
    title: "Discord & vocal",
    value: "Présence au rassemblement",
    tag: "OBLIGATOIRE",
    tagStyle: "border-blood text-bloodglow",
    text: "Les ordres de bataille se crient, pas s'écrivent. Discord et vocal sont obligatoires pendant les Behemoths et les guerres.",
  },
  {
    num: "IV",
    tid: "code-req-activity",
    title: "Activité quotidienne",
    value: "Connexion régulière",
    tag: "SURVEILLÉ",
    tagStyle: "border-gold/60 text-gold",
    text: "Un pirate absent affaiblit tout l'équipage. On ne te demandera pas d'y passer tes nuits — mais on te demandera d'être là.",
  },
  {
    num: "V",
    tid: "code-req-honor",
    title: "Fraternité d'acier",
    value: "Dons & respect des ordres",
    tag: "HONNEUR",
    tagStyle: "border-gold/60 text-gold",
    text: "Le butin se partage, les ordres se suivent, l'équipage se protège. La loyauté est notre seule monnaie qui ne perd jamais de valeur.",
  },
];

export default function PirateCode() {
  return (
    <section id="code" data-testid="code-section" className="relative py-24 md:py-32 bg-deep/40 border-y border-gold/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-end mb-14 md:mb-20">
          <div className="lg:col-span-8">
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="font-mono2 text-[11px] tracking-[0.35em] text-gold mb-5"
            >
              LES CONDITIONS D'EMBARQUEMENT — 02
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
              data-testid="code-title"
              className="font-display text-4xl sm:text-5xl lg:text-6xl text-bone leading-[1.02]"
            >
              LE CODE DES <span className="text-gold">PIRATES</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
              className="font-fell italic text-lg text-bone/75 mt-5 max-w-2xl"
            >
              Tout équipage qui dure a ses articles. Signe les nôtres en connaissant la chanson —
              aucun capitaine n'aime les surprises à bord.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1, ease: EASE, delay: 0.15 }}
            className="lg:col-span-4 hidden lg:block"
          >
            <div className="relative frame-plate border border-gold/25 p-2 bg-ink rotate-2 hover:rotate-0 transition-transform duration-700">
              <img src={COINS_IMG} alt="Pièces d'or du butin" loading="lazy" className="w-full h-52 object-cover" />
              <p className="font-mono2 text-[10px] tracking-[0.3em] text-mist px-2 py-3">
                LE BUTIN DE LA DERNIÈRE TRAVERSE
              </p>
            </div>
          </motion.div>
        </div>

        <div className="border-t border-gold/15">
          {ARTICLES.map((a, i) => (
            <motion.article
              key={a.num}
              data-testid={a.tid}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.06 }}
              className="group grid grid-cols-12 gap-3 sm:gap-6 items-start py-7 md:py-9 border-b border-gold/15 hover:bg-gold/[0.04] transition-colors duration-300 px-2 sm:px-4"
            >
              <span className="col-span-2 sm:col-span-1 font-display text-3xl sm:text-4xl text-gold/80 group-hover:text-gold transition-colors">
                {a.num}.
              </span>
              <div className="col-span-10 sm:col-span-6">
                <h3 className="font-decor text-lg sm:text-2xl text-bone mb-2 tracking-wide">{a.title}</h3>
                <p className="font-fell text-base text-bone/70 leading-relaxed max-w-xl">{a.text}</p>
              </div>
              <div className="col-span-12 sm:col-span-5 sm:text-right sm:pl-6">
                <span className="font-display text-xl sm:text-2xl text-goldlight block mb-2">{a.value}</span>
                <span
                  className={`inline-block border px-3 py-1 font-mono2 text-[9px] sm:text-[10px] tracking-[0.3em] ${a.tagStyle}`}
                >
                  {a.tag}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
