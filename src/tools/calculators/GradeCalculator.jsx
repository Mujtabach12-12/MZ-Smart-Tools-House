import { useState } from "react";
import { percentageToGrade, DEFAULT_GRADE_SCALE } from "../../lib/calculators/grade";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function GradeCalculator() {
  const [percentage, setPercentage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      setResult(percentageToGrade(percentage));
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }
  function handleReset() { setPercentage(""); setResult(null); setError(""); }

  return (
    <div className="mz-card p-6">
      <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Percentage (0-100)</label>
      <input
        type="number" min="0" max="100" value={percentage}
        onChange={(e) => setPercentage(e.target.value)}
        className="mz-input max-w-xs" placeholder="e.g. 78"
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary">Get Grade</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {result && <ResultStat label="Letter Grade" value={result} highlight />}
      </div>

      <div className="mt-8 overflow-x-auto">
        <h3 className="mb-2 text-sm font-semibold text-navy-900 dark:text-navy-50">Grading Scale Used</h3>
        <table className="w-full min-w-[300px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-navy-400 dark:border-navy-800 dark:text-navy-500">
              <th className="py-2 font-medium">Percentage Range</th>
              <th className="py-2 font-medium">Grade</th>
            </tr>
          </thead>
          <tbody>
            {DEFAULT_GRADE_SCALE.map((band) => (
              <tr key={band.grade} className="border-b border-navy-50 dark:border-navy-900">
                <td className="py-1.5 text-navy-600 dark:text-navy-300">{band.min}% – {band.max}%</td>
                <td className="py-1.5 font-medium text-navy-900 dark:text-navy-50">{band.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ToolExtras
        toolId="grade-calculator"
        category="calculators"
        howTo={[
          "Enter your percentage score.",
          "Click \"Get Grade\" to see the corresponding letter grade.",
        ]}
        faq={[
          { q: "Does this match my university's exact grading table?", a: "It uses a common percentage-to-grade table shown above. Institutions vary, so always confirm official grades with your university." },
        ]}
      />
    </div>
  );
}
