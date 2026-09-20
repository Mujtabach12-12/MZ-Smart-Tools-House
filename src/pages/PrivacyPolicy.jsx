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
        <h2>Analytics &amp; Advertising</h2>
        <p>
          As the platform grows, we may use privacy-conscious analytics and, in the future, display advertising
          (such as Google AdSense) to keep every tool free. Any such service will have its own data practices, which
          we will disclose here before it goes live.
        </p>
        <h2>Contact</h2>
        <p>Questions about this policy can be sent via the Contact page.</p>
      </div>
    </div>
  );
}
