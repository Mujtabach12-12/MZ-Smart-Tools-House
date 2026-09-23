import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpenCheck, Heart, History, Search, Volume2, X } from "lucide-react";
import { getDictionarySource, lookupWord, suggestWords } from "../../services/dictionary";

const HISTORY_KEY = "mz-dictionary-history-v1";
const FAVORITES_KEY = "mz-dictionary-favorites-v1";

function readList(key) {
  try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}
function writeList(key, list) { try { localStorage.setItem(key, JSON.stringify(list)); } catch {} }

export default function MzDictionary() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [history, setHistory] = useState(() => readList(HISTORY_KEY));
  const [favorites, setFavorites] = useState(() => readList(FAVORITES_KEY));
  const [suggestions, setSuggestions] = useState([]);
  const controllerRef = useRef(null);
  const suggestionRef = useRef(null);
  const source = getDictionarySource();

  useEffect(() => () => { controllerRef.current?.abort(); suggestionRef.current?.abort(); }, []);
  useEffect(() => {
    suggestionRef.current?.abort();
    const text = query.trim();
    if (text.length < 2 || status === "loading") { setSuggestions([]); return undefined; }
    const controller = new AbortController(); suggestionRef.current = controller;
    const timer = setTimeout(() => suggestWords(text, { signal:controller.signal }).then((items) => setSuggestions(items.filter((item) => item.toLowerCase() !== text.toLowerCase()))), 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, status]);

  const currentWord = entries[0]?.word || query.trim();
  const isFavorite = favorites.some((word) => word.toLowerCase() === currentWord.toLowerCase());
  const related = useMemo(() => {
    const words = entries.flatMap((entry) => entry.definitions.flatMap((item) => [...item.synonyms, ...item.antonyms]));
    return [...new Set(words.map((word) => String(word).trim()).filter(Boolean))].slice(0, 18);
  }, [entries]);

  async function search(word = query) {
    const next = String(word || "").trim();
    if (!next) { setError("Enter a word to look up."); return; }
    controllerRef.current?.abort();
    const controller = new AbortController(); controllerRef.current = controller;
    let timedOut = false;
    const timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, 11500);
    setStatus("loading"); setError(""); setEntries([]); setQuery(next);
    try {
      const result = await lookupWord(next, { signal: controller.signal });
      if (!result.length) {
        setStatus("empty");
        setError(`No dictionary entry was found for “${next}”. Try another spelling or a related word.`);
        return;
      }
      setEntries(result); setStatus("success");
      const updated = [result[0].word, ...history.filter((item) => item.toLowerCase() !== result[0].word.toLowerCase())].slice(0, 12);
      setHistory(updated); writeList(HISTORY_KEY, updated);
    } catch (err) {
      if (err?.name === "AbortError" && !timedOut) return;
      setStatus("error");
      setError(timedOut ? "The dictionary sources did not respond in time. Please try again; MZ will automatically use its fallback source." : (err?.message || "The dictionary lookup failed. Please try again."));
    } finally {
      clearTimeout(timeoutId);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  function toggleFavorite() {
    const word = currentWord.trim(); if (!word || !entries.length) return;
    const exists = favorites.some((item) => item.toLowerCase() === word.toLowerCase());
    const next = exists ? favorites.filter((item) => item.toLowerCase() !== word.toLowerCase()) : [word, ...favorites].slice(0, 30);
    setFavorites(next); writeList(FAVORITES_KEY, next);
  }

  function playAudio(url) {
    if (!url) return;
    const audio = new Audio(url); audio.play().catch(() => setError("Pronunciation audio could not be played in this browser."));
  }

  return <div className="space-y-5">
    <section className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-5 shadow-sm dark:border-teal-950 dark:from-teal-950/30 dark:via-navy-900 dark:to-cyan-950/20 sm:p-7">
      <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white"><BookOpenCheck className="h-5 w-5" /></span><div><h2 className="text-lg font-extrabold">Search the English dictionary</h2><p className="mt-1 text-sm leading-6 text-navy-500 dark:text-navy-400">Definitions are fetched from {source.provider}; MZ does not invent missing meanings.</p></div></div>
      <form className="mt-5 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); search(); }}>
        <label className="sr-only" htmlFor="dictionary-query">Word</label>
        <input id="dictionary-query" className="mz-input flex-1 text-base" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a word, e.g. resilient" autoComplete="off" />
        <button className="mz-btn-primary min-h-11" disabled={status === "loading"}><Search className="h-4 w-4" />{status === "loading" ? "Searching…" : "Search"}</button>
      </form>
      {suggestions.length ? <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-navy-400">Suggestions:</span>{suggestions.map((word) => <button key={word} type="button" className="mz-badge-muted" onClick={() => search(word)}>{word}</button>)}</div> : null}
      {(history.length || favorites.length) ? <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-400"><History className="h-3.5 w-3.5" /> Recent</div><div className="flex flex-wrap gap-2">{history.slice(0,8).map((word) => <button key={word} className="mz-badge-muted" onClick={() => search(word)}>{word}</button>)}</div></div>
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-400"><Heart className="h-3.5 w-3.5" /> Favorites</div><div className="flex flex-wrap gap-2">{favorites.slice(0,8).map((word) => <button key={word} className="mz-badge-muted" onClick={() => search(word)}>{word}</button>)}</div></div>
      </div> : null}
    </section>

    {error ? <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"><X className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div> : null}

    {entries.map((entry, entryIndex) => <section key={`${entry.word}-${entryIndex}`} className="mz-card p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-3xl font-black tracking-tight">{entry.word}</h2>{entry.phonetic ? <p className="mt-1 font-mono text-sm text-teal-700 dark:text-teal-300">{entry.phonetic}</p> : null}</div><div className="flex gap-2">{entry.audio ? <button className="mz-btn-secondary" onClick={() => playAudio(entry.audio)}><Volume2 className="h-4 w-4" /> Pronounce</button> : null}<button className="mz-btn-secondary" aria-pressed={isFavorite} onClick={toggleFavorite}><Heart className={`h-4 w-4 ${isFavorite ? "fill-current text-rose-500" : ""}`} /> {isFavorite ? "Saved" : "Favorite"}</button></div></div>
      <div className="mt-6 space-y-5">{entry.definitions.map((item, index) => <article key={`${item.definition}-${index}`} className="border-t border-navy-100 pt-5 first:border-0 first:pt-0 dark:border-navy-800"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">{item.partOfSpeech || "definition"}</span><span className="text-xs font-semibold text-navy-400">Definition {index + 1}</span></div><p className="mt-2 text-base leading-7 text-navy-800 dark:text-navy-100">{item.definition}</p>{item.example ? <blockquote className="mt-2 border-l-2 border-teal-300 pl-3 text-sm italic leading-6 text-navy-500 dark:border-teal-700 dark:text-navy-400">“{item.example}”</blockquote> : null}{item.synonyms.length ? <p className="mt-3 text-sm"><strong>Synonyms:</strong> {item.synonyms.slice(0,12).join(", ")}</p> : null}{item.antonyms.length ? <p className="mt-2 text-sm"><strong>Antonyms:</strong> {item.antonyms.slice(0,12).join(", ")}</p> : null}</article>)}</div>
      {entry.sourceUrls.length ? <p className="mt-6 text-xs text-navy-400">Source: <a className="text-teal-700 underline dark:text-teal-300" href={entry.sourceUrls[0]} target="_blank" rel="noreferrer">dictionary source</a></p> : null}
    </section>)}

    {related.length ? <section className="mz-card p-5"><h3 className="font-bold">Related words</h3><div className="mt-3 flex flex-wrap gap-2">{related.map((word) => <button key={word} className="mz-badge-muted" onClick={() => search(word)}>{word}</button>)}</div></section> : null}
  </div>;
}
