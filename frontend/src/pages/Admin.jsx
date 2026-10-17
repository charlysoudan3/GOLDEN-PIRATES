import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ChevronDown, LogOut, Search, Shield, Trash2 } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import api, { formatApiError } from "@/lib/api";

const EASE = [0.16, 1, 0.3, 1];

const FILTERS = [
  { key: "all", label: "TOUTES" },
  { key: "pending", label: "EN EXAMEN" },
  { key: "accepted", label: "ACCEPTÉES" },
  { key: "rejected", label: "REFUSÉES" },
];

const frDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

function LoginScreen({ onAuthed }) {
  const [email, setEmail] = useState("admin@goldenpirates.io");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post("/admin/login", { email, password });
      toast.success(`Bien le bonjour, Capitaine — ${data.email}`);
      onAuthed();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-5 py-24">
      <motion.form
        data-testid="admin-login-form"
        onSubmit={submit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="w-full max-w-md border border-gold/25 bg-parch/80 frame-plate p-8 sm:p-10"
      >
        <div className="text-center mb-8">
          <Shield className="w-10 h-10 text-gold mx-auto mb-4" strokeWidth={1.4} />
          <h1 className="font-display text-3xl sm:text-4xl text-gold mb-2">ESPACE CONSEIL</h1>
          <p className="font-fell italic text-base text-bone/70">
            Accès réservé aux Capitaines de la flotte.
          </p>
        </div>
        <label className="block font-mono2 text-[10px] tracking-[0.3em] text-gold mb-2" htmlFor="admin-email">
          COURRIER DU CAPITAINE
        </label>
        <input
          id="admin-email"
          data-testid="admin-login-input-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-ink/70 border border-gold/25 px-4 py-3 font-fell text-base text-bone focus:border-gold transition-all mb-5"
        />
        <label className="block font-mono2 text-[10px] tracking-[0.3em] text-gold mb-2" htmlFor="admin-password">
          SECRET DU COFFRE
        </label>
        <input
          id="admin-password"
          data-testid="admin-login-input-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          className="w-full bg-ink/70 border border-gold/25 px-4 py-3 font-fell text-base text-bone focus:border-gold transition-all mb-7"
        />
        <button
          type="submit"
          data-testid="admin-login-btn"
          disabled={busy}
          className="w-full font-display text-2xl tracking-wider py-3.5 bg-gold text-ink hover:bg-goldlight hover:shadow-[0_0_35px_rgba(212,175,55,0.4)] disabled:opacity-60 transition-all duration-300"
        >
          {busy ? "ON SONDE LA FONDE…" : "OUVRIR LE COFFRE"}
        </button>
      </motion.form>
    </div>
  );
}

