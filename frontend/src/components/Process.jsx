import { motion } from "framer-motion";
import { ScrollText, KeyRound, MessagesSquare, Ship } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

const STEPS = [
  {
    tid: "process-step-1",
    icon: ScrollText,
    num: "01",
    title: "Dépose ta candidature",
    text: "Remplis les articles du formulaire en bas de page. Deux minutes chrono, sans encre ni serment de sang.",
  },
  {
    tid: "process-step-2",
    icon: KeyRound,
    num: "02",
    title: "Reçois ton code de suivi",
    text: "Un code unique du style GP-1023-XXXX te confie l'état de ton dossier. Conserve-le précieusement.",
  },
  {
    tid: "process-step-3",
    icon: MessagesSquare,
    num: "03",
    title: "Entretien avec le Conseil",
    text: "En fin de saison 2, le Conseil des Capitaines t'invite sur Discord pour jaser autour du tavernain.",
  },
  {
    tid: "process-step-4",
    icon: Ship,
    num: "04",
    title: "Embarque au Royaume 1023",
    text: "Pavillon hissé, cap sur l'or : tu intègres la flotte et tu prends part à la prochaine KvK.",
  },
];

export default function Process() {
  return (
    <section id="processus" data-testid="process-section" className="relative py-24 md:py-32 bg-deep/40 border-y border-gold/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="font-mono2 text-[11px] tracking-[0.35em] text-gold mb-5"
        >
          LA ROUTE DE LA RECRUE — 04
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl lg:text-6xl text-bone leading-[1.02] mb-14 md:mb-20"
        >
          DU QUAI AU <span className="text-gold">PONT SUPÉRIEUR</span>
        </motion.h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.tid}
              data-testid={s.tid}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.1 }}
              className="group relative border border-gold/15 bg-deck/70 p-6 md:p-7 overflow-hidden card-glow transition-all duration-300 hover:border-gold/45 hover:-translate-y-1"
            >
              <span className="absolute -top-4 -right-2 font-display text-8xl text-gold/[0.08] select-none group-hover:text-gold/[0.16] transition-colors duration-500">
                {s.num}
              </span>
              <s.icon className="w-8 h-8 text-gold mb-6" strokeWidth={1.4} />
              <h3 className="font-display text-2xl text-bone mb-3 relative">{s.title}</h3>
              <p className="font-fell text-base text-bone/70 leading-relaxed relative">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
