import { useMemo, useState } from "react";
import { percentageToGrade, CUSTOM_EXAMPLE_GRADE_SCALE } from "../../lib/calculators/grade";
import { gradeForMarks } from "../../lib/calculators/universityGpa";
import { verifiedUniversities } from "../../data/universities/policies";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";
import { trackEvent } from "../../lib/analytics";

const customRows = () => CUSTOM_EXAMPLE_GRADE_SCALE.map((band, index) => ({
  id: `custom-${index}`,
  min: String(band.min),
  max: String(band.max),
  grade: band.grade,
}));

export default function GradeCalculator() {
  const [percentage, setPercentage] = useState("");
  const [scaleMode, setScaleMode] = useState("");
  const [bands, setBands] = useState(customRows);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const eligiblePolicies = useMemo(
    () => verifiedUniversities.filter((policy) => policy.grades?.every((grade) => grade.minPercentage != null && grade.maxPercentage != null)),
    []
  );

  function customScale() {
    return bands.map((band, index) => {
      const min = Number(band.min);
      const max = Number(band.max);
      const grade = String(band.grade || "").trim().toUpperCase();
      if (!grade) throw new Error(`Custom row ${index + 1}: enter a grade label.`);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max > 100 || min > max) {
        throw new Error(`Custom row ${index + 1}: enter a valid percentage range between 0 and 100.`);
      }
      return { min, max, grade };
    });
  }

  function handleCalculate() {
    try {
      setError("");
      if (!scaleMode) throw new Error("Choose a verified university scale or the custom manual scale before calculating.");

      let grade;
      if (scaleMode === "custom") {
        grade = percentageToGrade(percentage, customScale());
      } else {
        const policy = eligiblePolicies.find((item) => item.id === scaleMode);
        if (!policy) throw new Error("The selected university grading policy is not verified for marks-to-grade conversion.");
        grade = gradeForMarks(policy, percentage).letter;
      }

      setResult(grade);
      trackEvent("calculator_complete", { tool_id: "grade-calculator", scale_mode: scaleMode === "custom" ? "custom" : "verified_university" });
    } catch (err) {
      setResult(null);
      setError(err.message);
      trackEvent("calculator_validation_error", { tool_id: "grade-calculator" });
    }
  }

  function handleReset() {
    setPercentage("");
    setScaleMode("");
    setBands(customRows());
    setResult(null);
    setError("");
    trackEvent("calculator_reset", { tool_id: "grade-calculator" });
  }

  return (
    <div className="mz-card p-5 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          Percentage (0–100)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max="100"
            step="0.01"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            className="mz-input mt-2"
            placeholder="e.g. 78"
          />
        </label>

        <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
          Grading scale
          <select className="mz-input mt-2" value={scaleMode} onChange={(e) => { setScaleMode(e.target.value); setResult(null); setError(""); }}>
            <option value="">Choose a scale</option>
            <option value="custom">Custom manual scale — not official</option>
            {eligiblePolicies.map((policy) => <option key={policy.id} value={policy.id}>{policy.name} — verified</option>)}
          </select>
        </label>
      </div>

      {!eligiblePolicies.length && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          <strong>No university policy is currently promoted as verified in this audited build.</strong> Use the custom scale only after checking your institution's official grade boundaries.
        </div>
      )}

      {scaleMode === "custom" && (
        <div className="mt-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
            <strong>Custom / manual scale.</strong> The starting rows below are examples for editing convenience. They are not presented as an official university policy.
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead><tr className="border-b border-navy-100 dark:border-navy-800"><th className="py-2 pr-2">Min %</th><th className="py-2 pr-2">Max %</th><th className="py-2">Grade</th></tr></thead>
              <tbody>
                {bands.map((band, index) => (
                  <tr key={band.id} className="border-b border-navy-50 dark:border-navy-900">
                    <td className="py-2 pr-2"><input aria-label={`Minimum percentage row ${index + 1}`} className="mz-input" type="number" inputMode="decimal" min="0" max="100" step="0.01" value={band.min} onChange={(e) => setBands((rows) => rows.map((row) => row.id === band.id ? { ...row, min: e.target.value } : row))} /></td>
                    <td className="py-2 pr-2"><input aria-label={`Maximum percentage row ${index + 1}`} className="mz-input" type="number" inputMode="decimal" min="0" max="100" step="0.01" value={band.max} onChange={(e) => setBands((rows) => rows.map((row) => row.id === band.id ? { ...row, max: e.target.value } : row))} /></td>
                    <td className="py-2"><input aria-label={`Grade label row ${index + 1}`} className="mz-input" value={band.grade} onChange={(e) => setBands((rows) => rows.map((row) => row.id === band.id ? { ...row, grade: e.target.value } : row))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary">Get Grade</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite">
        <ErrorMessage message={error} />
        {result && <ResultStat label="Letter Grade" value={result} highlight />}
      </div>

      <ToolExtras
        toolId="grade-calculator"
        category="calculators"
        howTo={[
          "Enter your percentage score.",
          "Choose an explicitly verified university policy when available, or select Custom manual scale and enter your own official boundaries.",
          "Calculate the grade. MZ never silently substitutes a generic university policy.",
        ]}
        faq={[
          { q: "Does this use one universal university grading table?", a: "No. University policies differ. Official-university conversion is enabled only for explicitly verified policies; custom mode is clearly user-defined." },
        ]}
      />
    </div>
  );
}
