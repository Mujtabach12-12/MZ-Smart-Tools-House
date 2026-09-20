import { useState } from "react";
import { computeAverage } from "../../lib/calculators/average";
import ResultStat from "../../components/tools/ResultStat";
import ErrorMessage from "../../components/tools/ErrorMessage";
import ToolExtras from "../../components/tools/ToolExtras";

export default function AverageCalculator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    try {
      setError("");
      const numbers = input
        .split(/[,\s\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (numbers.length === 0) throw new Error("Enter at least one number, separated by commas or spaces.");
      setResult(computeAverage(numbers));
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }
  function handleReset() { setInput(""); setResult(null); setError(""); }

  return (
    <div className="mz-card p-6">
      <label className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Numbers</label>
      <textarea
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="mz-input"
        placeholder="e.g. 12, 45, 78, 90 or one per line"
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={handleCalculate} className="mz-btn-primary">Calculate Average</button>
        <button type="button" onClick={handleReset} className="mz-btn-secondary">Reset</button>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorMessage message={error} />
        {result && (
          <div className="grid gap-3 sm:grid-cols-4">
            <ResultStat label="Average" value={result.average} highlight />
            <ResultStat label="Sum" value={result.sum} />
            <ResultStat label="Count" value={result.count} />
            <ResultStat label="Min / Max" value={`${result.min} / ${result.max}`} />
          </div>
        )}
      </div>

      <ToolExtras
        toolId="average-calculator"
        category="calculators"
        howTo={[
          "Type or paste your numbers, separated by commas, spaces or new lines.",
          "Click Calculate Average to see the mean, sum, count, minimum and maximum.",
        ]}
        faq={[
          { q: "How should I separate numbers?", a: "Commas, spaces, or new lines all work — you can even paste a column copied from a spreadsheet." },
          { q: "What happens if I include a non-number?", a: "The tool will show an error telling you exactly which entry isn't a valid number." },
        ]}
      />
    </div>
  );
}
