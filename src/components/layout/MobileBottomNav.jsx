import { useEffect, useState } from "react";
import { CheckCircle2, Download, FileText, Grid2X2, Home, Wrench } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/tools", label: "Tools", icon: Wrench },
  { to: "/office", label: "Office", icon: FileText },
  { to: "/categories", label: "More", icon: Grid2X2 },
];

export default function MobileBottomNav() {
  const [pwa, setPwa] = useState({ installed: false, available: false });

  useEffect(() => {
    const onState = (event) => setPwa((value) => ({ ...value, ...(event.detail || {}) }));
    window.addEventListener("mz-pwa-state", onState);
    return () => window.removeEventListener("mz-pwa-state", onState);
  }, []);

  const install = () => window.dispatchEvent(new Event("mz-pwa-install-request"));
  const InstallIcon = pwa.installed ? CheckCircle2 : Download;

  return (
    <nav className="mz-mobile-bottom-nav md:hidden" aria-label="Mobile app navigation">
      {navItems.slice(0, 3).map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `mz-mobile-bottom-link ${isActive ? "is-active" : ""}`}>
          <Icon className="h-[19px] w-[19px]" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
      <button type="button" onClick={install} className={`mz-mobile-bottom-link mz-mobile-install-nav ${pwa.installed ? "is-installed" : ""}`} aria-label={pwa.installed ? "App installed" : "Install app"}>
        <InstallIcon className="h-[19px] w-[19px]" aria-hidden="true" />
        <span>{pwa.installed ? "Installed" : "Install"}</span>
      </button>
      {navItems.slice(3).map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `mz-mobile-bottom-link ${isActive ? "is-active" : ""}`}>
          <Icon className="h-[19px] w-[19px]" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
