import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield } from "lucide-react";
import LogoMark, { SkullIcon, CompassRose } from "./LogoMark";
import LangSwitcher from "./LangSwitcher";
import { scrollToId } from "@/App";
import { useLang } from "@/lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

const NAV_ITEMS = [
  { id: "alliance", key: "alliance", num: "I.", tid: "nav-link-manifesto" },
  { id: "code", key: "code", num: "II.", tid: "nav-link-code" },
  { id: "recit", key: "recit", num: "III.", tid: "nav-link-timeline" },
  { id: "processus", key: "processus", num: "IV.", tid: "nav-link-process" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { c } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const go = (id) => {
    setOpen(false);
    if (location.pathname !== "/") navigate("/#" + id);
    else scrollToId(id);
  };

  const goSuivi = () => {
    setOpen(false);
    navigate("/suivi");
  };

  const goAdmin = () => {
    setOpen(false);
    navigate("/admin");
  };

  const goApply = () => {
    setOpen(false);
    if (location.pathname !== "/") navigate("/#postuler");
    else scrollToId("postuler");
  };

  return (
    <>
      <header
        data-testid="nav-header"
        className={`fixed top-0 inset-x-0 z-[80] transition-all duration-500 ${
          scrolled
            ? "bg-ink/90 backdrop-blur-md border-b border-gold/20"
            : "bg-gradient-to-b from-ink/70 to-transparent"
        }`}
      >
        <div className="absolute inset-x-0 bottom-0 h-[3px] rope-line opacity-60" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 md:h-20 flex items-center justify-between gap-3">
          <button
            data-testid="nav-logo"
            onClick={() => {
              setOpen(false);
              if (location.pathname !== "/") navigate("/");
              else window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2.5 md:gap-3 group min-w-0"
          >
            <LogoMark className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0 transition-transform duration-700 group-hover:rotate-90" />
            <span className="text-left leading-none min-w-0">
              <span className="block font-display text-lg sm:text-xl md:text-2xl text-gold tracking-wide whitespace-nowrap">
                GOLDEN PIRATES
              </span>
              <span className="block font-mono2 text-[8px] sm:text-[10px] tracking-[0.4em] text-mist mt-1 whitespace-nowrap">
                ROYAUME 1023
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <LangSwitcher />
            <button
              data-testid="nav-cta-apply"
              onClick={goApply}
              className="hidden md:block font-display text-lg tracking-wider uppercase px-6 py-2 bg-gold text-ink border border-gold hover:bg-goldlight hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300"
            >
              {c.nav.cta}
            </button>
            <button
              data-testid="nav-menu-toggle"
              onClick={() => setOpen(true)}
              aria-label="Menu"
              className="group flex items-center gap-2.5 border border-gold/40 bg-ink/60 backdrop-blur px-2.5 py-2 sm:px-4 hover:border-gold hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300"
            >
              <CompassRose className="w-6 h-6 sm:w-7 sm:h-7 animate-spin-slow" />
              <span className="hidden sm:block font-display text-lg text-gold tracking-wider">MENU</span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 z-[85] bg-ink overflow-hidden flex flex-col"
          >
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(11,25,44,0.9),transparent_60%)]" />
              <div className="absolute inset-x-0 top-1/4 h-1/2 bg-[radial-gradient(ellipse_at_70%_50%,rgba(120,150,170,0.12),transparent_65%)] animate-fog" />
              <div className="absolute right-[-15%] top-1/2 -translate-y-1/2 w-[70vw] max-w-[760px] opacity-[0.1] hidden md:block">
                <div className="animate-spin-slow">
                  <CompassRose className="w-full h-auto" />
                </div>
              </div>
              <SkullIcon className="absolute left-[-6%] bottom-[-14%] w-[60vw] max-w-[560px] text-gold/[0.05]" />
              <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(212,175,55,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.4) 1px, transparent 1px)",
                  backgroundSize: "72px 72px",
                }}
              />
            </div>

            <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 h-16 md:h-20 border-b border-gold/15">
              <LogoMark className="w-8 h-8 md:w-10 md:h-10" />
              <div className="flex items-center gap-3 sm:gap-4">
                <LangSwitcher />
                <button
                  data-testid="nav-menu-close"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="p-2 text-gold hover:rotate-90 transition-transform duration-500"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>
            </div>

            <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto">
              <div className="lg:w-1/2 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-10 pb-14">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
                  className="font-mono2 text-[11px] tracking-[0.4em] text-gold mb-8"
                >
                  NAVIGATION
                </motion.p>
                <nav className="space-y-5 sm:space-y-7">
                  {NAV_ITEMS.map((l, i) => (
                    <motion.button
                      key={l.id}
                      data-testid={l.tid}
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.09, duration: 0.7, ease: EASE }}
                      onClick={() => go(l.id)}
                      className="group flex items-baseline gap-4 sm:gap-6 text-left w-max max-w-full"
                    >
                      <span className="font-mono2 text-sm sm:text-lg text-gold/50 w-8 shrink-0">{l.num}</span>
                      <span className="relative font-display text-5xl sm:text-6xl lg:text-7xl text-bone group-hover:text-gold transition-colors duration-300 whitespace-nowrap">
                        {c.nav[l.key]}
                        <span className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <SkullIcon className="w-5 h-5 text-blood" />
                        </span>
                        <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-gold group-hover:w-full transition-all duration-500" />
                      </span>
                    </motion.button>
                  ))}
                </nav>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="hidden lg:block mt-12 rope-line h-[5px] w-3/4 opacity-50"
                  aria-hidden="true"
                />
              </div>

              <div className="lg:w-1/2 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-10 pb-14 gap-6">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
                  className="font-mono2 text-[11px] tracking-[0.4em] text-gold"
                >
                  {c.footer.spacesTitle}
                </motion.p>
                <motion.button
                  data-testid="nav-cta-apply-menu"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.7, ease: EASE }}
                  onClick={goApply}
                  className="relative w-full max-w-md font-display text-3xl sm:text-4xl tracking-wider uppercase py-5 bg-gold text-ink hover:bg-goldlight hover:shadow-[0_0_45px_rgba(212,175,55,0.5)] transition-all duration-300"
                >
                  {c.nav.cta}
                </motion.button>
                <motion.button
                  data-testid="nav-link-status"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.7, ease: EASE }}
                  onClick={goSuivi}
                  className="w-full max-w-md font-mono2 text-xs tracking-[0.3em] text-gold border border-gold/40 px-6 py-4 uppercase hover:bg-gold/10 hover:border-gold transition-all duration-300"
                >
                  {c.nav.suivi}
                </motion.button>
                <motion.button
                  data-testid="nav-link-admin"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
                  onClick={goAdmin}
                  className="w-full max-w-md flex items-center justify-center gap-2.5 font-mono2 text-xs tracking-[0.3em] text-bone/90 border border-mist/40 bg-deck/70 px-6 py-4 uppercase hover:text-gold hover:border-gold/60 hover:bg-gold/5 transition-all duration-300"
                >
                  <Shield className="w-4 h-4 text-gold/80 shrink-0" /> {c.nav.admin}
                </motion.button>
              </div>
            </div>

            <div
              className="relative z-10 shrink-0 border-t border-gold/15 bg-ink/80 backdrop-blur px-4 sm:px-8 py-3 flex items-center justify-between gap-4"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
            >
              <span className="font-mono2 text-[9px] tracking-[0.3em] text-mist">GOLDEN PIRATES — ROYAUME 1023</span>
              <SkullIcon className="w-4 h-4 text-blood/80 shrink-0" />
              <span className="hidden sm:block font-mono2 text-[9px] tracking-[0.3em] text-mist">{c.hero.chips[2]}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
