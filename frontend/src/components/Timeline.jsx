import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];
const COMPASS_IMG =
  "https://images.pexels.com/photos/14436272/pexels-photo-14436272.jpeg?auto=compress&cs=tinysrgb&w=1000";

const STEPS = [
  {
    tid: "timeline-step-s1",
    season: "SAISON 1",
    title: "L'épreuve du feu",
    status: "TERMINÉE",
    statusStyle: "border-mist/40 text-mist",
    text: "La première KvK est passée par là. L'équipage en est ressorti plus soudé, plus dur, plus doré que jamais.",
    done: true,
  },
  {
    tid: "timeline-step-prekvk",
    season: "PRÉ-KVK — SAISON 2",
    title: "Mobilisation générale",
    status: "EN COURS — NOUS SOMMES ICI",
    statusStyle: "border-gold text-gold",
    text: "La Saison 2 arrive : on renforce les troupes, on remplit les greniers, on aiguise la stratégie. Chaque marin compte.",
    current: true,
  },
  {
    tid: "timeline-step-s2",
    season: "SAISON 2 — KVK",
    title: "La bataille des terres",
    status: "À VENIR",
    statusStyle: "border-mist/40 text-mist",
    text: "La Conquête du Royaume démarre. Batailles de territoires, Behemoths, sièges : la mer sera rouge — et l'or, nôtre.",
  },
  {
    tid: "timeline-step-s2end",
    season: "FIN DE SAISON 2",
    title: "Ouverture du recrutement",
    status: "C'EST ICI QU'ON VOUS ATTEND",
    statusStyle: "border-blood text-bloodglow",
    text: "Comme le veut la loi de Call of Dragons, les nouvelles recrues montent à bord en fin de saison. Dépose ta candidature dès maintenant : elle sera traitée en priorité.",
    recruit: true,
  },
];

export default function Timeline() {
  return (
    <section id="recit" data-testid="timeline-section" className="relative py-24 md:py-32 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute right-[-10%] top-[10%] w-[40vw] max-w-[560px] opacity-[0.07] hidden md:block"
      >
        <img src={COMPASS_IMG} alt="" className="w-full h-auto rounded-full object-cover aspect-square" />
      </div>
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="font-mono2 text-[11px] tracking-[0.35em] text-gold mb-5"
        >
          LE RÉCIT DES SAISONS — 03
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl lg:text-6xl text-bone leading-[1.02] mb-14 md:mb-20"
        >
          NOUS SOMMES EN <span className="text-gold">PRÉ-KVK</span>
        </motion.h2>

        <div className="relative border-l border-gold/30 ml-2 md:ml-6 space-y-12 md:space-y-16">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.tid}
              data-testid={s.tid}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
              className="relative pl-8 md:pl-12"
            >
              <span
                className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 ${
                  s.current
                    ? "bg-gold border-gold shadow-[0_0_18px_rgba(212,175,55,0.8)]"
                    : s.recruit
                      ? "bg-blood border-bloodglow shadow-[0_0_18px_rgba(220,38,38,0.6)]"
                      : "bg-ink border-gold/50"
                }`}
              />
              {s.current && (
                <span className="absolute -left-[13px] top-[-2px] w-6 h-6 rounded-full border border-gold/50 animate-ping" />
              )}
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="font-mono2 text-[10px] sm:text-xs tracking-[0.3em] text-gold">{s.season}</span>
                <span className={`border px-2.5 py-0.5 font-mono2 text-[9px] sm:text-[10px] tracking-[0.25em] ${s.statusStyle}`}>
                  {s.status}
                </span>
              </div>
              <h3 className="font-display text-2xl sm:text-4xl text-bone mb-3">{s.title}</h3>
              <p className="font-fell text-base sm:text-lg text-bone/75 leading-relaxed max-w-2xl">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
