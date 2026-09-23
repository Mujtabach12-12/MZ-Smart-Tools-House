import Seo from "../components/layout/Seo";

export default function PrivacyPolicy() {
  return (
    <div className="mz-section max-w-3xl py-14">
      <Seo path="/privacy-policy" title="Privacy Policy" description="How MZ Smart Tool House handles your data and files." />
      <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">Privacy Policy</h1>
      <div className="prose prose-navy mt-6 max-w-none text-navy-600 dark:text-navy-300">
        <p>Last updated: {new Date().getFullYear()}</p>
        <h2>File Processing</h2>
        <p>
          Wherever technically possible, MZ Smart Tool House processes files (PDFs, images, documents) directly in your
          browser using client-side JavaScript. These files are not uploaded to, or stored on, our servers.
        </p>
        <h2>Analytics</h2>
        <p>
          MZ Smart Tool House uses Google Analytics 4 to understand aggregate website usage such as page visits,
          navigation and device/browser information. Google Analytics is configured for the website using measurement
          ID G-1LKZ5FMH6R. It is not used to upload the documents, images or PDFs you process in browser-based tools.
          Google may process analytics data under its own privacy terms.
        </p>
        <h2>Advertising</h2>
        <p>
          If advertising is introduced in the future, this policy will be updated to describe the relevant service and
          data practices before it is treated as part of the production experience.
        </p>
        <h2>Contact</h2>
        <p>Questions about this policy can be sent via the Contact page.</p>
      </div>
    </div>
  );
}
