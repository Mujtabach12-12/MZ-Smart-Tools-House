import { FileText, Grid2X2, Home, ScanLine, Wrench } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/tools", label: "Tools", icon: Wrench },
  { to: "/tools/smart-document-scanner", label: "Scan", icon: ScanLine, featured: true },
  { to: "/office", label: "Office", icon: FileText },
  { to: "/categories", label: "More", icon: Grid2X2 },
];

export default function MobileBottomNav() {
  return (
    <nav className="mz-mobile-bottom-nav md:hidden" aria-label="Mobile app navigation">
      {navItems.map(({ to, label, icon: Icon, end, featured }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `mz-mobile-bottom-link ${featured ? "is-featured" : ""} ${isActive ? "is-active" : ""}`}
        >
          <span className="mz-mobile-nav-icon"><Icon aria-hidden="true" /></span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
