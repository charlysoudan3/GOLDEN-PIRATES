import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import LogoMark from "./LogoMark";

export default function Footer() {
  const navigate = useNavigate();
  const backToTop = () => {
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer data-testid="footer" className="relative border-t border-gold/15 bg-[#04070B] overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 md:pt-20 pb-10">
        <div className="grid md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-5">
            <div data-testid="footer-logo" className="flex items-center gap-3 mb-5">
              <LogoMark className="w-11 h-11" />
              <div className="leading-none">
                <p className="font-display text-2xl text-gold">GOLDEN PIRATES</p>
                <p className="font-mono2 text-[9px] tracking-[0.4em] text-mist mt-1">ROYAUME 1023</p>
              </div>
            </div>
            <p className="font-fell italic text-base text-bone/70 max-w-sm leading-relaxed">
              L'alliance souveraine de Call of Dragons. L'or de la victoire ne coule que pour les
              équipages soudés.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono2 text-[10px] tracking-[0.35em] text-gold mb-5">NAVIGATION</p>
            <ul className="space-y-3 font-fell text-base text-bone/75">
              {[
                ["L'alliance", "/#alliance"],
                ["Le Code des Pirates", "/#code"],
                ["Le récit des saisons", "/#recit"],
                ["Postuler", "/#postuler"],
              ].map(([label, href]) => (
                <li key={href}>
                  <button
                    onClick={() => {
                      const id = href.split("#")[1];
                      if (window.location.pathname !== "/") navigate("/#" + id);
                      else window.__lenis
                        ? window.__lenis.scrollTo("#" + id, { offset: -76 })
                        : document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-gold transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="font-mono2 text-[10px] tracking-[0.35em] text-gold mb-5">LES ESPACES</p>
            <ul className="space-y-3 font-fell text-base">
              <li>
                <button
                  data-testid="footer-track-link"
                  onClick={() => navigate("/suivi")}
                  className="text-bone/75 hover:text-gold transition-colors"
                >
                  Espace Recrue — suivre ma candidature
                </button>
              </li>
              <li>
                <button
                  data-testid="footer-admin-link"
                  onClick={() => navigate("/admin")}
                  className="text-bone/75 hover:text-gold transition-colors"
                >
                  Espace Conseil — accès Capitaines
                </button>
              </li>
            </ul>
            <button
              data-testid="footer-back-to-top"
              onClick={backToTop}
              className="mt-8 inline-flex items-center gap-3 font-mono2 text-[10px] tracking-[0.35em] text-gold border border-gold/40 px-5 py-3 hover:bg-gold/10 transition-all group"
            >
              HISSER LA VOILE
              <Compass className="w-4 h-4 transition-transform duration-700 group-hover:rotate-[360deg]" />
            </button>
          </div>
        </div>

        <p
          aria-hidden="true"
          className="font-display text-[13.5vw] leading-[0.85] text-center select-none text-gold/[0.07] pointer-events-none"
        >
          GOLDEN PIRATES
        </p>

        <div className="border-t border-gold/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono2 text-[9px] tracking-[0.25em] text-mist text-center sm:text-left">
            © GOLDEN PIRATES — ROYAUME 1023 · SITE COMMUNAUTAIRE DE FANS, NON AFFILIÉ À CALL OF DRAGONS
          </p>
          <p className="font-mono2 text-[9px] tracking-[0.25em] text-mist">
            FABRIQUÉ AU CREUX DE LA HUNE
          </p>
        </div>
      </div>
    </footer>
  );
}
