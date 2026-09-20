import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ text, className = "" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (older browsers, insecure context).
      // Fail silently rather than showing a raw error to the user.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-2.5 py-1 text-xs font-medium text-navy-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-navy-700 dark:text-navy-300 dark:hover:border-brand-500 ${className}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
