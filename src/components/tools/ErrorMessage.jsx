import { AlertCircle } from "lucide-react";

export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div role="alert" aria-live="assertive" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
