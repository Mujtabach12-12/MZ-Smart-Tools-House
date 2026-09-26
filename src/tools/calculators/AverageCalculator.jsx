import { useState } from "react";
import { computeAverage } from "../../lib/calculators/average";
import { formatCalculatorNumber } from "../../lib/calculators/format";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import { trackEvent } from "../../lib/analytics";
import { announceToolSuccess } from "../../lib/toolSuccess";

export default function AverageCalculator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      const numbers = input.split(/[,\s\n]+/).map((s) => s.trim()).filter(Boolean);
      if (numbers.length === 0) throw new Error("Enter at least one number, separated by commas, spaces, or new lines.");
      const next = computeAverage(numbers);
      setResult(next);
      trackEvent("calculator_complete", { tool_id: "average-calculator", value_count: next.count });
      announceToolSuccess({ source: "calculation" });
    } catch (err) {
      setResult(null);
      setError(err?.message || "Could not calculate this average.");
      trackEvent("calculator_validation_error", { tool_id: "average-calculator" });
    }
  }

  function handleReset() {
    setInput("");
    setResult(null);
    setError("");
    trackEvent("calculator_reset", { tool_id: "average-calculator" });
  }

  return (
    <div className="mz-card p-4 sm:p-6" data-utility-tool="average-calculator">
      <label className="block text-sm font-medium text-navy-700 dark:text-navy-200">
        Numbers
        <textarea rows={5} value={input} onChange={(e) => setInput(e.target.value)} className="mz-input mt-1 min-h-32" placeholder="10, 20, 30\nOr paste one number per line" spellCheck="false" />
      </label>
      <p className="mt-2 text-xs leading-5 text-navy-500 dark:text-navy-400">Commas, spaces, and line breaks are accepted. Invalid tokens are rejected rather than silently ignored.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary min-h-11">Calculate Average</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary min-h-11">Reset</button>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite" aria-atomic="true">
        <ErrorMessage message={error} />
        {result && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ResultStat label="Average" value={formatCalculatorNumber(result.average)} highlight />
            <ResultStat label="Sum" value={formatCalculatorNumber(result.sum)} />
            <ResultStat label="Count" value={result.count.toLocaleString("en-US")} />
            <ResultStat label="Min / Max" value={`${formatCalculatorNumber(result.min)} / ${formatCalculatorNumber(result.max)}`} />
          </div>
        )}
      </div>
    </div>
  );
}
