import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "mz-theme";

export const THEMES = [
  { id: "light", name: "Classic Light", dark: false, swatch: ["#2563eb", "#f8fafc"] },
  { id: "dark", name: "Midnight", dark: true, swatch: ["#60a5fa", "#07101f"] },
  { id: "ocean", name: "Ocean Glass", dark: false, swatch: ["#0284c7", "#ecfeff"] },
  { id: "emerald", name: "Emerald", dark: false, swatch: ["#059669", "#f0fdf4"] },
  { id: "violet", name: "Violet", dark: false, swatch: ["#7c3aed", "#faf5ff"] },
  { id: "rose", name: "Rose", dark: false, swatch: ["#e11d48", "#fff1f2"] },
  { id: "amber", name: "Amber", dark: false, swatch: ["#d97706", "#fffbeb"] },
  { id: "slate", name: "Slate Pro", dark: false, swatch: ["#475569", "#f8fafc"] },
  { id: "cyber", name: "Cyber Blue", dark: true, swatch: ["#22d3ee", "#07131f"] },
  { id: "forest", name: "Forest Night", dark: true, swatch: ["#34d399", "#071a15"] },
  { id: "sunset", name: "Sunset", dark: false, swatch: ["#f97316", "#fff7ed"] },
  { id: "mono", name: "Mono Focus", dark: false, swatch: ["#111827", "#f9fafb"] },
];

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (THEMES.some((theme) => theme.id === saved)) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const current = THEMES.find((item) => item.id === theme) || THEMES[0];

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = current.id;
    root.classList.toggle("dark", current.dark);
    root.style.colorScheme = current.dark ? "dark" : "light";
    window.localStorage.setItem(STORAGE_KEY, current.id);
  }, [current.id, current.dark]);

  const value = useMemo(() => ({
    theme: current.id,
    themeMeta: current,
    themes: THEMES,
    isDark: current.dark,
    toggleTheme: () => setTheme((id) => (id === "dark" ? "light" : "dark")),
    setTheme,
  }), [current]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
