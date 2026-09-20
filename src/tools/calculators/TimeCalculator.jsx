import { useState } from "react";
import { combineDurations, clockTimeDifference } from "../../lib/calculators/time";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function TimeCalculator() {
  const [mode, setMode] = useState("duration"); // duration | clock
  const [h1, setH1] = useState(""); const [m1, setM1] = useState(""); const [s1, setS1] = useState("");
  const [h2, setH2] = useState(""); const [m2, setM2] = useState(""); const [s2, setS2] = useState("");
  const [operation, setOperation] = useState("add");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      if (mode === "duration") {
        const r = combineDurations({ h: h1, m: m1, s: s1 }, { h: h2, m: m2, s: s2 }, operation);
        if (r.negative) throw new Error("Result would be negative — the second duration is longer than the first.");
        setResult(`${r.h}h ${r.m}m ${r.s}s`);
      } else {
        const r = clockTimeDifference(start, end);
        setResult(`${r.h}h ${r.m}m`);
      }
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }
  function handleReset() {
    setH1(""); setM1(""); setS1(""); setH2(""); setM2(""); setS2("");
    setStart(""); setEnd(""); setResult(null); setError("");
  }

  return (
    <div className="mz-card p-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => { setMode("duration"); handleReset(); }}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${mode === "duration" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-navy-200 text-navy-600 dark:border-navy-700 dark:text-navy-300"}`}>
          Add / Subtract Durations
        </button>
        <button type="button" onClick={() => { setMode("clock"); handleReset(); }}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${mode === "clock" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-navy-200 text-navy-600 dark:border-navy-700 dark:text-navy-300"}`}>
          Difference Between Two Clock Times
        </button>
      </div>

      {mode === "duration" ? (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:max-w-sm">
            <input type="number" min="0" value={h1} onChange={(e) => setH1(e.target.value)} className="mz-input" placeholder="HH" aria-label="First duration hours" />
            <input type="number" min="0" max="59" value={m1} onChange={(e) => setM1(e.target.value)} className="mz-input" placeholder="MM" aria-label="First duration minutes" />
            <input type="number" min="0" max="59" value={s1} onChange={(e) => setS1(e.target.value)} className="mz-input" placeholder="SS" aria-label="First duration seconds" />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOperation("add")} className={`rounded-lg border px-3 py-1 text-sm ${operation === "add" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950" : "border-navy-200 dark:border-navy-700"}`}>+ Add</button>
            <button type="button" onClick={() => setOperation("subtract")} className={`rounded-lg border px-3 py-1 text-sm ${operation === "subtract" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950" : "border-navy-200 dark:border-navy-700"}`}>− Subtract</button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:max-w-sm">
            <input type="number" min="0" value={h2} onChange={(e) => setH2(e.target.value)} className="mz-input" placeholder="HH" aria-label="Second duration hours" />
            <input type="number" min="0" max="59" value={m2} onChange={(e) => setM2(e.target.value)} className="mz-input" placeholder="MM" aria-label="Second duration minutes" />
            <input type="number" min="0" max="59" value={s2} onChange={(e) => setS2(e.target.value)} className="mz-input" placeholder="SS" aria-label="Second duration seconds" />
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:max-w-sm sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Start Time</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="mz-input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">End Time</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="mz-input" />
          </div>
        </div>
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
        toolId="time-calculator"
        category="calculators"
        howTo={[
          "Choose whether to add/subtract two durations, or find the difference between two clock times.",
          "Fill in the fields and click Calculate.",
        ]}
        faq={[
          { q: "Does the clock time mode handle overnight spans?", a: "Yes — if the end time is earlier than the start time, it assumes the span crosses midnight." },
        ]}
      />
    </div>
  );
}
