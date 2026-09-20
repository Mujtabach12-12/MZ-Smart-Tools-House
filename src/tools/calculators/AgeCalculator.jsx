import { useState } from "react";
import { calculateAge } from "../../lib/calculators/age";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AgeCalculator() {
  const [dob, setDob] = useState("");
  const [asOf, setAsOf] = useState(todayISO());
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      if (!dob) throw new Error("Please enter your date of birth.");
      setResult(calculateAge(dob, asOf));
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }
  function handleReset() { setDob(""); setAsOf(todayISO()); setResult(null); setError(""); }

  return (
    <div className="mz-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Date of Birth</label>
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mz-input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">As of Date</label>
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="mz-input" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary">Calculate Age</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {result && (
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultStat label="Age" value={`${result.years}y ${result.months}m ${result.days}d`} highlight />
            <ResultStat label="Total Days Lived" value={result.totalDays.toLocaleString()} />
          </div>
        )}
      </div>

      <ToolExtras
        toolId="age-calculator"
        category="calculators"
        howTo={[
          "Enter your date of birth.",
          "Leave \"As of Date\" as today, or change it to calculate age on a specific date.",
          "Click Calculate to get your exact age in years, months and days.",
        ]}
        faq={[
          { q: "Does this account for leap years?", a: "Yes — the calculation is calendar-aware, so leap years are handled correctly." },
          { q: "Can I calculate age on a future or past date?", a: "Yes, just change the \"As of Date\" field to any date on or after the date of birth." },
        ]}
      />
    </div>
  );
}
