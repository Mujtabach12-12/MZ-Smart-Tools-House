import { useState } from "react";
import { calculateAge, getLocalTodayISO } from "../../lib/calculators/age";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import { trackEvent } from "../../lib/analytics";
import { announceToolSuccess } from "../../lib/toolSuccess";

export default function AgeCalculator() {
  const [dob, setDob] = useState("");
  const [asOf, setAsOf] = useState(getLocalTodayISO());
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      if (!dob) throw new Error("Please enter your date of birth.");
      if (!asOf) throw new Error("Please enter a reference date.");
      const next = calculateAge(dob, asOf);
      setResult(next);
      trackEvent("calculator_complete", { tool_id: "age-calculator", custom_reference_date: asOf !== getLocalTodayISO() });
      announceToolSuccess({ source: "calculation" });
    } catch (err) {
      setResult(null);
      setError(err?.message || "Could not calculate this age.");
      trackEvent("calculator_validation_error", { tool_id: "age-calculator" });
    }
  }

  function handleReset() {
    setDob("");
    setAsOf(getLocalTodayISO());
    setResult(null);
    setError("");
    trackEvent("calculator_reset", { tool_id: "age-calculator" });
  }

  return (
    <div className="mz-card p-4 sm:p-6" data-utility-tool="age-calculator">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          Date of birth
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mz-input mt-1" />
        </label>
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          Reference date
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="mz-input mt-1" />
        </label>
      </div>

      <p className="mt-3 text-xs leading-5 text-navy-500 dark:text-navy-400">
        Dates are treated as calendar dates, not timestamps. The calculation avoids timezone and daylight-saving date shifts.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary min-h-11">Calculate Age</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary min-h-11">Reset</button>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite" aria-atomic="true">
        <ErrorMessage message={error} />
        {result && (
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultStat label="Calendar Age" value={`${result.years}y ${result.months}m ${result.days}d`} highlight />
            <ResultStat label="Total Days" value={result.totalDays.toLocaleString("en-US")} />
          </div>
        )}
      </div>
    </div>
  );
}
