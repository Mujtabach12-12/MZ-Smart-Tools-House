import { useState } from "react";
import { percentageOf, valueFromPercentage, percentageChange } from "../../lib/calculators/percentage";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

const MODES = [
  { id: "of", label: "X is what % of Y" },
  { id: "value", label: "X% of Y" },
  { id: "change", label: "% change from X to Y" },
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
      if (mode === "of") setResult({ label: "Result", value: `${percentageOf(x, y)}%` });
      else if (mode === "value") setResult({ label: "Result", value: valueFromPercentage(x, y) });
      else setResult({ label: "Percentage Change", value: `${percentageChange(x, y)}%` });
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }

  function handleReset() {
    setX(""); setY(""); setResult(null); setError("");
  }

  const labels = {
    of: ["X (part)", "Y (whole)"],
    value: ["X (percent)", "Y (whole)"],
    change: ["X (old value)", "Y (new value)"],
  }[mode];

  return (
    <div className="mz-card p-6">
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMode(m.id); setResult(null); setError(""); }}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              mode === m.id
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                : "border-navy-200 text-navy-600 hover:border-brand-300 dark:border-navy-700 dark:text-navy-300"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">{labels[0]}</label>
          <input type="number" value={x} onChange={(e) => setX(e.target.value)} className="mz-input" placeholder="0" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">{labels[1]}</label>
          <input type="number" value={y} onChange={(e) => setY(e.target.value)} className="mz-input" placeholder="0" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary">Calculate</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {result && <ResultStat label={result.label} value={result.value} highlight />}
      </div>

      <ToolExtras
        toolId="percentage-calculator"
        category="calculators"
        howTo={[
          "Choose the type of percentage calculation you need.",
          "Enter the two values requested.",
          "Click Calculate to see your result instantly.",
        ]}
        faq={[
          { q: "What's the difference between the three modes?", a: "\"X is what % of Y\" finds a percentage; \"X% of Y\" finds a value; \"% change\" compares two values and shows the increase or decrease." },
          { q: "Can the result be negative?", a: "Yes — for percentage change, a negative result means a decrease from the old value to the new value." },
        ]}
      />
    </div>
  );
}
