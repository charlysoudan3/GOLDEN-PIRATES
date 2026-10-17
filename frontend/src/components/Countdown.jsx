import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

// Date d'ouverture de la saison — SOURCE UNIQUE, ajustable ici uniquement.
export const OPENING_AT = new Date("2026-10-31T23:59:59Z");

function useRemaining() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, OPENING_AT.getTime() - now);
  return {
    ms,
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  };
}

export default function Countdown({ variant = "hero", testid = "countdown" }) {
  const { c } = useLang();
  const k = c.countdown;
  const { ms, d, h, m, s } = useRemaining();

  if (ms <= 0) {
    return (
      <p data-testid={testid} className="font-mono2 text-[10px] tracking-[0.3em] text-gold uppercase">
        {k.open}
      </p>
    );
  }

  if (variant === "line") {
    return (
      <p
        data-testid={testid}
        className="inline-block border border-gold/30 bg-ink/50 px-4 py-2 font-mono2 text-[10px] sm:text-[11px] tracking-[0.3em] text-gold"
      >
        {k.lineLabel} J-{d} · {String(h).padStart(2, "0")}H{String(m).padStart(2, "0")}
      </p>
    );
  }

  const cells = [
    [d, k.days],
    [h, k.hours],
    [m, k.minutes],
    [s, k.seconds],
  ];
  return (
    <div data-testid={testid} className="inline-block">
      <p className="font-mono2 text-[9px] sm:text-[10px] tracking-[0.3em] text-gold mb-2">{k.label}</p>
      <div className="inline-flex items-stretch border border-gold/35 bg-ink/60 backdrop-blur divide-x divide-gold/20">
        {cells.map(([v, label]) => (
          <div key={label} className="px-4 sm:px-6 py-3 text-center min-w-[62px] sm:min-w-[76px]">
            <p className="font-display text-2xl sm:text-3xl text-gold tabular-nums">{String(v).padStart(2, "0")}</p>
            <p className="font-mono2 text-[8px] sm:text-[9px] tracking-[0.3em] text-mist">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
