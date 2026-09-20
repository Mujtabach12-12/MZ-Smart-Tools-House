import { useState } from "react";
import { simplifyRatio, solveProportion } from "../../lib/calculators/ratio";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

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
      if (mode === "simplify") {
        const r = simplifyRatio(a, b);
        setResult(`${r.a} : ${r.b}`);
      } else {
        const r = solveProportion({
          a: a === "" ? null : a,
          b: b === "" ? null : b,
          c: c === "" ? null : c,
          d: d === "" ? null : d,
        });
        const key = Object.keys(r)[0];
        setResult(`${key.toUpperCase()} = ${r[key]}`);
      }
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }
  function handleReset() { setA(""); setB(""); setC(""); setD(""); setResult(null); setError(""); }

  return (
    <div className="mz-card p-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => { setMode("simplify"); handleReset(); }}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${mode === "simplify" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-navy-200 text-navy-600 dark:border-navy-700 dark:text-navy-300"}`}>
          Simplify a Ratio
        </button>
        <button type="button" onClick={() => { setMode("solve"); handleReset(); }}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${mode === "solve" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-navy-200 text-navy-600 dark:border-navy-700 dark:text-navy-300"}`}>
          Solve a : b = c : d
        </button>
      </div>

      {mode === "simplify" ? (
        <div className="mt-5 grid max-w-sm grid-cols-2 gap-4">
          <input type="number" value={a} onChange={(e) => setA(e.target.value)} className="mz-input" placeholder="a" aria-label="Ratio value a" />
          <input type="number" value={b} onChange={(e) => setB(e.target.value)} className="mz-input" placeholder="b" aria-label="Ratio value b" />
        </div>
      ) : (
        <div className="mt-5 grid max-w-md grid-cols-4 items-center gap-2">
          <input type="number" value={a} onChange={(e) => setA(e.target.value)} className="mz-input" placeholder="a" aria-label="a" />
          <span className="text-center text-navy-400">:</span>
          <input type="number" value={b} onChange={(e) => setB(e.target.value)} className="mz-input" placeholder="b" aria-label="b" />
          <span className="text-center text-navy-400">=</span>
          <input type="number" value={c} onChange={(e) => setC(e.target.value)} className="mz-input" placeholder="c" aria-label="c" />
          <span className="text-center text-navy-400">:</span>
          <input type="number" value={d} onChange={(e) => setD(e.target.value)} className="mz-input" placeholder="d" aria-label="d" />
        </div>
      )}
      {mode === "solve" && (
        <p className="mt-2 text-xs text-navy-400 dark:text-navy-500">Leave exactly one field empty — that's the value we'll solve for.</p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary">Calculate</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {result && <ResultStat label="Result" value={result} highlight />}
      </div>

      <ToolExtras
        toolId="ratio-calculator"
        category="calculators"
        howTo={[
          "Choose \"Simplify a Ratio\" to reduce a:b to its lowest terms.",
          "Or choose \"Solve a proportion\" and leave one of the four values blank to solve for it.",
        ]}
        faq={[
          { q: "Does this work with decimals?", a: "Yes — simplifying handles decimal ratios (like 1.5:2) by scaling them up before reducing." },
        ]}
      />
    </div>
  );
}
