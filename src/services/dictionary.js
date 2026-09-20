const ENV = import.meta.env || {};
const PUBLIC_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
const PRIMARY_BASE = String(ENV.VITE_DICTIONARY_API_URL || (ENV.PROD ? "/api/dictionary?word=" : PUBLIC_BASE)).replace(/\/$/, "");
const SUGGEST_BASE = "https://api.datamuse.com/sug";

function normalizeEntry(entry) {
  const phonetics = Array.isArray(entry?.phonetics) ? entry.phonetics : [];
  const meanings = Array.isArray(entry?.meanings) ? entry.meanings : [];
  const definitions = meanings.flatMap((meaning) => (meaning.definitions || []).map((item) => ({
    partOfSpeech: meaning.partOfSpeech || "", definition:String(item.definition || ""), example:String(item.example || ""),
    synonyms:[...new Set([...(meaning.synonyms || []), ...(item.synonyms || [])].filter(Boolean))], antonyms:[...new Set([...(meaning.antonyms || []), ...(item.antonyms || [])].filter(Boolean))],
  }))).filter((item) => item.definition);
  return { word:String(entry?.word || ""), phonetic:String(entry?.phonetic || phonetics.find((item)=>item.text)?.text || ""), audio:String(phonetics.find((item)=>item.audio)?.audio || ""), definitions, sourceUrls:Array.isArray(entry?.sourceUrls)?entry.sourceUrls.filter(Boolean):[] };
}
function endpoint(base,query){return base.includes("?word=")?`${base}${encodeURIComponent(query)}`:`${base}/${encodeURIComponent(query)}`;}
async function fetchEntries(base,query,signal){const response=await fetch(endpoint(base,query),{headers:{accept:"application/json"},signal});if(response.status===404)return [];if(!response.ok)throw new Error(`HTTP ${response.status}`);const payload=await response.json();if(!Array.isArray(payload))throw new Error("Unexpected dictionary response.");return payload.map(normalizeEntry).filter((entry)=>entry.word&&entry.definitions.length);}
export async function lookupWord(word,{signal}={}){const query=String(word||"").trim();if(!query)throw new Error("Enter a word to look up.");if(!/^[a-zA-Z][a-zA-Z\s'-]{0,79}$/.test(query))throw new Error("Enter an English word using letters, spaces, apostrophes or hyphens.");try{return await fetchEntries(PRIMARY_BASE,query,signal)}catch(primaryError){if(PRIMARY_BASE!==PUBLIC_BASE){try{return await fetchEntries(PUBLIC_BASE,query,signal)}catch{}}throw new Error("The dictionary service is temporarily unavailable. Check your connection and try again.")}}
export async function suggestWords(query,{signal}={}){const q=String(query||"").trim();if(q.length<2)return [];try{const response=await fetch(`${SUGGEST_BASE}?max=6&s=${encodeURIComponent(q)}`,{signal,headers:{accept:"application/json"}});if(!response.ok)return [];const data=await response.json();return Array.isArray(data)?data.map((item)=>String(item.word||"")).filter(Boolean).slice(0,6):[]}catch{return []}}
export function getDictionarySource(){return {baseUrl:PRIMARY_BASE,provider:PRIMARY_BASE.startsWith("/api/")?"MZ dictionary gateway (Free Dictionary API)":PRIMARY_BASE.includes("dictionaryapi.dev")?"Free Dictionary API":"Configured dictionary API"};}
