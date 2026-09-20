import { Calculator, Code2, FileText, Image as ImageIcon, Wrench } from "lucide-react";

export default function BrandMark({ compact = false, className = "" }) {
  return (
    <span className={`mz-brand-mark ${compact ? "is-compact" : ""} ${className}`} aria-hidden="true">
      <span className="mz-brand-orbit mz-brand-orbit-a"><FileText /></span>
      <span className="mz-brand-orbit mz-brand-orbit-b"><Calculator /></span>
      <span className="mz-brand-orbit mz-brand-orbit-c"><Code2 /></span>
      <span className="mz-brand-orbit mz-brand-orbit-d"><ImageIcon /></span>
      <span className="mz-brand-orbit mz-brand-orbit-e"><Wrench /></span>
      <span className="mz-brand-core">MZ</span>
    </span>
  );
}
