import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MessageSquare, ArrowLeft, Send, Users, Anchor as AnchorIcon, Lock } from "lucide-react";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";

const EASE = [0.22, 1, 0.36, 1];

export default function PeerDen({ code, myName = "" }) {
  const { c } = useLang();
  const s = c.suivi;
  const p = s.peer;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [threads, setThreads] = useState(null);
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const search = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const { data } = await api.get("/peers/search", { params: { q: query, code } });
      setResults(data);
    } catch (err) {
      setError(err?.response?.data?.detail || p.error);
      setResults(null);
    } finally {
      setBusy(false);
    }
  };

  const loadThreads = async () => {
    try {
      const { data } = await api.get("/peers/threads", { params: { code } });
      setThreads(data);
    } catch (err) {}
  };

  const openThread = async (r) => {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const { data } = await api.get("/peers/thread", { params: { code, peer: r.app_id } });
      setActive({ app_id: r.app_id, pseudo: data.peer.pseudo });
      setMsgs(data.messages);
      loadThreads();
    } catch (err) {
      setError(err?.response?.data?.detail || p.error);
    } finally {
      setBusy(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (busy || !text.trim() || !active) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/peers/messages", {
        from_code: code,
        to_app_id: active.app_id,
        text,
      });
      setMsgs((m) => [...m, data]);
      setText("");
    } catch (err) {
      setError(err?.response?.data?.detail || p.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      data-testid="peer-panel"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="mt-8 border border-gold/20 bg-deck/60 p-5 sm:p-6"
    >
      <p className="flex items-center gap-2 font-mono2 text-[10px] tracking-[0.3em] text-gold mb-2">
        <Users className="w-4 h-4" /> {p.title}
      </p>
      <p className="font-fell italic text-base text-bone/80 mb-4">{p.sub}</p>

      {error && (
        <p data-testid="peer-error" className="mb-4 border border-bloodglow/45 bg-bloodglow/10 px-4 py-3 font-mono2 text-[10px] tracking-[0.12em] text-bloodglow flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" /> <span>{error}</span>
        </p>
      )}

      {!active && (
        <form onSubmit={search} className="flex flex-col sm:flex-row gap-3 mb-2">
          <input
            data-testid="peer-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={p.searchPh}
            autoComplete="off"
            className="flex-1 bg-ink/70 border border-gold/25 px-4 py-3 font-fell text-base text-bone placeholder:text-bone/40 focus:border-gold transition-all"
          />
          <button
            type="submit"
            data-testid="peer-search-btn"
            disabled={busy}
            className="font-display text-lg tracking-wider uppercase px-6 py-3 bg-gold text-ink hover:bg-goldlight disabled:opacity-60 transition-all duration-300"
          >
            {busy ? "…" : p.searchBtn}
          </button>
        </form>
      )}

      {results !== null && results.length === 0 && !active && (
        <p data-testid="peer-empty" className="font-fell italic text-base text-bone/70 mb-4">{p.resultsEmpty}</p>
      )}

      {results && results.length > 0 && !active && (
        <div className="mb-6">
          <p className="font-mono2 text-[9px] tracking-[0.25em] text-mist mb-2">{p.resultsTitle}</p>
          <ul className="space-y-2">
            {results.map((r) => (
              <li
                key={r.app_id}
                data-testid={`peer-row-${r.app_id}`}
                className="flex flex-wrap items-center justify-between gap-3 border border-gold/15 bg-ink/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg text-bone truncate">{r.pseudo}</p>
                  <p className="font-mono2 text-[9px] tracking-[0.2em] text-mist">
                    {r.power} · {r.troops} · {c.status[r.status]?.label || r.status}
                  </p>
                </div>
                <button
                  type="button"
                  data-testid={`peer-open-${r.app_id}`}
                  onClick={() => openThread(r)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 font-mono2 text-[10px] tracking-[0.25em] text-gold border border-gold/40 px-4 py-2 hover:bg-gold hover:text-ink transition-all duration-300"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> {p.openBtn}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {active && (
        <div>
          <button
            type="button"
            data-testid="peer-back-btn"
            onClick={() => { setActive(null); setMsgs([]); loadThreads(); }}
            className="inline-flex items-center gap-2 font-mono2 text-[10px] tracking-[0.25em] text-mist hover:text-gold transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {p.back}
          </button>
          <p className="font-display text-xl text-gold mb-4 flex items-center gap-2">
            <AnchorIcon className="w-4 h-4" /> {active.pseudo}
          </p>
          <div data-testid="peer-msg-list" className="space-y-2 mb-4 max-h-80 overflow-y-auto pr-1">
            {msgs.map((m) => (
              <div
                key={m.id}
                data-testid={`peer-msg-${m.id}`}
                className={`relative max-w-[85%] px-4 py-2.5 font-fell text-base break-words ${
                  m.from_me
                    ? "ml-auto bg-gold/15 border border-gold/35 text-bone"
                    : "bg-ink/70 border border-gold/15 text-bone/90"
                }`}
              >
                <div
                  aria-hidden
                  data-testid={`peer-seal-${m.from_me ? "mine" : "them"}`}
                  className={`absolute -top-2.5 w-8 h-8 rounded-full bg-[#101826] border-2 border-[#2b3b57] shadow-[0_2px_8px_rgba(0,0,0,0.65)] flex items-center justify-center ${
                    m.from_me ? "-right-2.5 rotate-6" : "-left-2.5 -rotate-6"
                  }`}
                >
                  <span className="font-display text-[10px] text-goldlight">
                    {(m.from_me ? myName : active.pseudo).trim().charAt(0).toUpperCase()}
                  </span>
                </div>
                {m.text}
              </div>
            ))}
          </div>
          <form onSubmit={send} className="flex gap-3">
            <input
              data-testid="peer-msg-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={p.msgPh}
              maxLength={1000}
              autoComplete="off"
              className="flex-1 bg-ink/70 border border-gold/25 px-4 py-3 font-fell text-base text-bone placeholder:text-bone/40 focus:border-gold transition-all"
            />
            <button
              type="submit"
              data-testid="peer-msg-send"
              disabled={busy || !text.trim()}
              className="inline-flex items-center gap-2 font-mono2 text-[10px] tracking-[0.25em] bg-gold text-ink px-5 hover:bg-goldlight disabled:opacity-50 transition-all duration-300"
            >
              <Send className="w-4 h-4" /> {p.sendBtn}
            </button>
          </form>
        </div>
      )}

      {!active && threads !== null && (
        <div>
          <p className="font-mono2 text-[9px] tracking-[0.25em] text-mist mb-2">{p.threadsTitle}</p>
          {threads.length === 0 ? (
            <p className="font-fell italic text-base text-bone/60">{p.threadsEmpty}</p>
          ) : (
            <ul className="space-y-2">
              {threads.map((t) => (
                <li key={t.app_id}>
                  <button
                    type="button"
                    data-testid={`peer-thread-item-${t.app_id}`}
                    onClick={() => openThread(t)}
                    className="w-full text-left flex items-center justify-between gap-3 border border-gold/15 bg-ink/50 px-4 py-3 hover:border-gold/40 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-lg text-bone truncate">
                        {t.pseudo} {t.unread > 0 && <span className="ml-1 inline-block w-2 h-2 rounded-full bg-bloodglow align-middle" />}
                      </p>
                      <p className="font-fell text-sm text-bone/60 truncate">{t.last}</p>
                    </div>
                    <MessageSquare className="w-4 h-4 text-gold shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!active && (
        <p className="mt-4 font-mono2 text-[8px] tracking-[0.2em] text-mist/70 flex items-center gap-2">
          <Lock className="w-3 h-3 shrink-0" /> {p.hint}
        </p>
      )}
    </motion.div>
  );
}
