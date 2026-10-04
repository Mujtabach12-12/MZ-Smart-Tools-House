import { Check, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, themes, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", escape); };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-label="Choose website theme" title="Choose theme" className="mz-theme-trigger">
        <Palette className="h-4 w-4" /><span className="hidden 2xl:inline">Themes</span>
      </button>
      {open ? <div className="mz-theme-menu" role="menu" aria-label="Website themes">
        <div className="mz-theme-menu-head"><strong>Choose a theme</strong><span>12 styles · saved automatically</span></div>
        <div className="mz-theme-grid">
          {themes.map((item) => <button key={item.id} type="button" role="menuitemradio" aria-checked={theme === item.id} onClick={() => { setTheme(item.id); setOpen(false); }} className={`mz-theme-choice ${theme === item.id ? "is-active" : ""}`}>
            <span className="mz-theme-swatch" aria-hidden="true" style={{ background: `linear-gradient(135deg, ${item.swatch[0]} 0 48%, ${item.swatch[1]} 48% 100%)` }} />
            <span>{item.name}</span>{theme === item.id ? <Check className="h-3.5 w-3.5" /> : null}
          </button>)}
        </div>
      </div> : null}
    </div>
  );
}
