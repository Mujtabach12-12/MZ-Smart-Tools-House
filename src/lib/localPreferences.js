const RECENT_KEY = "mz-recent-tools";
const FAVORITES_KEY = "mz-favorite-tools";
const SEARCH_KEY = "mz-recent-searches";
const MAX_RECENT = 8;
const MAX_SEARCHES = 6;

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
export function getRecentTools() { return read(RECENT_KEY); }
export function addRecentTool(id) {
  const next = [id, ...read(RECENT_KEY).filter(x => x !== id)].slice(0, MAX_RECENT);
  write(RECENT_KEY, next); return next;
}
export function clearRecentTools() { write(RECENT_KEY, []); }
export function getFavoriteTools() { return read(FAVORITES_KEY); }
export function toggleFavoriteTool(id) {
  const current = read(FAVORITES_KEY);
  const next = current.includes(id) ? current.filter(x => x !== id) : [id, ...current];
  write(FAVORITES_KEY, next); return next;
}
export function clearFavoriteTools() { write(FAVORITES_KEY, []); }
export function getRecentSearches() { return read(SEARCH_KEY); }
export function addRecentSearch(query) {
  const q = query.trim(); if (!q) return read(SEARCH_KEY);
  const next = [q, ...read(SEARCH_KEY).filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_SEARCHES);
  write(SEARCH_KEY, next); return next;
}
export function clearRecentSearches() { write(SEARCH_KEY, []); }
