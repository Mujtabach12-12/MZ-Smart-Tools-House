import { Link } from "react-router-dom";
import { categories } from "../../data/categories";
import { getActiveToolsByCategory } from "../../data/tools";
import ToolIcon from "../ui/ToolIcon";

export default function CategoryRail() {
  return (
    <section className="mz-section -mt-7 relative z-20" aria-label="Browse categories">
      <div className="mz-category-rail">
        <Link to="/tools" className="mz-rail-tab mz-rail-tab-active">All tools</Link>
        {categories.map((cat) => (
          <Link key={cat.slug} to={cat.route || `/categories/${cat.slug}`} className="mz-rail-tab">
            <ToolIcon name={cat.icon} className="h-4 w-4" /> {cat.name}
            <span>{getActiveToolsByCategory(cat.slug).length}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
