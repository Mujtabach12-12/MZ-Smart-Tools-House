import Seo from "../components/layout/Seo";

export default function Terms() {
  return (
    <div className="mz-section max-w-3xl py-14">
      <Seo path="/terms" title="Terms & Conditions" description="Terms and conditions for using MZ Smart Tool House." />
      <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">Terms &amp; Conditions</h1>
      <div className="prose prose-navy mt-6 max-w-none text-navy-600 dark:text-navy-300">
        <p>
          By using MZ Smart Tool House, you agree to use the tools provided for lawful, personal or academic
          purposes. Tools are provided "as is", without warranty of any kind.
        </p>
        <p>
          We reserve the right to update, change or discontinue any tool at any time as the platform evolves.
        </p>
      </div>
    </div>
  );
}
