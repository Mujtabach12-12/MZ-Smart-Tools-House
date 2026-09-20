import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { getPopularTools } from "../../data/tools";
import ToolCard from "../ui/ToolCard";

export default function PopularTools() {
  const list = getPopularTools().filter(t => t.status === "active").slice(0, 8);
  return (
    <section className="mz-section py-16 sm:py-20">
      <div className="mz-section-heading">
        <div><span className="mz-eyebrow"><Sparkles className="h-3 w-3" /> Featured</span><h2 className="mt-2">Start with tools people actually need.</h2><p>Real tools from the registry, presented as focused workspaces instead of a wall of links.</p></div>
        <Link to="/tools?popular=true" className="mz-btn-secondary hidden sm:inline-flex">View popular <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((tool, i) => <ToolCard key={tool.id} tool={tool} featured={i < 2} />)}
      </div>
      <Link to="/tools?popular=true" className="mz-btn-secondary mt-5 sm:hidden">View popular tools <ArrowRight className="h-4 w-4" /></Link>
    </section>
  );
}
