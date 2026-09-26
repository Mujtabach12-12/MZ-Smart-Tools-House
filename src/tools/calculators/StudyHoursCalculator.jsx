import { useState } from "react";
import { planStudyHours } from "../../lib/calculators/studyHours";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";
import { trackEvent } from "../../lib/analytics";

const formatHours = (value) => Number(value.toFixed(2));

export default function StudyHoursCalculator() {
  const [days, setDays] = useState("");
  const [hoursNeeded, setHoursNeeded] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      const next = planStudyHours(days, hoursNeeded, hoursPerDay);
      setResult(next);
      trackEvent("calculator_complete", { tool_id: "study-hours-calculator", feasibility_checked: next.feasible != null });
    } catch (err) {
      setResult(null);
      setError(err.message);
      trackEvent("calculator_validation_error", { tool_id: "study-hours-calculator" });
    }
  }

  function handleReset() {
    setDays("");
    setHoursNeeded("");
    setHoursPerDay("");
    setResult(null);
    setError("");
    trackEvent("calculator_reset", { tool_id: "study-hours-calculator" });
  }

  return (
    <div className="mz-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          Days Available
          <input type="number" inputMode="decimal" min="0.01" step="0.01" value={days} onChange={(e) => setDays(e.target.value)} className="mz-input mt-2" placeholder="5" />
        </label>
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          Total Study Workload (hours)
          <input type="number" inputMode="decimal" min="0" step="0.1" value={hoursNeeded} onChange={(e) => setHoursNeeded(e.target.value)} className="mz-input mt-2" placeholder="40" />
        </label>
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          Hours Available Per Day <span className="font-normal text-navy-400">(optional)</span>
          <input type="number" inputMode="decimal" min="0.01" step="0.1" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} className="mz-input mt-2" placeholder="5" />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary">Calculate Plan</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite">
        <ErrorMessage message={error} />
        {result && (
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultStat label="Required Hours/Day" value={formatHours(result.requiredHoursPerDay)} highlight />
            {result.totalAvailableHours != null && <ResultStat label="Total Available Hours" value={formatHours(result.totalAvailableHours)} />}
            {result.shortfallHours != null && result.shortfallHours > 0 && <ResultStat label="Shortfall" value={`${formatHours(result.shortfallHours)} hours`} />}
          </div>
        )}
        {result && result.feasible != null && (
          <p className={`text-sm ${result.feasible ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
            {result.feasible
              ? "Your stated daily availability is enough for this workload."
              : "Your stated daily availability is not enough for this workload. Increase daily hours or allow more days."}
          </p>
        )}
      </div>

      <ToolExtras
        toolId="study-hours-calculator"
        category="calculators"
        howTo={[
          "Enter the total study workload in hours and the number of days available.",
          "The calculator divides workload by days to find the required hours per day.",
          "Optionally enter your available hours per day to check whether the plan is feasible.",
        ]}
        faq={[
          { q: "What happens if the workload is 0 hours?", a: "The required study time is 0 hours/day. Days must still be greater than 0." },
          { q: "Do I have to enter hours available per day?", a: "No. That field is optional and is only used to compare your availability with the calculated requirement." },
        ]}
      />
    </div>
  );
}