function AppRow({ app, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(app.note || "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      data-testid={`admin-app-row-${app.id}`}
      className="border border-gold/15 bg-deck/60 hover:border-gold/35 transition-colors"
    >
      <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center px-4 sm:px-6 py-4 cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <div className="col-span-11 sm:col-span-3 flex items-center gap-3 min-w-0">
          <ChevronDown className={`w-4 h-4 text-gold shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
          <div className="min-w-0">
            <p className="font-display text-xl text-bone truncate">{app.pseudo}</p>
            <p className="font-mono2 text-[9px] tracking-[0.2em] text-gold">{app.tracking_code}</p>
          </div>
        </div>
        <div className="hidden sm:block sm:col-span-2">
          <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">PUISSANCE</p>
          <p className="font-fell text-base text-goldlight">{app.power}</p>
        </div>
        <div className="hidden md:block md:col-span-2">
          <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">TROUPES</p>
          <p className="font-fell text-base text-bone/80 truncate">{app.troops}</p>
        </div>
        <div className="hidden lg:block lg:col-span-2">
          <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">DISCORD</p>
          <p className="font-fell text-base text-bone/80 truncate">{app.discord}</p>
        </div>
        <div className="col-span-1 sm:col-span-1 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <StatusBadge status={app.status} />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden border-t border-gold/10"
          >
            <div className="px-4 sm:px-6 py-5 grid md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div>
                  <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1">ACTIVITÉ</p>
                  <p className="font-fell text-base text-bone/85">{app.activity}</p>
                </div>
                <div>
                  <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1">EXPÉRIENCE</p>
                  <p className="font-fell text-base text-bone/85 whitespace-pre-wrap">
                    {app.experience || "— aucune ligne dans le journal de bord —"}
                  </p>
                </div>
                <div>
                  <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist mb-1">MESSAGE</p>
                  <p className="font-fell text-base text-bone/85 whitespace-pre-wrap">{app.message}</p>
                </div>
                <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">
                  DÉPOSÉE LE {frDate(app.created_at).toUpperCase()}
                </p>
              </div>
              <div>
                <label className="block font-mono2 text-[9px] tracking-[0.2em] text-gold mb-2" htmlFor={`note-${app.id}`}>
                  NOTE DU CONSEIL
                </label>
                <textarea
                  id={`note-${app.id}`}
                  data-testid={`admin-note-input-${app.id}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ex : Entretien Discord le vendredi — profil sérieux"
                  className="w-full bg-ink/70 border border-gold/25 px-3 py-2.5 font-fell text-sm text-bone focus:border-gold transition-all min-h-[70px] resize-y mb-4"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    data-testid={`admin-action-approve-${app.id}`}
                    onClick={() => onUpdate(app, "accepted", note)}
                    className="font-mono2 text-[10px] tracking-[0.2em] px-4 py-2.5 border border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  >
                    ACCEPTER À BORD
                  </button>
                  <button
                    data-testid={`admin-action-reject-${app.id}`}
                    onClick={() => onUpdate(app, "rejected", note)}
                    className="font-mono2 text-[10px] tracking-[0.2em] px-4 py-2.5 border border-blood/60 text-bloodglow hover:bg-blood/10 transition-all"
                  >
                    REFUSER
                  </button>
                  <button
                    data-testid={`admin-action-pending-${app.id}`}
                    onClick={() => onUpdate(app, "pending", note)}
                    className="font-mono2 text-[10px] tracking-[0.2em] px-4 py-2.5 border border-gold/40 text-gold hover:bg-gold/10 transition-all"
                  >
                    REMETTRE EN EXAMEN
                  </button>
                  <button
                    data-testid={`admin-action-delete-${app.id}`}
                    onClick={() => onDelete(app)}
                    className="ml-auto inline-flex items-center gap-1.5 font-mono2 text-[10px] tracking-[0.2em] px-3 py-2.5 text-mist hover:text-bloodglow transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> BRÛLER
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(null);
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get("/admin/applications"),
        api.get("/admin/stats"),
      ]);
      setApps(listRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  }, []);

  useEffect(() => {
    api
      .get("/auth/me")
      .then(() => {
        setAuthed(true);
        loadAll();
      })
      .catch(() => setAuthed(false));
  }, [loadAll]);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAuthed(false);
      setApps([]);
      setStats(null);
      toast.success("Le coffre est refermé. Bon vent, Capitaine.");
    }
  };

  const onUpdate = async (app, status, note) => {
    try {
      const { data } = await api.patch(`/admin/applications/${app.id}`, { status, note });
      setApps((list) => list.map((a) => (a.id === app.id ? data : a)));
      await loadAll();
      toast.success(`${data.pseudo} — statut mis à jour.`);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const onDelete = async (app) => {
    if (!window.confirm(`Brûler la candidature de ${app.pseudo} ? Cette besogne est irréversible.`)) return;
    try {
      await api.delete(`/admin/applications/${app.id}`);
      setApps((list) => list.filter((a) => a.id !== app.id));
      await loadAll();
      toast.success(`La candidature de ${app.pseudo} est réduite en cendres.`);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const visible = apps.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        a.pseudo.toLowerCase().includes(q) ||
        a.tracking_code.toLowerCase().includes(q) ||
        a.discord.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-ink min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 pt-28 md:pt-36 pb-24" data-testid="admin-section">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {authed === null && (
            <p className="text-center font-mono2 text-xs tracking-[0.3em] text-mist pt-20">OUVERTURE DU COFFRE…</p>
          )}
          {authed === false && <LoginScreen onAuthed={() => { setAuthed(true); loadAll(); }} />}
          {authed === true && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
                <div>
                  <p className="font-mono2 text-[11px] tracking-[0.35em] text-gold mb-3">CONSEIL DES CAPITAINES</p>
                  <h1 className="font-display text-4xl sm:text-5xl text-bone">LE REGISTRE DES RECRUES</h1>
                </div>
                <button
                  data-testid="admin-logout-btn"
                  onClick={logout}
                  className="inline-flex items-center gap-2 font-mono2 text-[10px] tracking-[0.25em] px-5 py-3 border border-gold/40 text-gold hover:bg-gold/10 transition-all"
                >
                  <LogOut className="w-4 h-4" /> REFERMER LE COFFRE
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10" data-testid="admin-dashboard">
                {[
                  { tid: "admin-stat-total", label: "CANDIDATURES", value: stats?.total ?? 0, cls: "text-bone" },
                  { tid: "admin-stat-pending", label: "EN EXAMEN", value: stats?.pending ?? 0, cls: "text-gold" },
                  { tid: "admin-stat-accepted", label: "ACCEPTÉES", value: stats?.accepted ?? 0, cls: "text-emerald-400" },
                  { tid: "admin-stat-rejected", label: "REFUSÉES", value: stats?.rejected ?? 0, cls: "text-bloodglow" },
                ].map((s) => (
                  <div key={s.tid} data-testid={s.tid} className="border border-gold/15 bg-deck/60 p-5">
                    <p className={`font-display text-4xl sm:text-5xl ${s.cls}`}>{s.value}</p>
                    <p className="font-mono2 text-[9px] tracking-[0.3em] text-mist mt-2">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex flex-wrap gap-2">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      data-testid={`admin-filter-${f.key}`}
                      onClick={() => setFilter(f.key)}
                      className={`font-mono2 text-[10px] tracking-[0.25em] px-4 py-2.5 border transition-all ${
                        filter === f.key
                          ? "border-gold text-gold bg-gold/10"
                          : "border-gold/20 text-mist hover:border-gold/50 hover:text-gold"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="relative sm:ml-auto sm:w-72">
                  <Search className="w-4 h-4 text-mist absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    data-testid="admin-search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pseudo, code ou Discord…"
                    className="w-full bg-ink/70 border border-gold/25 pl-10 pr-4 py-2.5 font-fell text-sm text-bone placeholder:text-mist/50 focus:border-gold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {visible.length === 0 ? (
                  <div data-testid="admin-empty-state" className="border border-dashed border-gold/25 bg-deck/40 p-14 text-center">
                    <p className="font-display text-2xl text-bone/70 mb-2">La mer est calme…</p>
                    <p className="font-fell italic text-base text-mist">
                      Aucune candidature ne correspond. Les recrues ne tarderont pas à frapper au pont.
                    </p>
                  </div>
                ) : (
                  visible.map((app) => (
                    <AppRow key={app.id} app={app} onUpdate={onUpdate} onDelete={onDelete} />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
