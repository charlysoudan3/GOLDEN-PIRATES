export const STATUS_META = {
  pending: {
    label: "EN EXAMEN",
    long: "En cours d'examen par le Conseil des Capitaines",
    cls: "border-gold/60 text-gold bg-gold/10",
    dot: "bg-gold",
  },
  accepted: {
    label: "ACCEPTÉ À BORD",
    long: "Accepté — convocation Discord imminente, prépare tes affaires",
    cls: "border-emerald-500/60 text-emerald-400 bg-emerald-500/10",
    dot: "bg-emerald-400",
  },
  rejected: {
    label: "REFUSÉ",
    long: "Refusé — bon vent, marin. Le porte-hélice te souhaite une meilleure traversée",
    cls: "border-blood/70 text-bloodglow bg-blood/10",
    dot: "bg-bloodglow",
  },
};

export default function StatusBadge({ status, testid = "status-badge", size = "sm" }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      data-testid={testid}
      className={`inline-flex items-center gap-2 border font-mono2 tracking-[0.25em] ${meta.cls} ${
        size === "lg" ? "px-5 py-2 text-xs" : "px-2.5 py-1 text-[9px]"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
