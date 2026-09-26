import { useState } from "react";
import { percentageOf, valueFromPercentage, percentageChange } from "../../lib/calculators/percentage";
import { formatCalculatorNumber } from "../../lib/calculators/format";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import { announceToolSuccess } from "../../lib/toolSuccess";
import { trackEvent } from "../../lib/analytics";

const MODES = [
  { id: "of", label: "What % is X of Y" },
  { id: "value", label: "X% of Y" },
  { id: "change", label: "Percentage change" },
];

export default function PercentageCalculator() {
  const [mode, setMode] = useState("of");
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      let next;
      if (mode === "of") {
        next = { label: "Percentage", value: `${formatCalculatorNumber(percentageOf(x, y))}%` };
      } else if (mode === "value") {
        next = { label: "Value", value: formatCalculatorNumber(valueFromPercentage(x, y)) };
      } else {
        const change = percentageChange(x, y);
        const direction = change > 0 ? "increase" : change < 0 ? "decrease" : "no change";
        next = {
          label: "Percentage Change",
          value: `${change > 0 ? "+" : ""}${formatCalculatorNumber(change)}% (${direction})`,
        };
      }
      setResult(next);
      trackEvent("calculator_complete", { tool_id: "percentage-calculator", calculation_mode: mode });
      announceToolSuccess({ source: "calculation" });
    } catch (err) {
      setResult(null);
      const message = err?.message || "Could not calculate this percentage.";
      setError(message);
      trackEvent("calculator_validation_error", { tool_id: "percentage-calculator", calculation_mode: mode });
    }
  }

  function handleReset() {
    setX("");
    setY("");
    setResult(null);
    setError("");
    trackEvent("calculator_reset", { tool_id: "percentage-calculator" });
  }

  const labels = {
    of: ["X (part)", "Y (whole)"],
    value: ["X (percent)", "Y (value)"],
    change: ["Old value", "New value"],
  }[mode];

  return (
    <div className="mz-card p-4 sm:p-6" data-utility-tool="percentage-calculator">
      <fieldset>
        <legend className="text-sm font-semibold text-navy-800 dark:text-navy-100">Calculation type</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => { setMode(m.id); setResult(null); setError(""); }}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${
                mode === m.id
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : "border-navy-200 text-navy-600 hover:border-brand-300 dark:border-navy-700 dark:text-navy-300"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          {labels[0]}
          <input inputMode="decimal" step="any" type="number" value={x} onChange={(e) => setX(e.target.value)} className="mz-input mt-1" placeholder="0" />
        </label>
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          {labels[1]}
          <input inputMode="decimal" step="any" type="number" value={y} onChange={(e) => setY(e.target.value)} className="mz-input mt-1" placeholder="0" />
        </label>
      </div>

      <p className="mt-3 text-xs leading-5 text-navy-500 dark:text-navy-400">
        Negative values are mathematically supported. Percentage change from an old value of zero is undefined and will be rejected.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary min-h-11">Calculate</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary min-h-11">Reset</button>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite" aria-atomic="true">
        <ErrorMessage message={error} />
        {result && <ResultStat label={result.label} value={result.value} highlight />}
      </div>
    </div>
  );
}
