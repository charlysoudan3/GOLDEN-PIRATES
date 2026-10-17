import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Shield } from "lucide-react";
import LogoMark from "./LogoMark";
import LangSwitcher from "./LangSwitcher";
import { scrollToId } from "@/App";
import { useLang } from "@/lib/i18n";

const EASE = [0.16, 1, 0.3, 1];

const LINKS = [
  { id: "alliance", key: "alliance", tid: "nav-link-manifesto" },
  { id: "code", key: "code", tid: "nav-link-code" },
  { id: "recit", key: "recit", tid: "nav-link-timeline" },
];

const MENU_LINKS = [
  ...LINKS,
  { id: "processus", key: "processus", tid: "nav-link-process" },
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
            ? "bg-ink/90 backdrop-blur-md border-b border-gold/15"
            : "bg-gradient-to-b from-ink/70 to-transparent"
        }`}
      >
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

          <nav className="hidden lg:flex items-center gap-7">
            {MENU_LINKS.map((l) => (
              <button
                key={l.id}
                data-testid={l.tid}
                onClick={() => go(l.id)}
                className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-bone/70 hover:text-gold transition-colors duration-300"
              >
                {c.nav[l.key]}
              </button>
            ))}
            <button
              data-testid="nav-link-status"
              onClick={goSuivi}
              className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-bone/70 hover:text-gold transition-colors duration-300"
            >
              {c.nav.suiviShort}
            </button>
            <LangSwitcher />
            <button
              data-testid="nav-cta-apply"
              onClick={goApply}
              className="font-display text-lg tracking-wider uppercase px-6 py-2 bg-gold text-ink border border-gold hover:bg-goldlight hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300"
            >
              {c.nav.cta}
            </button>
          </nav>

          <div className="flex items-center gap-3 lg:hidden">
            <LangSwitcher />
            <button
              data-testid="nav-mobile-toggle"
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className="p-2 -mr-2 text-gold"
            >
              {open ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
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
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[75] lg:hidden bg-ink/[0.98] backdrop-blur-xl flex flex-col items-center justify-center gap-7 px-6"
          >
            {MENU_LINKS.map((l, i) => (
              <motion.button
                key={l.id}
                data-testid={l.tid + "-mobile"}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 * i + 0.08, duration: 0.5, ease: EASE }}
                onClick={() => go(l.id)}
                className="font-display text-4xl text-bone hover:text-gold transition-colors"
              >
                {c.nav[l.key]}
              </motion.button>
            ))}

            <motion.button
              data-testid="nav-cta-apply-mobile"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.5, ease: EASE }}
              onClick={goApply}
              className="mt-2 w-full max-w-xs font-display text-2xl tracking-wider uppercase py-4 bg-gold text-ink hover:bg-goldlight hover:shadow-[0_0_35px_rgba(212,175,55,0.45)] transition-all duration-300"
            >
              {c.nav.cta}
            </motion.button>

            <motion.button
              data-testid="nav-link-status-mobile"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
              onClick={goSuivi}
              className="w-full max-w-xs font-mono2 text-xs tracking-[0.3em] text-gold border border-gold/40 px-6 py-3.5 uppercase"
            >
              {c.nav.suivi}
            </motion.button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-6 mt-2"
            >
              <button
                data-testid="nav-link-admin-mobile"
                onClick={goAdmin}
                className="font-mono2 text-[10px] tracking-[0.3em] text-mist flex items-center gap-2 uppercase"
              >
                <Shield className="w-3.5 h-3.5" /> {c.nav.admin}
              </button>
              <LangSwitcher />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
