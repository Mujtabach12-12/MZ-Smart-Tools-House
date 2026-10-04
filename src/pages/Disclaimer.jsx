import { Link } from "react-router-dom";
import Seo from "../components/layout/Seo";

export default function Disclaimer() {
  return (
    <div className="mz-section max-w-4xl py-14">
      <Seo
        path="/disclaimer"
        title="Disclaimer | MZ Smart Tools House"
        description="Important limitations and verification guidance for calculators, documents, coding, finance, health and other MZ Smart Tools House tools."
      />
      <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">Disclaimer</h1>
      <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">Last updated: September 27, 2026</p>

      <div className="prose prose-navy mt-6 max-w-none text-navy-600 dark:text-navy-300">
        <p>
          MZ Smart Tools House provides productivity tools and information for convenience. Results should be checked
          before they are used for an important decision, submission, payment, diagnosis, design, deployment or other
          consequential purpose.
        </p>

        <h2>Academic calculators</h2>
        <p>
          GPA, CGPA, marks, merit, attendance and similar results are estimates unless a tool explicitly states that it
          is using a verified current institutional policy. Universities, boards and programs can use different rules.
          Confirm official results with the relevant institution.
        </p>

        <h2>Finance and business tools</h2>
        <p>
          Loan, EMI, savings, salary, percentage and finance calculators provide mathematical estimates and are not
          financial, tax, investment or lending advice. Real products may include fees, taxes, insurance, eligibility
          rules, changing rates or contractual terms not represented by a calculator.
        </p>

        <h2>Health and nutrition tools</h2>
        <p>
          Health, BMI, calorie, nutrition or related calculators provide general informational estimates and are not a
          diagnosis, treatment plan or substitute for advice from a qualified healthcare professional.
        </p>

        <h2>Engineering, science and programming tools</h2>
        <p>
          Formulas, code output, conversions and technical calculations should be independently verified before use in
          safety-critical, production, laboratory or regulated work. Browser and third-party-library limitations can
          affect results.
        </p>

        <h2>Documents, PDFs and generated files</h2>
        <p>
          Generated or converted files should be opened and reviewed before submission or distribution. Formatting can
          vary between browsers, PDF readers, office applications and source documents. Keep an original copy of
          important files.
        </p>

        <h2>Third-party advertising and links</h2>
        <p>
          Advertisements displayed through Google AdSense or other third-party services are provided by those
          advertising services. Their presence does not mean MZ Smart Tools House endorses the advertiser, product or
          claim. Exercise your own judgment before purchasing or relying on a third-party offer.
        </p>

        <h2>No institutional affiliation</h2>
        <p>
          MZ Smart Tools House is not affiliated with a university, examination board, government authority, financial
          institution, healthcare provider or advertiser unless a specific page clearly states otherwise.
        </p>

        <h2>Questions</h2>
        <p>
          For a question about a tool or this disclaimer, use the <Link to="/contact">Contact page</Link>.
        </p>
      </div>
    </div>
  );
}
