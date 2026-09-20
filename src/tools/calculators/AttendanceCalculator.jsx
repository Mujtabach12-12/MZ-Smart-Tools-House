import { useState } from "react";
import { currentAttendancePercentage, maxMissableClasses, classesNeededToReach } from "../../lib/calculators/attendance";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

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
      const meetsRequirement = percentage >= Number(required);
      const missable = meetsRequirement ? maxMissableClasses(attended, total, required) : 0;
      const needed = meetsRequirement ? 0 : classesNeededToReach(attended, total, required);
      setResult({ percentage, meetsRequirement, missable, needed });
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }

  function handleReset() {
    setAttended(""); setTotal(""); setRequired("75"); setResult(null); setError("");
  }

  return (
    <div className="mz-card p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Classes Attended</label>
          <input type="number" min="0" value={attended} onChange={(e) => setAttended(e.target.value)} className="mz-input" placeholder="45" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Total Classes Held</label>
          <input type="number" min="0" value={total} onChange={(e) => setTotal(e.target.value)} className="mz-input" placeholder="50" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Required %</label>
          <input type="number" min="1" max="100" value={required} onChange={(e) => setRequired(e.target.value)} className="mz-input" placeholder="75" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary">Calculate</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {result && (
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultStat label="Current Attendance" value={`${result.percentage}%`} highlight />
            {result.meetsRequirement ? (
              <ResultStat label="Classes You Can Still Miss" value={result.missable} />
            ) : (
              <ResultStat label="Classes Needed to Reach Requirement" value={result.needed} />
            )}
          </div>
        )}
      </div>

      <ToolExtras
        toolId="attendance-calculator"
        category="calculators"
        howTo={[
          "Enter how many classes you've attended and how many were held in total.",
          "Enter your institution's required attendance percentage (commonly 75%).",
          "Calculate to see your current percentage, plus how many classes you can miss or need to attend.",
        ]}
        faq={[
          { q: "How is \"classes you can still miss\" calculated?", a: "It assumes every future class from now on is missed, and finds the maximum number you can skip while staying at or above your required percentage." },
          { q: "What if I'm already below the requirement?", a: "The tool instead shows how many classes you'd need to attend consecutively (assuming you don't miss any more) to reach the requirement." },
        ]}
      />
    </div>
  );
}
