import Seo from "../components/layout/Seo";

export default function About() {
  return (
    <div className="mz-section max-w-3xl py-14">
      <Seo path="/about" title="About Us" description="Learn about MZ Smart Tool House and its browser-first tools for study, work and everyday productivity." />
      <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">About Us</h1>
      <div className="prose prose-navy mt-6 max-w-none text-navy-600 dark:text-navy-300">
        <p>
          MZ Smart Tool House was built with one goal: give students a single, trustworthy place to find the
          everyday calculators and utilities they need in one browser-first workspace, with local file processing used by the file tools that support it.
        </p>
        <p>
          The platform covers calculators, PDF tools, image tools, text tools, developer tools, student document
          tools, university tools and productivity tools, all organized in one consistent, easy-to-navigate design.
        </p>
        <p>
          Created and developed by <strong>Muhammad Mujtaba</strong>, MZ Smart Tool House is designed as a practical digital workspace for students, professionals and everyday productivity.
        </p>
        <p>
          We are actively building new tools in phases. If there's a tool you'd like to see, reach out on the
          Contact page.
        </p>
      </div>
    </div>
  );
}
