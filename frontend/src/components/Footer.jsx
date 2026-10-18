import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Compass, ShieldCheck, Lock } from "lucide-react";
import LogoMark from "./LogoMark";
import { useLang } from "@/lib/i18n";
import useAdminSession from "@/lib/useAdminSession";

const colTitle = "font-mono2 text-[10px] tracking-[0.35em] text-gold mb-5";
const label = "font-mono2 text-[9px] tracking-[0.25em] text-mist mb-1.5";
const badge =
  "inline-flex items-center gap-2 border border-emerald-400/50 bg-emerald-500/10 text-emerald-300 font-mono2 text-[9px] tracking-[0.2em] px-3 py-1.5";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { c } = useLang();
  const isAdmin = useAdminSession();
  const s = c.footer;
  const t = c.conditions.trust;
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
        {/* PAVOIS — la marque, la signature, la boussole */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-12">
          <div>
            <div data-testid="footer-logo" className="flex items-center gap-3 mb-4">
              <LogoMark className="w-11 h-11" />
              <div className="leading-none">
                <p className="font-display text-2xl text-gold">GOLDEN PIRATES</p>
                <p className="font-mono2 text-[9px] tracking-[0.4em] text-mist mt-1">{c.nav.kingdom}</p>
              </div>
            </div>
            <p className="font-fell italic text-base text-bone/70 max-w-md leading-relaxed">{s.tagline}</p>
          </div>
          <button
            data-testid="footer-back-to-top"
            onClick={backToTop}
            className="shrink-0 self-start inline-flex items-center gap-3 font-mono2 text-[10px] tracking-[0.35em] text-gold border border-gold/40 px-5 py-3 hover:bg-gold/10 transition-all group"
          >
            {s.backTop}
            <Compass className="w-4 h-4 transition-transform duration-700 group-hover:rotate-[360deg]" />
          </button>
        </div>

        {/* QUATRE QUARTIERS — chaque public et les règlements à leur place, jamais mélangés */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* 1 · EXPLORER LE NAVIRE — la découverte, pour tout le monde */}
          <div data-testid="footer-explore-col">
            <p className={colTitle}>{s.exploreTitle}</p>
            <ul className="space-y-3 font-fell text-base text-bone/75">
              {s.links.map((l) => (
                <li key={l.id}>
                  <button data-testid={`footer-explore-${l.id}`} onClick={() => goTo(l.id)} className="hover:text-gold transition-colors">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 2 · TON ESPACE — un seul visage selon qui tu es : visiteur, recrue ou Conseil */}
          <div data-testid="footer-spaces-col">
            <p className={colTitle}>{isAdmin ? s.councilTitle : s.spacesTitle}</p>
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
              ) : isRecruit ? (
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
                <>
                  <li>
                    <button
                      data-testid="footer-apply-link"
                      onClick={() => navigate("/#postuler")}
                      className="text-gold hover:text-goldlight transition-colors"
                    >
                      {s.applyLink}
                    </button>
                  </li>
                  <li>
                    <button
                      data-testid="footer-track-link"
                      onClick={() => navigate("/suivi")}
                      className="text-bone/75 hover:text-gold transition-colors"
                    >
                      {s.trackLink}
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* 3 · BUTIN & RÈGLEMENTS — soutenir le navire, lire les règles du bord */}
          <div data-testid="footer-rules-col">
            <p className={colTitle}>{s.lootTitle}</p>
            <ul className="space-y-3 font-fell text-base">
              <li>
                <button
                  data-testid="footer-donation-link"
                  onClick={() => navigate("/donations")}
                  className="text-bone/75 hover:text-gold transition-colors"
                >
                  {s.donationLink}
                </button>
              </li>
              <li>
                <button
                  data-testid="footer-trust-cgu"
                  onClick={() => navigate("/conditions")}
                  className="text-gold hover:text-goldlight underline underline-offset-4 transition-colors"
                >
                  {s.cguLink}
                </button>
              </li>
            </ul>
          </div>

          {/* 4 · LA CONFIANCE — un éditeur nominatif, un courriel dédié, deux serments */}
          <div data-testid="footer-trust-band">
            <p className={colTitle}>{s.trustTitle}</p>
            <p className={label}>{t.editorLabel}</p>
            <p data-testid="footer-trust-editor" className="font-fell text-base text-bone/85 leading-relaxed mb-3">
              {t.editor}
            </p>
            <p className={label}>{t.mailLabel}</p>
            <a
              data-testid="footer-trust-mail"
              href="mailto:golden.pirates@outlook.fr"
              className="font-fell text-base text-gold hover:text-goldlight underline underline-offset-4 break-all transition-colors"
            >
              golden.pirates@outlook.fr
            </a>
            <p className="font-fell text-sm text-mist mt-1.5 leading-relaxed">{t.mailNote}</p>
            <div data-testid="footer-trust-badges" className="flex flex-col items-start gap-2 mt-4">
              <span data-testid="footer-trust-free" className={badge}>
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> {t.badge1}
              </span>
              <span data-testid="footer-trust-nosale" className={badge}>
                <Lock className="w-3.5 h-3.5 shrink-0" /> {t.badge2}
              </span>
            </div>
          </div>
        </div>

        <p
          aria-hidden="true"
          className="font-display text-[13.5vw] leading-[0.85] text-center select-none text-gold/[0.07] pointer-events-none mt-14"
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
