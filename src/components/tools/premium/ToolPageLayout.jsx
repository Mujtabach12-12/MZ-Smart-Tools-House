import ToolHero from "./ToolHero";
export default function ToolPageLayout({ tool, children }) {
 const wide = tool.category === "office-tools" || tool.category === "programming-tools" || tool.category === "scanner-tools";
 return <div className={wide ? "mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-6 sm:py-10 lg:px-8" : "mz-section py-8 sm:py-12"}><ToolHero tool={tool} compact={wide}/>{children}</div>;
}
