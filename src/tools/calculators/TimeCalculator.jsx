import { useState } from "react";
import { combineDurations, clockTimeDifference } from "../../lib/calculators/time";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import { trackEvent } from "../../lib/analytics";
import { announceToolSuccess } from "../../lib/toolSuccess";

function DurationInputs({ prefix, h, m, s, setH, setM, setS }) {
  return <fieldset className="rounded-2xl border border-navy-100 p-4 dark:border-navy-800">
    <legend className="px-1 text-sm font-semibold text-navy-800 dark:text-navy-100">{prefix}</legend>
    <div className="grid grid-cols-3 gap-2 sm:max-w-md">
      <label className="text-xs font-medium text-navy-500 dark:text-navy-400">Hours<input inputMode="numeric" type="number" step="1" min="0" value={h} onChange={(e) => setH(e.target.value)} className="mz-input mt-1" placeholder="0" /></label>
      <label className="text-xs font-medium text-navy-500 dark:text-navy-400">Minutes<input inputMode="numeric" type="number" step="1" min="0" max="59" value={m} onChange={(e) => setM(e.target.value)} className="mz-input mt-1" placeholder="0" /></label>
      <label className="text-xs font-medium text-navy-500 dark:text-navy-400">Seconds<input inputMode="numeric" type="number" step="1" min="0" max="59" value={s} onChange={(e) => setS(e.target.value)} className="mz-input mt-1" placeholder="0" /></label>
    </div>
  </fieldset>;
}

export default function TimeCalculator() {
  const [mode, setMode] = useState("duration");
  const [h1, setH1] = useState(""); const [m1, setM1] = useState(""); const [s1, setS1] = useState("");
  const [h2, setH2] = useState(""); const [m2, setM2] = useState(""); const [s2, setS2] = useState("");
  const [operation, setOperation] = useState("add");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function clearValues() {
    setH1(""); setM1(""); setS1(""); setH2(""); setM2(""); setS2(""); setStart(""); setEnd(""); setResult(null); setError("");
  }

  function handleCalculate() {
    try {
      setError("");
      let next;
      if (mode === "duration") {
        const r = combineDurations({ h: h1, m: m1, s: s1 }, { h: h2, m: m2, s: s2 }, operation);
        if (r.negative) throw new Error("The subtraction result would be negative. This duration mode does not silently convert negative time to a positive duration.");
        next = `${r.h}h ${r.m}m ${r.s}s`;
      } else {
        const r = clockTimeDifference(start, end);
        next = `${r.h}h ${r.m}m`;
      }
      setResult(next);
      trackEvent("calculator_complete", { tool_id: "time-calculator", calculation_mode: mode, operation: mode === "duration" ? operation : "clock_difference" });
      announceToolSuccess({ source: "calculation" });
    } catch (err) {
      setResult(null);
      setError(err?.message || "Could not calculate this time value.");
      trackEvent("calculator_validation_error", { tool_id: "time-calculator", calculation_mode: mode });
    }
  }

  function handleReset() {
    clearValues();
    setOperation("add");
    trackEvent("calculator_reset", { tool_id: "time-calculator" });
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    clearValues();
  }

  return (
    <div className="mz-card p-4 sm:p-6" data-utility-tool="time-calculator">
      <fieldset>
        <legend className="text-sm font-semibold text-navy-800 dark:text-navy-100">Time calculation type</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" aria-pressed={mode === "duration"} onClick={() => switchMode("duration")} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${mode === "duration" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-navy-200 text-navy-600 dark:border-navy-700 dark:text-navy-300"}`}>Add / subtract durations</button>
          <button type="button" aria-pressed={mode === "clock"} onClick={() => switchMode("clock")} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${mode === "clock" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "border-navy-200 text-navy-600 dark:border-navy-700 dark:text-navy-300"}`}>Clock-time difference</button>
        </div>
      </fieldset>

      {mode === "duration" ? (
        <div className="mt-5 space-y-4">
          <DurationInputs prefix="First duration" h={h1} m={m1} s={s1} setH={setH1} setM={setM1} setS={setS1} />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Duration operation">
            <button type="button" aria-pressed={operation === "add"} onClick={() => setOperation("add")} className={`min-h-11 rounded-lg border px-4 py-2 text-sm ${operation === "add" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950" : "border-navy-200 dark:border-navy-700"}`}>+ Add</button>
            <button type="button" aria-pressed={operation === "subtract"} onClick={() => setOperation("subtract")} className={`min-h-11 rounded-lg border px-4 py-2 text-sm ${operation === "subtract" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950" : "border-navy-200 dark:border-navy-700"}`}>− Subtract</button>
          </div>
          <DurationInputs prefix="Second duration" h={h2} m={m2} s={s2} setH={setH2} setM={setM2} setS={setS2} />
          <p className="text-xs leading-5 text-navy-500 dark:text-navy-400">This is duration arithmetic, so 20h + 8h = 28h. Minutes and seconds must be whole values from 0 to 59.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:max-w-md sm:grid-cols-2">
          <label className="text-sm font-medium text-navy-700 dark:text-navy-200">Start time<input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="mz-input mt-1" /></label>
          <label className="text-sm font-medium text-navy-700 dark:text-navy-200">End time<input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="mz-input mt-1" /></label>
          <p className="sm:col-span-2 text-xs leading-5 text-navy-500 dark:text-navy-400">If the end time is earlier than the start time, the tool treats it as crossing midnight.</p>
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
