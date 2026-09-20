import Seo from "../components/layout/Seo";

export default function Disclaimer() {
  return (
    <div className="mz-section max-w-3xl py-14">
      <Seo path="/disclaimer" title="Disclaimer" description="Disclaimer for calculators and tools on MZ Smart Tool House." />
      <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">Disclaimer</h1>
      <div className="prose prose-navy mt-6 max-w-none text-navy-600 dark:text-navy-300">
        <p>
          Calculators (GPA, CGPA, aggregate, merit and similar tools) are provided for estimation and informational
          purposes only. Formulas can vary between institutions — always confirm official results with your
          university or board.
        </p>
        <p>
          MZ Smart Tool House is not affiliated with any specific university or examination board unless explicitly stated.
        </p>
      </div>
    </div>
  );
}
