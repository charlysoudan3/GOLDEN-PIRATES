import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, MapPin } from "lucide-react";
import LogoMark, { SkullIcon, CompassRose } from "./LogoMark";
import LangSwitcher from "./LangSwitcher";
import useAdminSession from "@/lib/useAdminSession";
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
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isRecruit, setIsRecruit] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { c } = useLang();
  const isAdmin = useAdminSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Une RECRUE = au moins un code gardé dans son coffre local (gp_bottles).
  // Réactif : montage, autre onglet (storage) et même onglet (gp_bottles_change).
  useEffect(() => {
    const read = () => {
      try {
        const v = JSON.parse(localStorage.getItem("gp_bottles"));
        setIsRecruit(Array.isArray(v) && v.length > 0);
      } catch {
        setIsRecruit(false);
      }
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("gp_bottles_change", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("gp_bottles_change", read);
    };
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const goAnchor = (id) => {
    setOpen(false);
    if (location.pathname !== "/") navigate("/#" + id);
    else scrollToId(id);
  };
  const goPage = (path) => { setOpen(false); navigate(path); };

  // La barre ne garde qu'UN bouton d'action — réservé au VISITEUR (Postuler).
  // Recrues et Conseil passent par le menu : zéro doublon, zéro bouton qui change tout seul.
  const onSuivi = location.pathname === "/suivi";

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
                {c.nav.kingdom}
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <LangSwitcher />
            {!isAdmin && !isRecruit && (
              <button
                data-testid="nav-cta-apply"
                onClick={() => goAnchor("postuler")}
                className="hidden md:block font-display text-lg tracking-wider uppercase px-6 py-2 bg-gold text-ink border border-gold hover:bg-goldlight hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300"
              >
                {c.nav.cta}
              </button>
            )}
            <button
              data-testid="nav-menu-toggle"
              onClick={() => setOpen(true)}
              aria-label="Menu"
              aria-expanded={open}
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
            transition={{ duration: 0.35, ease: EASE }}
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

            <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row overflow-x-hidden overflow-y-auto">
              {/* NAVIGATION — les grandes pages, pour tout le monde */}
              <div className="lg:w-1/2 flex flex-col justify-start lg:justify-center px-6 sm:px-10 lg:px-16 py-8 lg:py-10 lg:pb-14">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6, ease: EASE }}
                  className="font-mono2 text-[11px] tracking-[0.4em] text-gold mb-6 lg:mb-8"
                >
                  NAVIGATION
                </motion.p>
                <nav className="space-y-3 sm:space-y-7">
                  {NAV_ITEMS.map((l, i) => (
                    <motion.button
                      key={l.id}
                      data-testid={l.tid}
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.09, duration: 0.7, ease: EASE }}
                      onClick={() => goAnchor(l.id)}
                      className="group flex items-baseline gap-4 sm:gap-6 text-left w-max max-w-full"
                    >
                      <span className="font-mono2 text-sm sm:text-lg text-gold/50 w-8 shrink-0">{l.num}</span>
                      <span className="relative font-display text-4xl sm:text-6xl lg:text-7xl text-bone group-hover:text-gold transition-colors duration-300 whitespace-nowrap">
                        {c.nav[l.key]}
                        <span className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
                          <SkullIcon className="w-5 h-5 text-blood" />
                        </span>
                        <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-gold group-hover:w-full transition-all duration-500" />
                      </span>
                    </motion.button>
                  ))}
                </nav>
              </div>

              {/* TON ESPACE — un seul visage selon qui tu es, jamais de doublon */}
              <div className="lg:w-1/2 flex flex-col justify-start lg:justify-center px-6 sm:px-10 lg:px-16 py-8 lg:py-10 lg:pb-14 gap-4 lg:gap-5">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
                  className="font-mono2 text-[11px] tracking-[0.4em] text-gold"
                >
                  {isAdmin ? c.footer.councilTitle : c.footer.spacesTitle}
                </motion.p>

                {isAdmin ? (
                  <>
                    <motion.button
                      data-testid="nav-link-admin-registry"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
                      onClick={() => goPage("/admin")}
                      aria-current={location.pathname === "/admin" ? "page" : undefined}
                      className="w-full max-w-md flex items-center justify-center gap-2.5 bg-gold text-ink font-mono2 text-xs tracking-[0.3em] px-6 py-4 uppercase hover:bg-goldlight transition-all duration-300"
                    >
                      {c.nav.admin}
                    </motion.button>
                    <motion.button
                      data-testid="nav-link-admin-messages"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.58, duration: 0.7, ease: EASE }}
                      onClick={() => goPage("/admin#messagerie")}
                      className="w-full max-w-md flex items-center justify-center gap-2.5 text-gold border border-gold/40 font-mono2 text-xs tracking-[0.3em] px-6 py-4 uppercase hover:bg-gold/10 transition-all duration-300"
                    >
                      {c.nav.messagerie}
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    data-testid="nav-link-status"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
                    onClick={onSuivi ? undefined : () => goPage("/suivi")}
                    aria-current={onSuivi ? "page" : undefined}
                    className={`w-full max-w-md flex items-center justify-center gap-2.5 font-mono2 text-xs tracking-[0.3em] px-6 py-4 uppercase transition-all duration-300 ${
                      onSuivi
                        ? "border border-gold bg-gold/10 text-gold cursor-default"
                        : isRecruit
                          ? "bg-gold text-ink border border-gold hover:bg-goldlight hover:shadow-[0_0_35px_rgba(212,175,55,0.4)]"
                          : "text-gold border border-gold/40 hover:bg-gold/10 hover:border-gold"
                    }`}
                  >
                    {onSuivi ? (
                      <>
                        <MapPin className="w-4 h-4 shrink-0" /> {c.nav.suivi} — {c.nav.here}
                      </>
                    ) : (
                      c.nav.suivi
                    )}
                  </motion.button>
                )}

                <motion.button
                  data-testid="nav-link-butin"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.62, duration: 0.7, ease: EASE }}
                  onClick={location.pathname === "/donations" ? undefined : () => goPage("/donations")}
                  aria-current={location.pathname === "/donations" ? "page" : undefined}
                  className={`w-full max-w-md flex items-center justify-center gap-2.5 font-mono2 text-xs tracking-[0.3em] px-6 py-4 uppercase transition-all duration-300 ${
                    location.pathname === "/donations"
                      ? "border border-gold bg-gold/10 text-gold cursor-default"
                      : "text-mist border border-mist/30 bg-deck/50 hover:text-gold hover:border-gold/60 hover:bg-gold/5"
                  }`}
                >
                  <Coins className="w-4 h-4 text-gold/70 shrink-0" />
                  {c.nav.butin}
                  {location.pathname === "/donations" && <span className="text-gold">— {c.nav.here}</span>}
                </motion.button>
              </div>
            </div>

            <div
              className="relative z-10 shrink-0 border-t border-gold/15 bg-ink/80 backdrop-blur px-4 sm:px-8 py-3 flex items-center justify-between gap-4"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
            >
              <span className="font-mono2 text-[9px] tracking-[0.3em] text-mist">GOLDEN PIRATES — {c.nav.kingdom}</span>
              <SkullIcon className="w-4 h-4 text-blood/80 shrink-0" />
              <span className="hidden sm:block font-mono2 text-[9px] tracking-[0.3em] text-mist">{c.hero.chips[2]}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
