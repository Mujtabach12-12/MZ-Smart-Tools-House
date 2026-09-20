import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

const ICONS = { success: CheckCircle2, error: CircleAlert, warning: CircleAlert, info: Info };
const TONES = {
  success: "border-emerald-200 bg-white text-emerald-800 dark:border-emerald-900/70 dark:bg-navy-900 dark:text-emerald-200",
  error: "border-red-200 bg-white text-red-800 dark:border-red-900/70 dark:bg-navy-900 dark:text-red-200",
  warning: "border-amber-200 bg-white text-amber-900 dark:border-amber-900/70 dark:bg-navy-900 dark:text-amber-200",
  info: "border-brand-200 bg-white text-navy-800 dark:border-brand-900/70 dark:bg-navy-900 dark:text-navy-100",
};

export default function ToastCenter() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onToast = (event) => {
      const item = event.detail || {};
      if (!item.message) return;
      const id = item.id || `${Date.now()}-${Math.random()}`;
      setItems((current) => [...current.slice(-3), { ...item, id }]);
      const duration = Math.max(1500, Math.min(Number(item.duration) || 3200, 10000));
      window.setTimeout(() => setItems((current) => current.filter((entry) => entry.id !== id)), duration);
    };
    window.addEventListener("mz-toast", onToast);
    return () => window.removeEventListener("mz-toast", onToast);
  }, []);
  if (!items.length) return null;
  return <div className="pointer-events-none fixed inset-x-3 top-20 z-[160] ml-auto flex max-w-sm flex-col gap-2 sm:right-4 sm:left-auto" aria-live="polite" aria-atomic="false">
    {items.map((item) => {
      const type = TONES[item.type] ? item.type : "info";
      const Icon = ICONS[type];
      return <div key={item.id} role={type === "error" ? "alert" : "status"} className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-3 shadow-xl ${TONES[type]}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">{item.title ? <strong className="block text-sm">{item.title}</strong> : null}<p className="text-sm leading-5">{item.message}</p></div>
        <button type="button" className="rounded-lg p-1 opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} aria-label="Dismiss notification"><X className="h-4 w-4" /></button>
      </div>;
    })}
  </div>;
}
