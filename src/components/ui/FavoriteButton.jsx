import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getFavoriteTools, toggleFavoriteTool } from "../../lib/localPreferences";

export default function FavoriteButton({ toolId, className = "" }) {
  const [favorite, setFavorite] = useState(() => getFavoriteTools().includes(toolId));
  useEffect(() => {
    const sync = () => setFavorite(getFavoriteTools().includes(toolId));
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [toolId]);
  function toggle(e) {
    e.preventDefault(); e.stopPropagation();
    const next = toggleFavoriteTool(toolId);
    setFavorite(next.includes(toolId));
    window.dispatchEvent(new Event("mz-preferences-change"));
  }
  return <button type="button" onClick={toggle} aria-label={favorite ? "Remove from favorites" : "Add to favorites"} aria-pressed={favorite}
    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-navy-100 bg-white/80 text-navy-400 transition hover:border-brand-300 hover:text-brand-600 dark:border-navy-700 dark:bg-navy-900/70 dark:text-navy-400 dark:hover:text-brand-300 ${className}`}>
    <Star className={`h-4 w-4 ${favorite ? "fill-current text-brand-500" : ""}`} />
  </button>;
}
