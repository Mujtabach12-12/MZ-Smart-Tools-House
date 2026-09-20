import CopyButton from "./CopyButton";

export function ResultRow({ label, value, highlight = false, copyText }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${highlight ? "bg-brand-50 dark:bg-brand-950" : "bg-navy-50 dark:bg-navy-800/60"}`}>
      <span className={`text-sm ${highlight ? "font-medium text-brand-700 dark:text-brand-300" : "text-navy-500 dark:text-navy-400"}`}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className={`font-semibold ${highlight ? "text-lg text-brand-700 dark:text-brand-300" : "text-navy-900 dark:text-navy-50"}`}>
          {value}
        </span>
        {copyText != null && <CopyButton text={String(copyText)} />}
      </div>
    </div>
  );
}

export default function ResultCard({ children, title = "Result" }) {
  return (
    <div className="mz-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-navy-900 dark:text-navy-50">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
