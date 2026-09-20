import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Displays a labeled result value with a copy-to-clipboard button.
 * Used across every calculator so "copy result" behaves identically everywhere.
 */
export default function ResultStat({ label, value, highlight = false }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (e.g. insecure context) — fail silently,
      // the value is still visible on screen for manual copy.
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
        highlight
          ? "border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-950"
          : "border-navy-100 bg-navy-50/60 dark:border-navy-800 dark:bg-navy-900/60"
      }`}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-navy-500 dark:text-navy-400">{label}</p>
        <p className={`mt-0.5 font-semibold ${highlight ? "text-xl text-brand-700 dark:text-brand-300" : "text-navy-900 dark:text-navy-50"}`}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        title="Copy"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-navy-200 text-navy-500 transition hover:border-brand-300 hover:text-brand-700 dark:border-navy-700 dark:text-navy-400"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
