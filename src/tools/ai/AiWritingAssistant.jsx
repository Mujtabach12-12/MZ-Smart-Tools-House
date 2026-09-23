import { Sparkles } from "lucide-react";

export default function AiWritingAssistant() {
  return (
    <div className="mz-card mx-auto max-w-3xl p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm dark:bg-brand-950/40 dark:text-brand-300">
          <Sparkles className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-navy-950 dark:text-white">Coming soon</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-navy-500 dark:text-navy-300 sm:text-base">
          Thanks for your interest. We&apos;re preparing the AI Writing Assistant for a reliable, polished experience and will make it available soon.
        </p>
      </div>
    </div>
  );
}
