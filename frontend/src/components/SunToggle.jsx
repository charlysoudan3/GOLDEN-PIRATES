import { useState } from "react";
import { Sun } from "lucide-react";

// VUE DE JOUR — relève le contraste pour la lisibilité en plein soleil.
export default function SunToggle() {
  const [sun, setSun] = useState(() => document.documentElement.classList.contains("sun-mode"));
  const toggle = () => {
    const v = !sun;
    setSun(v);
    document.documentElement.classList.toggle("sun-mode", v);
    try {
      localStorage.setItem("GP_SUN", v ? "1" : "0");
    } catch (e) {}
  };
  return (
    <button
      type="button"
      data-testid="sun-mode-toggle"
      onClick={toggle}
      aria-pressed={sun}
      aria-label="Vue de jour (plein soleil)"
      title="Vue de jour — plein soleil"
      className={`inline-flex items-center justify-center border border-gold/35 bg-ink/60 backdrop-blur px-2.5 py-1.5 transition-all duration-300 ${
        sun ? "text-gold shadow-[0_0_18px_rgba(212,175,55,0.4)]" : "text-bone/60 hover:text-gold"
      }`}
    >
      <Sun className={`w-4 h-4 ${sun ? "animate-pulse" : ""}`} />
    </button>
  );
}
