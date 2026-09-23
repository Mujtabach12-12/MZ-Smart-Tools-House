const ENV = import.meta.env || {};
const PUBLIC_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
const SITE_ORIGIN = "https://mztoolshouse.com";
const DEFAULT_GATEWAY = typeof window !== "undefined" && ENV.PROD && ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? `${SITE_ORIGIN}/api/dictionary?word=`
  : "/api/dictionary?word=";
const GATEWAY_BASE = String(ENV.VITE_DICTIONARY_API_URL || DEFAULT_GATEWAY).replace(/\/$/, "");
const SUGGEST_BASE = "https://api.datamuse.com/sug";
const DATAMUSE_WORD_BASE = "https://api.datamuse.com/words";
const REQUEST_TIMEOUT_MS = 3500;

function normalizeEntry(entry) {
  const phonetics = Array.isArray(entry?.phonetics) ? entry.phonetics : [];
  const meanings = Array.isArray(entry?.meanings) ? entry.meanings : [];
  const definitions = meanings.flatMap((meaning) => (meaning.definitions || []).map((item) => ({
    partOfSpeech: meaning.partOfSpeech || "",
    definition: String(item.definition || ""),
    example: String(item.example || ""),
    synonyms: [...new Set([...(meaning.synonyms || []), ...(item.synonyms || [])].filter(Boolean))],
    antonyms: [...new Set([...(meaning.antonyms || []), ...(item.antonyms || [])].filter(Boolean))],
  }))).filter((item) => item.definition);
  return {
    word: String(entry?.word || ""),
    phonetic: String(entry?.phonetic || phonetics.find((item) => item.text)?.text || ""),
    audio: String(phonetics.find((item) => item.audio)?.audio || ""),
    definitions,
    sourceUrls: Array.isArray(entry?.sourceUrls) ? entry.sourceUrls.filter(Boolean) : [],
  };
}

function endpoint(base, query) {
  return base.includes("?word=") ? `${base}${encodeURIComponent(query)}` : `${base}/${encodeURIComponent(query)}`;
}

function createLinkedController(parentSignal, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  let timeoutId = 0;
  const abortFromParent = () => controller.abort(parentSignal?.reason);
  if (parentSignal) {
    if (parentSignal.aborted) controller.abort(parentSignal.reason);
    else parentSignal.addEventListener("abort", abortFromParent, { once: true });
  }
  timeoutId = globalThis.setTimeout(() => controller.abort(new DOMException("Dictionary source timed out", "TimeoutError")), timeoutMs);
  return {
    signal: controller.signal,
    cleanup() {
      globalThis.clearTimeout(timeoutId);
      parentSignal?.removeEventListener?.("abort", abortFromParent);
    },
  };
}

