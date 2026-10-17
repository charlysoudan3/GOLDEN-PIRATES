import { useLang } from "@/lib/i18n";

export default function LangSwitcher({ className = "" }) {
  const { lang, setLang } = useLang();
  return (
    <div
      data-testid="lang-switcher"
      className={`inline-flex items-center border border-gold/35 bg-ink/60 backdrop-blur ${className}`}
      role="group"
      aria-label="Language"
    >
      {["fr", "en"].map((l) => (
        <button
          key={l}
          type="button"
          data-testid={`lang-switch-${l}`}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1.5 font-mono2 text-[10px] tracking-[0.2em] transition-all duration-300 ${
            lang === l ? "bg-gold text-ink" : "text-bone/60 hover:text-gold"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
