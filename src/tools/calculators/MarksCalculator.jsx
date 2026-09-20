import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { computeMarks } from "../../lib/calculators/marks";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

const emptyRow = () => ({ id: crypto.randomUUID(), obtained: "", total: "100" });

export default function MarksCalculator() {
  const [subjects, setSubjects] = useState([emptyRow(), emptyRow()]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function update(id, field, value) {
    setSubjects((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function addRow() { setSubjects((rows) => [...rows, emptyRow()]); }
  function removeRow(id) { setSubjects((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows)); }

  function handleCalculate() {
    try {
      setError("");
      setResult(computeMarks(subjects));
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }
  function handleReset() {
    setSubjects([emptyRow(), emptyRow()]);
    setResult(null);
    setError("");
  }

  return (
    <div className="mz-card p-6">
      <div className="grid grid-cols-[2fr_2fr_auto] gap-2 text-xs font-medium text-navy-400 dark:text-navy-500">
        <span>Obtained Marks</span>
        <span>Total Marks</span>
        <span></span>
      </div>
      <div className="mt-2 space-y-3">
        {subjects.map((row, i) => (
          <div key={row.id} className="grid grid-cols-[2fr_2fr_auto] items-center gap-2">
            <input
              type="number" min="0" value={row.obtained}
              onChange={(e) => update(row.id, "obtained", e.target.value)}
              placeholder={`Subject ${i + 1} obtained`}
              aria-label={`Obtained marks for subject ${i + 1}`}
              className="mz-input"
            />
            <input
              type="number" min="0" value={row.total}
              onChange={(e) => update(row.id, "total", e.target.value)}
              placeholder="Total"
              aria-label={`Total marks for subject ${i + 1}`}
              className="mz-input"
            />
            <button type="button" onClick={() => removeRow(row.id)} aria-label="Remove subject"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-navy-200 text-navy-400 transition hover:border-red-300 hover:text-red-600 dark:border-navy-700">
              <Trash2 className="h-4 w-4" />
            </button>
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

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {result && (
          <div className="grid gap-3 sm:grid-cols-3">
            <ResultStat label="Total Obtained" value={result.totalObtained} />
            <ResultStat label="Total Marks" value={result.totalMax} />
            <ResultStat label="Percentage" value={`${result.percentage}%`} highlight />
          </div>
        )}
      </div>

      <ToolExtras
        toolId="marks-calculator"
        category="calculators"
        howTo={[
          "Enter the marks you obtained and the total marks for each subject.",
          "Add a row for every subject.",
          "Click Calculate for your total, and overall percentage.",
        ]}
        faq={[
          { q: "Can subjects have different total marks?", a: "Yes — each subject can have its own total (e.g. 50, 100), the calculator sums them correctly." },
          { q: "What if I only have one subject?", a: "That's fine — remove the extra row and enter just one." },
        ]}
      />
    </div>
  );
}
