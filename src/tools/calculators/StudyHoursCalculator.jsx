import { useState } from "react";
import { planStudyHours } from "../../lib/calculators/studyHours";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function StudyHoursCalculator() {
  const [days, setDays] = useState("");
  const [hoursNeeded, setHoursNeeded] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      setResult(planStudyHours(days, hoursNeeded, hoursPerDay));
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }
  function handleReset() { setDays(""); setHoursNeeded(""); setHoursPerDay(""); setResult(null); setError(""); }

  return (
    <div className="mz-card p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Days Until Exam</label>
          <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} className="mz-input" placeholder="10" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Total Study Hours Needed</label>
          <input type="number" min="1" value={hoursNeeded} onChange={(e) => setHoursNeeded(e.target.value)} className="mz-input" placeholder="40" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Hours Available Per Day</label>
          <input type="number" min="0.5" step="0.5" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} className="mz-input" placeholder="5" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary">Calculate Plan</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {result && (
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultStat label="Required Hours/Day" value={result.requiredHoursPerDay} highlight />
            <ResultStat label="Total Available Hours" value={result.totalAvailableHours} />
            {!result.feasible && (
              <ResultStat label="Shortfall" value={`${result.shortfallHours} hours`} />
            )}
          </div>
        )}
        {result && (
          <p className={`text-sm ${result.feasible ? "text-green-600" : "text-red-600"}`}>
            {result.feasible
              ? "Your available time comfortably covers what you need — you're on track."
              : "Your current availability isn't quite enough — consider adding extra hours or starting sooner."}
          </p>
        )}
      </div>

      <ToolExtras
        toolId="study-hours-calculator"
        category="calculators"
        howTo={[
          "Enter how many days remain until your exam.",
          "Enter your best estimate of total hours needed to cover the syllabus.",
          "Enter how many hours you can realistically study per day.",
          "Calculate to see if your plan is feasible and how many hours/day you actually need.",
        ]}
        faq={[
          { q: "How do I estimate total hours needed?", a: "A common rule of thumb is 2-4 hours per topic/chapter depending on difficulty — adjust based on your own pace." },
          { q: "What does \"shortfall\" mean?", a: "It's how many hours short you'll be if you stick to your stated daily availability — a signal to either study more per day or start earlier." },
        ]}
      />
    </div>
  );
}
