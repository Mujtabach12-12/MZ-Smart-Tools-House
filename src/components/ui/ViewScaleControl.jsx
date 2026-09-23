import { Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

// v2 intentionally ignores the older header-based preference so existing
// installs return to a clean 100% layout after the visible header control was
// removed. Users can still opt into a different scale from Settings.
const KEY = "mz-ui-scale-settings-v2";
const MIN = 85;
const MAX = 125;
const STEP = 5;

function clamp(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 100;
  return Math.min(MAX, Math.max(MIN, Math.round(number / STEP) * STEP));
}

function applyScale(percent) {
  if (typeof document === "undefined") return;
  const safe = clamp(percent);
  document.documentElement.style.setProperty("--mz-ui-scale", String(safe / 100));
  document.documentElement.dataset.mzUiScale = String(safe);
  try { localStorage.setItem(KEY, String(safe)); } catch {}
}

export default function ViewScaleControl({ compact = false, className = "" }) {
  const [scale, setScale] = useState(() => {
    try { return clamp(localStorage.getItem(KEY) || 100); } catch { return 100; }
  });

  useEffect(() => { applyScale(scale); }, [scale]);

  return (
    <div className={`mz-view-scale ${compact ? "is-compact" : ""} ${className}`} role="group" aria-label="MZ page zoom">
      <button type="button" onClick={() => setScale((v) => clamp(v - STEP))} disabled={scale <= MIN} aria-label="Zoom out MZ interface" title="Zoom out"><Minus /></button>
      <button type="button" className="mz-view-scale-value" onClick={() => setScale(100)} title="Reset to 100%" aria-label={`Reset interface zoom, currently ${scale}%`}>{scale}%</button>
      <button type="button" onClick={() => setScale((v) => clamp(v + STEP))} disabled={scale >= MAX} aria-label="Zoom in MZ interface" title="Zoom in"><Plus /></button>
      {!compact && scale !== 100 ? <button type="button" onClick={() => setScale(100)} aria-label="Reset interface zoom to 100%" title="Reset to 100%"><RotateCcw /></button> : null}
    </div>
  );
}
