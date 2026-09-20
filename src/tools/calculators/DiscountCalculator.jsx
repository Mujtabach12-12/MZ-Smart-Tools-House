import { useState } from "react";
import { applyDiscount, discountPercentFromPrices } from "../../lib/calculators/discount";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function DiscountCalculator() {
  const [mode, setMode] = useState("price"); // price | percent
  const [original, setOriginal] = useState("");
  const [secondValue, setSecondValue] = useState(""); // discount % or final price
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      if (mode === "price") {
        const r = applyDiscount(original, secondValue);
        setResult({ items: [["Final Price", r.finalPrice], ["You Save", r.saved]] });
      } else {
        const r = discountPercentFromPrices(original, secondValue);
        setResult({ items: [["Discount Percentage", `${r.percent}%`], ["You Save", r.saved]] });
      }
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }
  function handleReset() { setOriginal(""); setSecondValue(""); setResult(null); setError(""); }

  return (
    <div className="mz-card p-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => { setMode("price"); setResult(null); setError(""); }}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${mode === "price" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-navy-200 text-navy-600 dark:border-navy-700 dark:text-navy-300"}`}>
          Find Final Price
        </button>
        <button type="button" onClick={() => { setMode("percent"); setResult(null); setError(""); }}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${mode === "percent" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-navy-200 text-navy-600 dark:border-navy-700 dark:text-navy-300"}`}>
          Find Discount %
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Original Price</label>
          <input type="number" min="0" value={original} onChange={(e) => setOriginal(e.target.value)} className="mz-input" placeholder="2000" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">
            {mode === "price" ? "Discount %" : "Final Price"}
          </label>
          <input type="number" min="0" value={secondValue} onChange={(e) => setSecondValue(e.target.value)} className="mz-input" placeholder={mode === "price" ? "25" : "1500"} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary">Calculate</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {result && (
          <div className="grid gap-3 sm:grid-cols-2">
            {result.items.map(([label, value], i) => (
              <ResultStat key={label} label={label} value={value} highlight={i === 0} />
            ))}
          </div>
        )}
      </div>

      <ToolExtras
        toolId="discount-calculator"
        category="calculators"
        howTo={[
          "Choose whether you want the final price or the discount percentage.",
          "Enter the original price and the other known value.",
          "Click Calculate to see the result.",
        ]}
        faq={[
          { q: "Can I use this for reverse discounts?", a: "Yes — switch to \"Find Discount %\" and enter the original and final price to see the percentage that was applied." },
        ]}
      />
    </div>
  );
}
