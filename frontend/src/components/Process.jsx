import { motion } from "framer-motion";
import { ScrollText, KeyRound, MessagesSquare, Ship } from "lucide-react";
import { useLang } from "@/lib/i18n";

const EASE = [0.16, 1, 0.3, 1];
const ICONS = [ScrollText, KeyRound, MessagesSquare, Ship];
const TIDS = ["process-step-1", "process-step-2", "process-step-3", "process-step-4"];

export default function Process() {
  const { c } = useLang();
  const s = c.process;
  return (
    <section id="processus" data-testid="process-section" className="relative py-24 md:py-32 bg-deep/40 border-y border-gold/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="font-mono2 text-[11px] tracking-[0.35em] text-gold mb-5 uppercase"
        >
          {s.eyebrow}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl lg:text-6xl text-bone leading-[1.02] uppercase mb-14 md:mb-20"
        >
          {s.title1}<span className="text-gold">{s.titleGold}</span>
        </motion.h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {s.steps.map((st, i) => {
            const Icon = ICONS[i];
            return (
              <motion.div
                key={st.title}
                data-testid={TIDS[i]}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.8, ease: EASE, delay: i * 0.1 }}
                className="group relative border border-gold/15 bg-deck/70 p-6 md:p-7 overflow-hidden card-glow transition-all duration-300 hover:border-gold/45 hover:-translate-y-1"
              >
                <span className="absolute -top-4 -right-2 font-display text-8xl text-gold/[0.08] select-none group-hover:text-gold/[0.16] transition-colors duration-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icon className="w-8 h-8 text-gold mb-6" strokeWidth={1.4} />
                <h3 className="font-display text-2xl text-bone mb-3 relative">{st.title}</h3>
                <p className="font-fell text-base text-bone/70 leading-relaxed relative">{st.text}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
