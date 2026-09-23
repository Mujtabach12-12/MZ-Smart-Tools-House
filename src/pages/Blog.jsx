import Seo from "../components/layout/Seo";

export default function Blog() {
  return (
    <div className="mz-section max-w-3xl py-14">
      <Seo path="/blog" title="Blog" description="Guides and articles for students — study tips, GPA explainers, and tool guides." robots="noindex,follow" />
      <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">Blog</h1>
      <p className="mt-4 text-navy-500 dark:text-navy-400">
        Articles and guides are coming soon — think "How CGPA is calculated", "How to compress a PDF without losing
        quality", and other genuinely useful, SEO-friendly content tied to our tools.
      </p>
    </div>
  );
}
