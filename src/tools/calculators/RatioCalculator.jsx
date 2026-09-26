import { useState } from "react";
import { simplifyRatio, solveProportion } from "../../lib/calculators/ratio";
import { formatCalculatorNumber } from "../../lib/calculators/format";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import { trackEvent } from "../../lib/analytics";
import { announceToolSuccess } from "../../lib/toolSuccess";

function RatioInput({ label, value, onChange, placeholder }) {
  return <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
    {label}
    <input inputMode="decimal" step="any" min="0" type="number" value={value} onChange={(e) => onChange(e.target.value)} className="mz-input mt-1" placeholder={placeholder} />
  </label>;
}

export default function RatioCalculator() {
  const [mode, setMode] = useState("simplify");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [d, setD] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      let next;
      if (mode === "simplify") {
        const r = simplifyRatio(a, b);
        next = `${r.a} : ${r.b}`;
      } else {
        const r = solveProportion({ a: a === "" ? null : a, b: b === "" ? null : b, c: c === "" ? null : c, d: d === "" ? null : d });
        const key = Object.keys(r)[0];
        next = `${key.toUpperCase()} = ${formatCalculatorNumber(r[key])}`;
      }
      setResult(next);
      trackEvent("calculator_complete", { tool_id: "ratio-calculator", calculation_mode: mode });
      announceToolSuccess({ source: "calculation" });
    } catch (err) {
      setResult(null);
      setError(err?.message || "Could not calculate this ratio.");
      trackEvent("calculator_validation_error", { tool_id: "ratio-calculator", calculation_mode: mode });
    }
  }

  function handleReset() {
    setA(""); setB(""); setC(""); setD(""); setResult(null); setError("");
    trackEvent("calculator_reset", { tool_id: "ratio-calculator" });
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setA(""); setB(""); setC(""); setD(""); setResult(null); setError("");
  }

  return (
    <div className="mz-card p-4 sm:p-6" data-utility-tool="ratio-calculator">
      <fieldset>
        <legend className="text-sm font-semibold text-navy-800 dark:text-navy-100">Calculation type</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" aria-pressed={mode === "simplify"} onClick={() => switchMode("simplify")} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${mode === "simplify" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-navy-200 text-navy-600 dark:border-navy-700 dark:text-navy-300"}`}>Simplify ratio</button>
          <button type="button" aria-pressed={mode === "solve"} onClick={() => switchMode("solve")} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${mode === "solve" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-navy-200 text-navy-600 dark:border-navy-700 dark:text-navy-300"}`}>Solve proportion</button>
        </div>
      </fieldset>

      {mode === "simplify" ? (
        <div className="mt-5 grid gap-4 sm:max-w-md sm:grid-cols-2">
          <RatioInput label="First value" value={a} onChange={setA} placeholder="8" />
          <RatioInput label="Second value" value={b} onChange={setB} placeholder="12" />
        </div>
      ) : (
        <div className="mt-5 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-navy-800 dark:text-navy-100">A : B = C : D</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RatioInput label="A" value={a} onChange={setA} placeholder="2" />
            <RatioInput label="B" value={b} onChange={setB} placeholder="3" />
            <RatioInput label="C" value={c} onChange={setC} placeholder="8" />
            <RatioInput label="D" value={d} onChange={setD} placeholder="leave empty" />
          </div>
          <p className="mt-2 text-xs leading-5 text-navy-500 dark:text-navy-400">Leave exactly one field empty. Positive values only; zero would create an undefined ratio in this calculator.</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary min-h-11">Calculate</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary min-h-11">Reset</button>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite" aria-atomic="true">
        <ErrorMessage message={error} />
        {result && <ResultStat label="Result" value={result} highlight />}
      </div>
    </div>
  );
}
