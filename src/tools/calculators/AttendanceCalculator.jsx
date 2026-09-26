import { useState } from "react";
import { currentAttendancePercentage, maxMissableClasses, classesNeededToReach } from "../../lib/calculators/attendance";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";
import { trackEvent } from "../../lib/analytics";

const formatPercent = (value) => `${Number(value.toFixed(2))}%`;

export default function AttendanceCalculator() {
  const [attended, setAttended] = useState("");
  const [total, setTotal] = useState("");
  const [required, setRequired] = useState("75");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      const percentage = currentAttendancePercentage(attended, total);
      const target = Number(required);
      if (!Number.isFinite(target) || target <= 0 || target > 100) {
        throw new Error("Required attendance percentage must be greater than 0 and no more than 100.");
      }
      const meetsRequirement = percentage >= target;
      const missable = meetsRequirement ? maxMissableClasses(attended, total, target) : 0;
      const needed = meetsRequirement ? 0 : classesNeededToReach(attended, total, target);
      setResult({ percentage, target, meetsRequirement, missable, needed });
      trackEvent("calculator_complete", { tool_id: "attendance-calculator", meets_requirement: meetsRequirement });
    } catch (err) {
      setResult(null);
      setError(err.message);
      trackEvent("calculator_validation_error", { tool_id: "attendance-calculator" });
    }
  }

  function handleReset() {
    setAttended("");
    setTotal("");
    setRequired("75");
    setResult(null);
    setError("");
    trackEvent("calculator_reset", { tool_id: "attendance-calculator" });
  }

  return (
    <div className="mz-card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          Classes Attended
          <input type="number" inputMode="numeric" min="0" step="1" value={attended} onChange={(e) => setAttended(e.target.value)} className="mz-input mt-2" placeholder="80" />
        </label>
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          Total Classes Held
          <input type="number" inputMode="numeric" min="1" step="1" value={total} onChange={(e) => setTotal(e.target.value)} className="mz-input mt-2" placeholder="100" />
        </label>
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          Required Attendance %
          <input type="number" inputMode="decimal" min="0.01" max="100" step="0.01" value={required} onChange={(e) => setRequired(e.target.value)} className="mz-input mt-2" placeholder="75" />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary">Calculate</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite">
        <ErrorMessage message={error} />
        {result && (
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultStat label="Current Attendance" value={formatPercent(result.percentage)} highlight />
            {result.meetsRequirement ? (
              <ResultStat label="Future Classes You Can Miss" value={result.missable} />
            ) : (
              <ResultStat label="Consecutive Classes Needed" value={result.needed} />
            )}
          </div>
        )}
        {result && (
          <p className="text-sm leading-6 text-navy-500 dark:text-navy-400">
            {result.meetsRequirement
              ? `The missable-class result assumes the next ${result.missable} class${result.missable === 1 ? "" : "es"} are missed and no other future classes are counted yet.`
              : `To reach ${result.target}% from the current record, attend the next ${result.needed} class${result.needed === 1 ? "" : "es"} consecutively without another absence.`}
          </p>
        )}
      </div>

      <ToolExtras
        toolId="attendance-calculator"
        category="calculators"
        howTo={[
          "Enter whole-number counts for classes attended and total classes held.",
          "Enter your institution's required attendance threshold.",
          "Calculate to see your current attendance and either future absences allowed or consecutive classes needed to reach the target.",
        ]}
        faq={[
          { q: "How is attendance percentage calculated?", a: "Attendance % = attended classes ÷ total classes × 100." },
          { q: "How is 'classes you can miss' calculated?", a: "It finds the maximum number of future absences that keep attended ÷ (current total + future missed) at or above your required percentage." },
          { q: "What if I am below the requirement?", a: "The tool solves for the number of future classes you must attend consecutively so that (attended + new attended) ÷ (total + new attended) reaches the target." },
        ]}
      />
    </div>
  );
}
