import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { computeMarks } from "../../lib/calculators/marks";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";
import { trackEvent } from "../../lib/analytics";

const emptyRow = () => ({ id: crypto.randomUUID(), obtained: "", total: "100" });

export default function MarksCalculator() {
  const [subjects, setSubjects] = useState([emptyRow(), emptyRow()]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function update(id, field, value) {
    setSubjects((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }
  function addRow() { setSubjects((rows) => [...rows, emptyRow()]); }
  function removeRow(id) { setSubjects((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows)); }

  function handleCalculate() {
    try {
      setError("");
      const next = computeMarks(subjects);
      setResult(next);
      trackEvent("calculator_complete", { tool_id: "marks-calculator", subject_count: subjects.length });
    } catch (err) {
      setResult(null);
      setError(err.message);
      trackEvent("calculator_validation_error", { tool_id: "marks-calculator" });
    }
  }

  function handleReset() {
    setSubjects([emptyRow(), emptyRow()]);
    setResult(null);
    setError("");
    trackEvent("calculator_reset", { tool_id: "marks-calculator" });
  }

  return (
    <div className="mz-card p-5 sm:p-6">
      <div className="space-y-3">
        {subjects.map((row, index) => (
          <div key={row.id} className="rounded-xl border border-navy-100 p-3 dark:border-navy-800">
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
                Subject {index + 1} — Obtained
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={row.obtained}
                  onChange={(e) => update(row.id, "obtained", e.target.value)}
                  placeholder="85"
                  className="mz-input mt-2"
                />
              </label>
              <label className="text-sm font-medium text-navy-700 dark:text-navy-200">
                Subject {index + 1} — Maximum
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={row.total}
                  onChange={(e) => update(row.id, "total", e.target.value)}
                  placeholder="100"
                  className="mz-input mt-2"
                />
              </label>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                aria-label={`Remove subject ${index + 1}`}
                disabled={subjects.length <= 1}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-navy-200 px-3 text-sm text-navy-500 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-navy-700"
              >
                <Trash2 className="h-4 w-4" /> <span className="sm:hidden">Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={addRow} className="mz-btn-secondary mt-4">
        <Plus className="h-4 w-4" /> Add Subject
      </button>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary">Calculate</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3" aria-live="polite">
        <ErrorMessage message={error} />
        {result && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ResultStat label="Total Obtained" value={result.totalObtained} />
            <ResultStat label="Total Marks" value={result.totalMax} />
            <ResultStat label="Average Marks" value={result.average} />
            <ResultStat label="Overall Percentage" value={`${result.percentage}%`} highlight />
          </div>
        )}
      </div>

      <ToolExtras
        toolId="marks-calculator"
        category="calculators"
        howTo={[
          "Enter obtained marks and maximum marks for each subject.",
          "Add or remove subject rows as needed.",
          "Calculate to see total obtained marks, total maximum marks, average obtained marks per subject, and overall percentage.",
        ]}
        faq={[
          { q: "Can subjects have different maximum marks?", a: "Yes. Overall percentage is based on total obtained marks divided by total maximum marks, so each subject can have a different maximum." },
          { q: "What does Average Marks mean?", a: "Average Marks is the sum of obtained marks divided by the number of entered subjects. Overall percentage is calculated separately using total maximum marks." },
        ]}
      />
    </div>
  );
}