async function fetchEntries(base, query, signal) {
  const linked = createLinkedController(signal);
  try {
    const response = await fetch(endpoint(base, query), {
      headers: { accept: "application/json" },
      cache: "default",
      signal: linked.signal,
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Dictionary source returned HTTP ${response.status}.`);
    const payload = await response.json();
    if (!Array.isArray(payload)) throw new Error("Unexpected dictionary response.");
    return payload.map(normalizeEntry).filter((entry) => entry.word && entry.definitions.length);
  } finally {
    linked.cleanup();
  }
}

function datamusePartOfSpeech(tag) {
  return ({ n: "noun", v: "verb", adj: "adjective", adv: "adverb" })[tag] || tag || "";
}

async function fetchDatamuseEntry(query, signal) {
  const linked = createLinkedController(signal);
  try {
    const response = await fetch(`${DATAMUSE_WORD_BASE}?sp=${encodeURIComponent(query)}&md=dr&max=3`, {
      headers: { accept: "application/json" },
      cache: "default",
      signal: linked.signal,
    });
    if (!response.ok) throw new Error(`Fallback dictionary returned HTTP ${response.status}.`);
    const payload = await response.json();
    if (!Array.isArray(payload)) return [];
    const exact = payload.find((item) => String(item?.word || "").toLowerCase() === query.toLowerCase()) || payload[0];
    const rawDefinitions = Array.isArray(exact?.defs) ? exact.defs : [];
    const definitions = rawDefinitions.map((raw) => {
      const [tag, ...parts] = String(raw || "").split("\t");
      return {
        partOfSpeech: datamusePartOfSpeech(tag),
        definition: parts.join(" ").trim(),
        example: "",
        synonyms: [],
        antonyms: [],
      };
    }).filter((item) => item.definition);
    if (!definitions.length) return [];
    const pronunciation = (Array.isArray(exact?.tags) ? exact.tags : []).find((tag) => String(tag).startsWith("pron:"));
    return [{
      word: String(exact?.word || query),
      phonetic: pronunciation ? String(pronunciation).slice(5) : "",
      audio: "",
      definitions,
      sourceUrls: [],
    }];
  } finally {
    linked.cleanup();
  }
}

function dictionarySources() {
  // Direct provider is intentionally first: it avoids a serverless cold start.
  // The same-origin MZ gateway remains a real fallback for browsers/networks
  // where the public cross-origin request is blocked or unreliable.
  const sources = [PUBLIC_BASE];
  if (ENV.PROD && GATEWAY_BASE && GATEWAY_BASE !== PUBLIC_BASE) sources.push(GATEWAY_BASE);
  return sources;
}

export async function lookupWord(word, { signal } = {}) {
  const query = String(word || "").trim();
  if (!query) throw new Error("Enter a word to look up.");
  if (!/^[a-zA-Z][a-zA-Z\s'-]{0,79}$/.test(query)) {
    throw new Error("Enter an English word using letters, spaces, apostrophes or hyphens.");
  }

  let lastError = null;
  let sawValidEmpty = false;

  // Rich dictionary provider first. If it is slow/unreachable, use Datamuse
  // definitions before trying the MZ serverless proxy. Each source has its own
  // short timeout, so one stuck network request cannot consume the whole lookup.
  try {
    const direct = await fetchEntries(PUBLIC_BASE, query, signal);
    if (direct.length) return direct;
    sawValidEmpty = true;
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Dictionary request cancelled", "AbortError");
    lastError = error;
  }

  try {
    const fallback = await fetchDatamuseEntry(query, signal);
    if (fallback.length) return fallback;
    sawValidEmpty = true;
  } catch (error) {
    if (signal?.aborted) throw new DOMException("Dictionary request cancelled", "AbortError");
    lastError = error;
  }

  for (const base of dictionarySources().filter((base) => base !== PUBLIC_BASE)) {
    try {
      const entries = await fetchEntries(base, query, signal);
      if (entries.length) return entries;
      sawValidEmpty = true;
    } catch (error) {
      if (signal?.aborted) throw new DOMException("Dictionary request cancelled", "AbortError");
      lastError = error;
    }
  }

  if (sawValidEmpty) return [];
  throw new Error(lastError?.name === "TimeoutError"
    ? "Dictionary sources are responding slowly. Please try again."
    : "The dictionary service is temporarily unavailable. Please try again.");
}

export async function suggestWords(query, { signal } = {}) {
  const q = String(query || "").trim();
  if (q.length < 2) return [];
  const linked = createLinkedController(signal, 2500);
  try {
    const response = await fetch(`${SUGGEST_BASE}?max=6&s=${encodeURIComponent(q)}`, {
      signal: linked.signal,
      headers: { accept: "application/json" },
      cache: "default",
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data.map((item) => String(item.word || "")).filter(Boolean).slice(0, 6) : [];
  } catch {
    return [];
  } finally {
    linked.cleanup();
  }
}

export function getDictionarySource() {
  return {
    baseUrl: ENV.PROD ? `${PUBLIC_BASE} + MZ fallback` : PUBLIC_BASE,
    provider: "Free Dictionary API with Datamuse + MZ fallback",
  };
}
