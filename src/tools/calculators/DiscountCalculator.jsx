import { useState } from "react";
import { applyDiscount, discountPercentFromPrices } from "../../lib/calculators/discount";
import { formatFixedFlexible, formatCalculatorNumber } from "../../lib/calculators/format";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import { trackEvent } from "../../lib/analytics";
import { announceToolSuccess } from "../../lib/toolSuccess";

export default function DiscountCalculator() {
  const [mode, setMode] = useState("price");
  const [original, setOriginal] = useState("");
  const [secondValue, setSecondValue] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      if (mode === "price") {
        const r = applyDiscount(original, secondValue);
        setResult({ items: [["Discount Amount", formatFixedFlexible(r.saved, 2)], ["Final Price", formatFixedFlexible(r.finalPrice, 2)]] });
      } else {
        const r = discountPercentFromPrices(original, secondValue);
        setResult({ items: [["Discount Percentage", `${formatCalculatorNumber(r.percent, 6)}%`], ["Discount Amount", formatFixedFlexible(r.saved, 2)]] });
      }
      trackEvent("calculator_complete", { tool_id: "discount-calculator", calculation_mode: mode });
      announceToolSuccess({ source: "calculation" });
    } catch (err) {
      setResult(null);
      setError(err?.message || "Could not calculate this discount.");
      trackEvent("calculator_validation_error", { tool_id: "discount-calculator", calculation_mode: mode });
    }
  }

  function handleReset() {
    setOriginal("");
    setSecondValue("");
    setResult(null);
    setError("");
    trackEvent("calculator_reset", { tool_id: "discount-calculator" });
  }

  return (
    <div className="mz-card p-4 sm:p-6" data-utility-tool="discount-calculator">
      <fieldset>
        <legend className="text-sm font-semibold text-navy-800 dark:text-navy-100">Calculation type</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" aria-pressed={mode === "price"} onClick={() => { setMode("price"); setResult(null); setError(""); }}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${mode === "price" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-navy-200 text-navy-600 dark:border-navy-700 dark:text-navy-300"}`}>
            Final price from discount
          </button>
          <button type="button" aria-pressed={mode === "percent"} onClick={() => { setMode("percent"); setResult(null); setError(""); }}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${mode === "percent" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-navy-200 text-navy-600 dark:border-navy-700 dark:text-navy-300"}`}>
            Discount % from prices
          </button>
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          Original price
          <input inputMode="decimal" type="number" step="any" min="0" value={original} onChange={(e) => setOriginal(e.target.value)} className="mz-input mt-1" placeholder="1000" />
        </label>
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          {mode === "price" ? "Discount (%)" : "Final price"}
          <input inputMode="decimal" type="number" step="any" min="0" value={secondValue} onChange={(e) => setSecondValue(e.target.value)} className="mz-input mt-1" placeholder={mode === "price" ? "20" : "800"} />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary min-h-11">Calculate</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary min-h-11">Reset</button>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite" aria-atomic="true">
        <ErrorMessage message={error} />
        {result && <div className="grid gap-3 sm:grid-cols-2">{result.items.map(([label, value], i) => <ResultStat key={label} label={label} value={value} highlight={i === result.items.length - 1} />)}</div>}
      </div>
    </div>
  );
}
