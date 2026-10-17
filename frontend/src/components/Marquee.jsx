import { SkullIcon } from "./LogoMark";

const ITEMS = [
  "ROYAUME 1023",
  "GOLDEN PIRATES",
  "PRÉ-KVK",
  "SAISON 2",
  "FRATERNITÉ D'ACIER",
  "LE BUTIN EST À NOUS",
  "RECRUTEMENT — FIN DE SAISON 2",
];

const Row = ({ ariaHidden }) => (
  <div aria-hidden={ariaHidden} className="flex items-center shrink-0">
    {ITEMS.map((item) => (
      <span key={item} className="flex items-center shrink-0">
        <span className="font-display text-2xl sm:text-4xl uppercase tracking-wider text-gold/60 px-6 sm:px-10 whitespace-nowrap">
          {item}
        </span>
        <SkullIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blood/80 shrink-0" />
      </span>
    ))}
  </div>
);

export default function Marquee() {
  return (
    <section data-testid="editorial-marquee" className="relative border-y border-gold/15 bg-deep/60 py-5 sm:py-6 overflow-hidden">
      <div className="flex w-max animate-marquee">
        <Row ariaHidden={false} />
        <Row ariaHidden={true} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-ink to-transparent" />
    </section>
  );
}
