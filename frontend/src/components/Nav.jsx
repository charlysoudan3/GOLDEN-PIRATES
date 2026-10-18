import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Coins, MapPin, Anchor, X } from "lucide-react";
import LogoMark, { SkullIcon, CompassRose } from "./LogoMark";
import LangSwitcher from "./LangSwitcher";
import useAdminSession from "@/lib/useAdminSession";
import { scrollToId } from "@/App";
import { useLang } from "@/lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

// LE DOCK DE COMMANDEMENT — chaque onglet à sa place, visibles directement dans la barre (desktop).
const DOCK_TABS = [
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

  const onSuivi = location.pathname === "/suivi";
  const onButin = location.pathname === "/donations";
  const onAdmin = location.pathname === "/admin";

  return (
    <>
      <header
        data-testid="nav-header"
        className={`fixed top-0 inset-x-0 z-[80] transition-all duration-500 ${
          scrolled
            ? "bg-[#0C121C]/90 backdrop-blur-2xl border-b border-gold/30 shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
            : "bg-gradient-to-b from-ink/80 via-ink/40 to-transparent"
        }`}
      >
        <div className="absolute inset-x-0 bottom-0 h-[3px] rope-line opacity-50" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 md:h-20 flex items-center justify-between gap-3">
          {/* PAVILLON — la marque */}
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
              <span className="block font-display text-base sm:text-xl md:text-2xl text-gold tracking-wide whitespace-nowrap">
                GOLDEN PIRATES
              </span>
              <span className="block font-mono2 text-[8px] sm:text-[10px] tracking-[0.4em] text-mist mt-1 whitespace-nowrap">
                {c.nav.kingdom}
              </span>
            </span>
          </button>

          {/* LES ONGLETS DU DOCK — visibles directement, plus besoin de menu sur grand écran */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {DOCK_TABS.map((t) => (
              <button
                key={t.id}
                data-testid={t.tid}
                onClick={() => goAnchor(t.id)}
                className="group relative flex items-baseline gap-1.5 px-3 py-2 font-fell text-base text-bone/85 hover:text-gold transition-colors duration-300"
              >
                <span className="font-mono2 text-[10px] text-gold/50 group-hover:text-gold">{t.num}</span>
                <span className="relative">
                  {c.nav[t.key]}
                  <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-gold group-hover:w-full transition-all duration-400" />
                </span>
              </button>
            ))}
            <button
              data-testid="nav-link-butin"
              onClick={() => goPage("/donations")}
              aria-current={onButin ? "page" : undefined}
              className={`relative flex items-center gap-1.5 px-3 py-2 font-fell text-base transition-colors duration-300 ${
                onButin ? "text-gold" : "text-bone/85 hover:text-gold"
              }`}
            >
              <Coins className="w-4 h-4 text-gold/70" />
              {c.nav.butin}
              <span className={`absolute -bottom-1 left-0 h-[2px] bg-gold transition-all duration-400 ${onButin ? "w-full" : "w-0"}`} />
            </button>
          </nav>

          {/* LA PASSERELLE DE COMMANDEMENT — langues, CONSEIL (toujours là), CTA du public */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LangSwitcher />
            <button
              data-testid="nav-link-council"
              onClick={() => goPage("/admin")}
              aria-current={onAdmin ? "page" : undefined}
              className={`flex items-center gap-1.5 sm:gap-2 font-mono2 text-[10px] sm:text-xs tracking-[0.2em] uppercase px-2.5 sm:px-4 py-2 border transition-all duration-300 ${
                onAdmin && isAdmin
                  ? "border-gold bg-gold/15 text-gold shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                  : "border-[#8B0000]/70 bg-[#8B0000]/25 text-bone hover:bg-[#8B0000]/45 hover:border-[#8B0000]"
              }`}
            >
              <Shield className={`w-3.5 h-3.5 shrink-0 ${onAdmin && isAdmin ? "text-gold" : "text-red-400"}`} />
              <span className="hidden sm:inline">{c.nav.conseil}</span>
            </button>
            {/* CRENEAU D'ACTION — largeur fixe : zéro déplacement de boutons quand le rôle change */}
            <div className="hidden md:flex items-center justify-end min-w-[170px]">
              {isAdmin ? null : isRecruit ? (
                <button
                  data-testid="nav-cta-suivi"
                  onClick={() => goPage("/suivi")}
                  className="font-display text-base lg:text-lg tracking-wider uppercase px-5 py-2 bg-gold text-ink border border-gold hover:bg-goldlight hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300 whitespace-nowrap"
                >
                  {c.nav.suivi}
                </button>
              ) : (
                <button
                  data-testid="nav-cta-apply"
                  onClick={() => goAnchor("postuler")}
                  className="font-display text-base lg:text-lg tracking-wider uppercase px-5 py-2 bg-gold text-ink border border-gold hover:bg-goldlight hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300 whitespace-nowrap"
                >
                  {c.nav.cta}
                </button>
              )}
            </div>
            <button
              data-testid="nav-menu-toggle"
              onClick={() => setOpen(true)}
              aria-label="Menu"
              aria-expanded={open}
              className="lg:hidden group flex items-center gap-2 border border-gold/40 bg-[#0C121C]/70 backdrop-blur px-2.5 py-2 hover:border-gold hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300"
            >
              <CompassRose className="w-6 h-6 animate-spin-slow" />
              <span className="hidden sm:block font-display text-lg text-gold tracking-wider">MENU</span>
            </button>
          </div>
        </div>
      </header>

      {/* LE TIROIR HUD — verre obsidienne, mobile & tablette */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-0 z-[85] bg-ink/70 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            data-testid="nav-drawer-overlay"
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.45, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              data-testid="nav-drawer"
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#0C121C]/95 backdrop-blur-2xl border-l border-gold/30 shadow-[-20px_0_60px_rgba(0,0,0,0.7)] flex flex-col"
            >
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(11,25,44,0.9),transparent_55%)]" />
                <SkullIcon className="absolute right-[-8%] bottom-[-10%] w-[70vw] max-w-[420px] text-gold/[0.05]" />
              </div>

              <div className="relative z-10 flex items-center justify-between px-5 h-16 border-b border-gold/15">
                <div className="flex items-center gap-2.5">
                  <LogoMark className="w-9 h-9" />
                  <span className="leading-none">
                    <span className="block font-display text-lg text-gold tracking-wide">GOLDEN PIRATES</span>
                    <span className="block font-mono2 text-[8px] tracking-[0.4em] text-mist mt-1">{c.nav.kingdom}</span>
                  </span>
                </div>
                <button
                  data-testid="nav-menu-close"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="p-2 text-gold hover:rotate-90 transition-transform duration-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-5 py-6 space-y-7">
                {/* LA NAVIGATION */}
                <div>
                  <p className="font-mono2 text-[10px] tracking-[0.4em] text-gold mb-4">NAVIGATION</p>
                  <div className="space-y-1">
                    {DOCK_TABS.map((t, i) => (
                      <motion.button
                        key={t.id}
                        data-testid={t.tid}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.12 + i * 0.06, duration: 0.5, ease: EASE }}
                        onClick={() => goAnchor(t.id)}
                        className="group w-full flex items-baseline gap-3 py-2.5 text-left border-b border-gold/10 hover:border-gold/30 transition-colors"
                      >
                        <span className="font-mono2 text-[11px] text-gold/50 w-6 shrink-0">{t.num}</span>
                        <span className="font-fell text-xl text-bone group-hover:text-gold transition-colors duration-300">
                          {c.nav[t.key]}
                        </span>
                        <Anchor className="w-3.5 h-3.5 text-gold/0 group-hover:text-gold/70 ml-auto transition-colors duration-300" />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* TON ESPACE — un seul visage selon qui tu es */}
                <div>
                  <p className="font-mono2 text-[10px] tracking-[0.4em] text-gold mb-4">
                    {isAdmin ? c.nav.conseil : c.footer.spacesTitle}
                  </p>
                  <div className="space-y-2.5">
                    {isAdmin ? (
                      <>
                        <motion.button
                          data-testid="nav-link-admin-registry"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45, duration: 0.5, ease: EASE }}
                          onClick={() => goPage("/admin")}
                          className="w-full flex items-center justify-center gap-2 bg-gold text-ink font-mono2 text-[11px] tracking-[0.25em] px-5 py-3.5 uppercase hover:bg-goldlight transition-all duration-300"
                        >
                          <Shield className="w-4 h-4 shrink-0" /> {c.nav.registre}
                        </motion.button>
                        <motion.button
                          data-testid="nav-link-admin-messages"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.52, duration: 0.5, ease: EASE }}
                          onClick={() => goPage("/admin#messagerie")}
                          className="w-full flex items-center justify-center gap-2 text-gold border border-gold/40 font-mono2 text-[11px] tracking-[0.25em] px-5 py-3.5 uppercase hover:bg-gold/10 transition-all duration-300"
                        >
                          {c.nav.messagerie}
                        </motion.button>
                      </>
                    ) : (
                      <>
                        {!isRecruit && (
                          <motion.button
                            data-testid="nav-cta-apply-menu"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45, duration: 0.5, ease: EASE }}
                            onClick={() => goAnchor("postuler")}
                            className="w-full flex items-center justify-center bg-gold text-ink font-mono2 text-[11px] tracking-[0.25em] px-5 py-3.5 uppercase hover:bg-goldlight transition-all duration-300"
                          >
                            {c.nav.cta}
                          </motion.button>
                        )}
                        <motion.button
                          data-testid="nav-link-status"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.52, duration: 0.5, ease: EASE }}
                          onClick={onSuivi ? undefined : () => goPage("/suivi")}
                          aria-current={onSuivi ? "page" : undefined}
                          className={`w-full flex items-center justify-center gap-2 font-mono2 text-[11px] tracking-[0.25em] px-5 py-3.5 uppercase transition-all duration-300 ${
                            onSuivi
                              ? "border border-gold bg-gold/10 text-gold cursor-default"
                              : isRecruit
                                ? "bg-gold text-ink border border-gold hover:bg-goldlight"
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
                      </>
                    )}
                    <motion.button
                      data-testid="nav-link-butin"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.58, duration: 0.5, ease: EASE }}
                      onClick={onButin ? undefined : () => goPage("/donations")}
                      aria-current={onButin ? "page" : undefined}
                      className={`w-full flex items-center justify-center gap-2 font-mono2 text-[11px] tracking-[0.25em] px-5 py-3.5 uppercase transition-all duration-300 ${
                        onButin
                          ? "border border-gold bg-gold/10 text-gold cursor-default"
                          : "text-gold border border-gold/40 hover:bg-gold/10 hover:border-gold"
                      }`}
                    >
                      <Coins className="w-4 h-4 shrink-0" />
                      {c.nav.butin}
                      {onButin && <span className="text-gold">— {c.nav.here}</span>}
                    </motion.button>
                  </div>
                </div>
              </div>

              <div
                className="relative z-10 shrink-0 border-t border-gold/15 bg-ink/80 px-5 py-3 flex items-center justify-between gap-3"
                style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
              >
                <span className="font-mono2 text-[9px] tracking-[0.3em] text-mist">G.P. — {c.nav.kingdom}</span>
                <SkullIcon className="w-4 h-4 text-blood/80 shrink-0" />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
