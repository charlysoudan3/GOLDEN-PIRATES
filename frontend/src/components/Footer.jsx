import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import LogoMark from "./LogoMark";
import { useLang } from "@/lib/i18n";
import useAdminSession from "@/lib/useAdminSession";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { c } = useLang();
  const isAdmin = useAdminSession();
  const s = c.footer;
  // Une RECRUE = au moins un code gardé dans son coffre local — elle ne voit plus « Postuler ».
  // Réactif : montage, changement de page, autre onglet (storage) et même onglet (gp_bottles_change).
  const [isRecruit, setIsRecruit] = useState(false);
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
  }, [location.pathname]);
  const backToTop = () => {
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goTo = (id) => {
    if (window.location.pathname !== "/") navigate("/#" + id);
    else
      window.__lenis
        ? window.__lenis.scrollTo("#" + id, { offset: -76 })
        : document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
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
                <p className="font-mono2 text-[9px] tracking-[0.4em] text-mist mt-1">{c.nav.kingdom}</p>
              </div>
            </div>
            <p className="font-fell italic text-base text-bone/70 max-w-sm leading-relaxed">{s.tagline}</p>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono2 text-[10px] tracking-[0.35em] text-gold mb-5">{s.navTitle}</p>
            <ul className="space-y-3 font-fell text-base text-bone/75">
              {s.links.map((l) => (
                <li key={l.id}>
                  <button onClick={() => goTo(l.id)} className="hover:text-gold transition-colors">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="font-mono2 text-[10px] tracking-[0.35em] text-gold mb-5">{isAdmin ? s.councilTitle : s.spacesTitle}</p>
            <ul className="space-y-3 font-fell text-base">
              {isAdmin ? (
                <>
                  <li>
                    <button
                      data-testid="footer-council-register"
                      onClick={() => navigate("/admin")}
                      className="text-gold hover:text-goldlight transition-colors"
                    >
                      {s.councilRegister}
                    </button>
                  </li>
                  <li>
                    <button
                      data-testid="footer-council-messages"
                      onClick={() => navigate("/admin#messagerie")}
                      className="text-bone/75 hover:text-gold transition-colors"
                    >
                      {s.councilMessages}
                    </button>
                  </li>
                </>
              ) : (
                <>
                  {isRecruit ? (
                    <li>
                      <button
                        data-testid="footer-track-link"
                        onClick={() => navigate("/suivi")}
                        className="text-gold hover:text-goldlight transition-colors"
                      >
                        {s.trackLink}
                      </button>
                    </li>
                  ) : (
                    <li>
                      <button
                        data-testid="footer-apply-link"
                        onClick={() => navigate("/#postuler")}
                        className="text-gold hover:text-goldlight transition-colors"
                      >
                        {s.applyLink}
                      </button>
                    </li>
                  )}
                  {!isRecruit && (
                    <li>
                      <button
                        data-testid="footer-track-link"
                        onClick={() => navigate("/suivi")}
                        className="text-bone/75 hover:text-gold transition-colors"
                      >
                        {s.trackLink}
                      </button>
                    </li>
                  )}
                </>
              )}
              <li>
                <button
                  data-testid="footer-donation-link"
                  onClick={() => navigate("/donations")}
                  className="text-bone/75 hover:text-gold transition-colors"
                >
                  {s.donationLink}
                </button>
              </li>
            </ul>
            <button
              data-testid="footer-back-to-top"
              onClick={backToTop}
              className="mt-8 inline-flex items-center gap-3 font-mono2 text-[10px] tracking-[0.35em] text-gold border border-gold/40 px-5 py-3 hover:bg-gold/10 transition-all group"
            >
              {s.backTop}
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
          <p className="font-mono2 text-[9px] tracking-[0.25em] text-mist text-center sm:text-left">{s.disclaimer}</p>
          <p className="font-mono2 text-[9px] tracking-[0.25em] text-mist">{s.madeWith}</p>
        </div>
      </div>
    </footer>
  );
}
