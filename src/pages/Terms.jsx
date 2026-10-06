import { Link } from "react-router-dom";
import Seo from "../components/layout/Seo";

export default function Terms() {
  return (
    <div className="mz-section max-w-4xl py-14">
      <Seo
        path="/terms"
        title="Terms & Conditions | MZ Smart Tools House"
        description="Terms governing use of MZ Smart Tools House tools, generated outputs, advertising and third-party services."
      />
      <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">Last updated: September 27, 2026</p>

      <div className="prose prose-navy mt-6 max-w-none text-navy-600 dark:text-navy-300">
        <p>
          These Terms govern your use of MZ Smart Tools House at mztoolshouse.com. By using the website, you agree to
          use it lawfully and in accordance with these Terms. If you do not agree, please stop using the website.
        </p>

        <h2>What the service provides</h2>
        <p>
          MZ Smart Tools House provides browser-based and, where clearly indicated, online-assisted tools for documents,
          PDFs, images, study, programming, calculations, science, engineering and everyday productivity. Features may
          be improved, replaced, limited or discontinued as the platform evolves.
        </p>

        <h2>Permitted use</h2>
        <p>You may use the tools for lawful personal, academic, professional and business productivity purposes.</p>
        <p>You must not use the website to:</p>
        <ul>
          <li>break applicable law or another person&apos;s rights;</li>
          <li>upload or process material you are not authorized to use;</li>
          <li>attempt to disrupt, overload, bypass or compromise the website or its security;</li>
          <li>misrepresent generated output as an official document, certification or professional determination when it is not one;</li>
          <li>use automated traffic, invalid clicks or other behavior intended to manipulate advertising or analytics.</li>
        </ul>

        <h2>Tool results and generated files</h2>
        <p>
          Tool outputs are provided for convenience and should be reviewed before use. Calculations, conversions,
          generated documents and file transformations can be affected by the data you provide, browser limitations,
          file structure, third-party libraries or institution-specific rules. Keep original copies of important files.
        </p>
        <p>
          MZ Smart Tools House does not guarantee that every output is suitable for a particular legal, financial,
          medical, academic, engineering or professional purpose. Where an official result or regulated decision is
          required, verify it with the relevant qualified professional, institution or authority.
        </p>

        <h2>Advertising</h2>
        <p>
          The site may display advertising through Google AdSense or other clearly identified advertising services.
          Advertising helps support free access to the platform. An advertisement is not an endorsement by MZ Smart Tools House, and users are not required to click an advertisement to access the normal operation of a tool.
        </p>
        <p>
          Do not intentionally generate invalid ad impressions or clicks. Advertising providers may apply their own
          terms, privacy practices and eligibility rules.
        </p>

        <h2>Third-party services and links</h2>
        <p>
          Some features, analytics, advertisements or links may involve third-party services. MZ Smart Tools House does
          not control third-party websites and is not responsible for their content, availability, policies or data
          practices. Review the third party&apos;s terms before using its service.
        </p>

        <h2>Intellectual property</h2>
        <p>
          The MZ Smart Tools House name, branding, original interface and original site content are protected by
          applicable intellectual-property rules. You retain responsibility for content and files you provide to tools
          and must have the rights needed to use them.
        </p>

        <h2>Availability and changes</h2>
        <p>
          We aim to keep the platform useful and available, but uninterrupted or error-free operation cannot be
          guaranteed. Maintenance, browser changes, service-provider changes, network failures or technical problems
          may temporarily affect individual features.
        </p>

        <h2>No warranty</h2>
        <p>
          The website and tools are provided on an &quot;as is&quot; and &quot;as available&quot; basis to the extent permitted by law.
          Use important outputs only after reviewing them for your intended purpose.
        </p>

        <h2>Privacy</h2>
        <p>
          Our handling of browser-based files, analytics, advertising and contact information is described in the
          <Link to="/privacy-policy"> Privacy Policy</Link>.
        </p>

        <h2>Changes to these Terms</h2>
        <p>
          These Terms may be updated when the platform or its services change. The revision date above identifies the
          current published version.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these Terms can be sent through the <Link to="/contact">Contact page</Link> or to
          {" "}<a href="mailto:mujtaba31202@gmail.com">mujtaba31202@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
