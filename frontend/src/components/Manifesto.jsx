import { motion } from "framer-motion";
import { Anchor, Compass, Swords } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];
const SHIP_IMG =
  "https://images.unsplash.com/photo-1623645986271-e52479815efc?q=85&w=1100";

const rise = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.9, ease: EASE },
};

const VALUES = [
  {
    icon: Anchor,
    tid: "manifesto-card-fraternity",
    title: "Fraternité d'Acier",
    text: "Ici, personne ne rallie seul. Dons, entraide, rassemblements : l'équipage veille sur le sien.",
  },
  {
    icon: Compass,
    tid: "manifesto-card-rigor",
    title: "Rigueur Stratégique",
    text: "Chaque bataille se prépare. Objectifs clairs, ordres nets, exécution chirurgicale en KvK.",
  },
  {
    icon: Swords,
    tid: "manifesto-card-supremacy",
    title: "Suprématie KvK",
    text: "La Conquête du Royaume est notre terroir. On y monte, on y tient, on n'y dort jamais.",
  },
];

export default function Manifesto() {
  return (
    <section id="alliance" data-testid="manifesto-section" className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-7">
            <motion.p {...rise} className="font-mono2 text-[11px] tracking-[0.35em] text-gold mb-5">
              LA LIGNE FLOTTANTE — 01
            </motion.p>
            <motion.h2
              {...rise}
              data-testid="manifesto-title"
              className="font-display text-4xl sm:text-5xl lg:text-6xl text-bone leading-[1.02] mb-8"
            >
              UNE LÉGENDE SE FORGE <span className="text-gold">DANS L'ENCRE ET L'OR</span>
            </motion.h2>
            <motion.p {...rise} className="font-fell text-lg sm:text-xl leading-relaxed text-bone/85 mb-6">
              Les GOLDEN PIRATES ne recrutent pas des soldats. Nous recrutons des marins que la mer
              n'a pas encore domptés. Dans le Royaume 1023, notre pavillon noir ne flotte pas par
              hasard : il flotte parce que derrière lui, chaque membre tire dans le même sens.
            </motion.p>
            <motion.p {...rise} className="font-fell text-lg sm:text-xl leading-relaxed text-bone/85 mb-10">
              La Saison 1 est derrière nous, la Saison 2 s'annonce comme une marée d'or. Si tu lis
              ces lignes avec l'envie de te battre au bon endroit, au bon moment, avec les bonnes
              personnes — alors continue ta lecture, recrue.
            </motion.p>

            <motion.blockquote
              {...rise}
              data-testid="manifesto-quote"
              className="relative border-l-2 border-gold pl-6 md:pl-8 py-2"
            >
              <span className="absolute -top-4 left-3 font-display text-7xl text-gold/30 select-none">“</span>
              <p className="font-fell italic text-xl sm:text-2xl text-goldlight leading-snug">
                On ne rate jamais une saison avec un équipage qui a du cœur, des troupes et du
                trésor.
              </p>
              <footer className="mt-4 font-mono2 text-[10px] tracking-[0.3em] text-mist">
                — LE CONSEIL DES CAPITAINES, G.P. 1023
              </footer>
            </motion.blockquote>
          </div>

          <motion.div
            {...rise}
            className="lg:col-span-5 relative"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1, ease: EASE, delay: 0.15 }}
          >
            <div className="relative frame-plate border border-gold/25 p-2 sm:p-3 bg-deep">
              <div className="overflow-hidden">
                <motion.img
                  src={SHIP_IMG}
                  alt="Trois-mâts de guerre sous voiles"
                  loading="lazy"
                  className="w-full h-[320px] sm:h-[420px] lg:h-[520px] object-cover"
                  initial={{ scale: 1.15 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 1.6, ease: EASE }}
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,175,55,0.12),transparent_55%)]" />
              <div className="flex items-center justify-between px-2 py-3">
                <span className="font-mono2 text-[10px] tracking-[0.3em] text-mist">LE VAISSEAU AMIRAL</span>
                <span className="font-mono2 text-[10px] tracking-[0.3em] text-gold">G.P. — 1023</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mt-16 md:mt-24">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              data-testid={v.tid}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.12 }}
              className="card-glow group border border-gold/15 bg-deck/70 p-6 md:p-8 transition-all duration-300 hover:border-gold/45 hover:-translate-y-1"
            >
              <v.icon className="w-7 h-7 text-gold mb-5 transition-transform duration-500 group-hover:rotate-12" strokeWidth={1.5} />
              <h3 className="font-display text-2xl text-bone mb-3">{v.title}</h3>
              <p className="font-fell text-base text-bone/70 leading-relaxed">{v.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
