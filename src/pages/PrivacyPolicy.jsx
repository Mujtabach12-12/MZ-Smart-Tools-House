import { Link } from "react-router-dom";
import Seo from "../components/layout/Seo";

export default function PrivacyPolicy() {
  return (
    <div className="mz-section max-w-4xl py-14">
      <Seo
        path="/privacy-policy"
        title="Privacy Policy"
        description="Privacy, cookies, advertising, analytics and browser-based file processing practices for MZ Smart Tool House."
      />
      <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">Privacy Policy</h1>
      <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">Last updated: September 27, 2026</p>

      <div className="prose prose-navy mt-6 max-w-none text-navy-600 dark:text-navy-300">
        <p>
          MZ Smart Tool House is a browser-first productivity platform created and developed by Muhammad Mujtaba.
          This policy explains what information may be processed when you use mztoolshouse.com, including our use of
          browser-based tools, analytics, advertising and contact features.
        </p>

        <h2>Browser-based file processing</h2>
        <p>
          Many PDF, image, document, calculator and utility tools are designed to process data directly in your
          browser. When a tool is described as browser-based or local, the working file or text is not intentionally
          uploaded to an MZ Smart Tool House server for that processing step. Some features may require an online
          service or browser capability; those features should be presented according to their actual behavior rather
          than as local processing.
        </p>
        <p>
          You are responsible for keeping your original files and reviewing generated outputs before relying on them.
          Avoid submitting confidential information to any online feature unless you are comfortable with the service
          involved and its privacy terms.
        </p>

        <h2>Google Analytics</h2>
        <p>
          We use Google Analytics 4 (measurement ID <strong>G-1LKZ5FMH6R</strong>) to understand aggregate website
          usage such as page visits, navigation patterns, device/browser information and general traffic sources. Our
          analytics implementation is not intended to send the contents of documents, images, PDFs, source code,
          passwords, CV text or personal contact details that you enter into tools.
        </p>
        <p>
          Google may process analytics information in accordance with its own privacy terms. You can learn more from
          the <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google Privacy Policy</a>.
        </p>

        <h2>Google AdSense and advertising</h2>
        <p>
          MZ Smart Tool House uses Google AdSense to display advertising. Google and its advertising partners may use
          cookies, local storage or similar technologies to serve, measure and improve ads, including personalized ads
          where permitted and where the necessary choices or consent apply.
        </p>
        <p>
          Third-party vendors, including Google, may use cookies to serve ads based on a user&apos;s prior visits to this
          website or other websites. Google&apos;s use of advertising cookies enables it and its partners to serve ads based
          on visits to this site and/or other sites on the internet. Where available, users can review or manage Google
          advertising personalization in <a href="https://myadcenter.google.com/" target="_blank" rel="noreferrer">My Ad Center</a>.
        </p>
        <p>
          Advertising does not unlock core MZ Smart Tool House features, and users are not required to click an ad to
          calculate, convert, create, copy, download, scan, edit or otherwise use a tool. Ad placement is intended to
          remain separate from primary tool controls.
        </p>

        <h2>Cookies and similar technologies</h2>
        <p>
          Cookies and similar browser technologies may be used for analytics, advertising, security, preferences or
          functionality. Some third-party services may set or read their own identifiers. If a consent message is
          presented for your region, the choices shown there control the applicable advertising or analytics consent
          signals for that visit.
        </p>
        <p>
          You can also manage cookies through your browser settings. Blocking cookies or advertising scripts may change
          some measurements or ad behavior, but the site is designed so that core browser-based tools are not dependent
          on clicking advertisements.
        </p>

        <h2>Contact and feedback information</h2>
        <p>
          If you contact us or submit a feedback form, the information you choose to provide (such as your name, email
          address and message) is used to respond to your enquiry, investigate a bug or consider a tool request. Do not
          include passwords, payment credentials or unnecessary sensitive personal information in messages.
        </p>

        <h2>Third-party services and links</h2>
        <p>
          The website may link to or use third-party services such as Google Analytics, Google AdSense or external
          resources. Those services operate under their own terms and privacy policies. A link to another site does not
          mean MZ Smart Tool House controls that site&apos;s data practices.
        </p>

        <h2>Data security and retention</h2>
        <p>
          We aim to minimize unnecessary collection of user content and to keep browser-first processing local where
          practical. No internet service can guarantee absolute security. Information submitted through a contact or
          third-party service may be retained according to the needs of that service and the purpose for which it was
          submitted.
        </p>

        <h2>Children&apos;s privacy</h2>
        <p>
          MZ Smart Tool House is a general productivity website and is not intentionally designed to collect personal
          information from young children. If you believe a child has submitted personal information through a contact
          feature, please contact us so the issue can be reviewed.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy when the platform, advertising, analytics or data practices change. The date shown
          at the top identifies the most recent published revision.
        </p>

        <h2>Contact</h2>
        <p>
          Privacy questions can be sent through the <Link to="/contact">Contact page</Link> or by email at
          {" "}<a href="mailto:mujtaba31202@gmail.com">mujtaba31202@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
