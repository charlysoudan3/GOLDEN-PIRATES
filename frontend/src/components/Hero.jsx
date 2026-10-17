import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { scrollToId } from "@/App";

const EASE = [0.16, 1, 0.3, 1];
const HERO_BG =
  "https://images.pexels.com/photos/38427508/pexels-photo-38427508.jpeg?auto=compress&cs=tinysrgb&w=1800";

function CompassRose({ className = "" }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="96" stroke="#D4AF37" strokeWidth="1" opacity="0.55" />
      <circle cx="100" cy="100" r="78" stroke="#D4AF37" strokeWidth="0.6" opacity="0.35" />
      <circle cx="100" cy="100" r="60" stroke="#D4AF37" strokeWidth="0.6" strokeDasharray="2 6" opacity="0.5" />
      <path d="M100 8 L110 90 L100 100 L90 90 Z" fill="#D4AF37" />
      <path d="M100 192 L90 110 L100 100 L110 110 Z" fill="#9A7B1C" opacity="0.8" />
      <path d="M8 100 L90 90 L100 100 L90 110 Z" fill="#9A7B1C" opacity="0.8" />
      <path d="M192 100 L110 110 L100 100 L110 90 Z" fill="#D4AF37" />
      {[
        [38, 38, 82, 86], [162, 38, 118, 86], [38, 162, 82, 114], [162, 162, 118, 114],
      ].map(([x1, y1, x2, y2], i) => (
        <path key={i} d={`M${x1} ${y1} L${x2} ${y2} L${x2} ${y1} Z`} fill="#D4AF37" opacity="0.35" />
      ))}
      <circle cx="100" cy="100" r="14" fill="#06090E" stroke="#D4AF37" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="4" fill="#B91C1C" />
    </svg>
  );
}

const RevealLine = ({ children, delay, className = "" }) => (
  <span className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
    <motion.span
      className={`block ${className}`}
      initial={{ y: "115%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      {children}
    </motion.span>
  </span>
);

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.2]);
  const contentFade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [14, -14]), { stiffness: 50, damping: 16 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 50, damping: 16 });

  const onMouseMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section
      ref={ref}
      data-testid="hero-section"
      onMouseMove={onMouseMove}
      className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden"
    >
      <motion.div className="absolute inset-0" style={{ y: bgY, scale: bgScale }}>
        <img
          src={HERO_BG}
          alt="Navire pirate sous un ciel d'orage"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/55 to-ink" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,9,14,0.85)_85%)]" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-1/3 h-1/2 bg-[radial-gradient(ellipse_at_30%_40%,rgba(120,150,170,0.14),transparent_60%)] animate-fog"
      />

      <motion.div
        aria-hidden="true"
        className="absolute right-[-8%] top-1/2 -translate-y-1/2 hidden lg:block w-[46vw] max-w-[640px] opacity-[0.5]"
        style={{ rotateX, rotateY, transformPerspective: 1000 }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 2, ease: EASE, delay: 0.6 }}
      >
        <div className="animate-spin-slow">
          <CompassRose className="w-full h-auto drop-shadow-[0_0_35px_rgba(212,175,55,0.25)]" />
        </div>
      </motion.div>

      <motion.div
        style={{ opacity: contentFade, y: contentY }}
        className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 pt-24 md:pt-16"
      >
        <RevealLine delay={0.15}>
          <div className="flex flex-wrap items-center gap-3 mb-6 md:mb-8" data-testid="hero-badge-kvk">
            <span className="inline-flex items-center gap-2 border border-gold/40 bg-ink/60 backdrop-blur px-4 py-1.5 font-mono2 text-[10px] sm:text-xs tracking-[0.3em] text-gold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bloodglow opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blood" />
              </span>
              PRÉ-KVK — SAISON 2
            </span>
            <span className="hidden sm:inline-block border border-bone/20 bg-ink/60 backdrop-blur px-4 py-1.5 font-mono2 text-[10px] sm:text-xs tracking-[0.3em] text-bone/70">
              RECRUTEMENT : FIN DE SAISON 2
            </span>
          </div>
        </RevealLine>

        <h1 data-testid="hero-title" className="leading-[0.88]">
          <RevealLine delay={0.3} className="font-display text-[clamp(4.2rem,15vw,12rem)] text-gold text-glow-gold">
            GOLDEN
          </RevealLine>
          <RevealLine delay={0.44} className="font-display text-[clamp(4.2rem,15vw,12rem)] text-stroke-gold">
            PIRATES
          </RevealLine>
        </h1>

        <RevealLine delay={0.6}>
          <p data-testid="hero-subtitle" className="font-fell italic text-base sm:text-xl md:text-2xl text-bone/90 mt-6 md:mt-8 max-w-2xl">
            L'alliance souveraine du Royaume 1023 — <span className="text-gold">Call of Dragons</span>.
            L'or de la victoire ne coule que pour les équipages soudés.
          </p>
        </RevealLine>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 mt-9 md:mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.85 }}
        >
          <button
            data-testid="hero-cta-apply"
            onClick={() => scrollToId("postuler")}
            className="group relative font-display text-2xl tracking-wider px-10 py-4 bg-gold text-ink hover:bg-goldlight hover:shadow-[0_0_45px_rgba(212,175,55,0.5)] transition-all duration-300"
          >
            REJOINDRE L'ÉQUIPAGE
            <span className="absolute inset-0 border border-goldlight/60 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <Link
            data-testid="hero-cta-track"
            to="/suivi"
            className="font-display text-2xl tracking-wider px-10 py-4 border border-gold/50 text-gold hover:border-gold hover:bg-gold/10 transition-all duration-300 text-center"
          >
            SUIVRE MA CANDIDATURE
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-0 inset-x-0 z-10 border-t border-gold/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 1 }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-6 font-mono2 text-[10px] tracking-[0.35em] text-bone/50">
            <span>ROYAUME 1023</span>
            <span className="text-gold/50">✦</span>
            <span>CALL OF DRAGONS</span>
            <span className="text-gold/50">✦</span>
            <span>UNE SEULE FLOTTE, UN SEUL BUTIN</span>
          </div>
          <button
            data-testid="hero-scroll-cue"
            onClick={() => scrollToId("alliance")}
            className="flex items-center gap-2 font-mono2 text-[10px] tracking-[0.35em] text-gold/80 hover:text-gold transition-colors mx-auto sm:mx-0"
          >
            DÉROULER LA CARTE
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>
      </motion.div>
    </section>
  );
}
