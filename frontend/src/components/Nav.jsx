import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Shield } from "lucide-react";
import LogoMark from "./LogoMark";
import LangSwitcher from "./LangSwitcher";
import { scrollToId } from "@/App";
import { useLang } from "@/lib/i18n";

const LINKS = [
  { id: "alliance", key: "alliance", tid: "nav-link-manifesto" },
  { id: "code", key: "code", tid: "nav-link-code" },
  { id: "recit", key: "recit", tid: "nav-link-timeline" },
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
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
          <button
            data-testid="nav-logo"
            onClick={() => {
              setOpen(false);
              if (location.pathname !== "/") navigate("/");
              else window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-3 group"
          >
            <LogoMark className="w-9 h-9 md:w-10 md:h-10 transition-transform duration-700 group-hover:rotate-90" />
            <span className="text-left leading-none">
              <span className="block font-display text-xl md:text-2xl text-gold tracking-wide">GOLDEN PIRATES</span>
              <span className="block font-mono2 text-[9px] md:text-[10px] tracking-[0.4em] text-mist mt-1">
                ROYAUME 1023
              </span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-6">
            {LINKS.map((l) => (
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
              onClick={() => navigate("/suivi")}
              className="font-mono2 text-[11px] tracking-[0.25em] uppercase text-bone/70 hover:text-gold transition-colors duration-300"
            >
              {c.nav.suivi}
            </button>
            <LangSwitcher />
            <button
              data-testid="nav-link-admin"
              onClick={() => navigate("/admin")}
              aria-label={c.nav.admin}
              className="p-2 text-bone/50 hover:text-gold transition-colors duration-300"
            >
              <Shield className="w-4 h-4" />
            </button>
            <button
              data-testid="nav-cta-apply"
              onClick={() => go("postuler")}
              className="font-display text-lg tracking-wider uppercase px-6 py-2 bg-gold text-ink border border-gold hover:bg-goldlight hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-300"
            >
              {c.nav.cta}
            </button>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <LangSwitcher />
            <button
              data-testid="nav-cta-apply-mobile"
              onClick={() => go("postuler")}
              className="font-display text-base tracking-wider uppercase px-4 py-1.5 bg-gold text-ink border border-gold"
            >
              {c.nav.cta}
            </button>
            <button
              data-testid="nav-mobile-toggle"
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className="p-2 text-gold"
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
            className="fixed inset-0 z-[75] lg:hidden bg-ink/[0.98] backdrop-blur-xl flex flex-col items-center justify-center gap-8"
          >
            {LINKS.map((l, i) => (
              <motion.button
                key={l.id}
                data-testid={l.tid + "-mobile"}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i + 0.1, duration: 0.5 }}
                onClick={() => go(l.id)}
                className="font-display text-4xl text-bone hover:text-gold transition-colors"
              >
                {c.nav[l.key]}
              </motion.button>
            ))}
            <motion.button
              data-testid="nav-link-status-mobile"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              onClick={() => {
                setOpen(false);
                navigate("/suivi");
              }}
              className="font-mono2 text-xs tracking-[0.3em] text-gold border border-gold/40 px-6 py-3 uppercase"
            >
              {c.nav.suivi}
            </motion.button>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex items-center gap-6"
            >
              <button
                data-testid="nav-link-admin-mobile"
                onClick={() => {
                  setOpen(false);
                  navigate("/admin");
                }}
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
