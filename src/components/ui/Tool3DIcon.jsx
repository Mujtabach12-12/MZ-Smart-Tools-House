import ToolIcon from "./ToolIcon";

const SPECIAL = {
  "gpa-calculator": ["GPA", "calculator"], "cgpa-calculator": ["CGPA", "graduation-cap"],
  "percentage-calculator": ["%", "percent"], "attendance-calculator": ["✓", "calendar-check"],
  "pdf-merger": ["MERGE", "file-plus"], "pdf-compressor": ["ZIP", "file-down"],
  "pdf-to-jpg": ["JPG", "image"], "jpg-to-pdf": ["PDF", "file-plus"],
  "image-compressor": ["ZIP", "image-down"], "json-formatter": ["{}", "braces"],
  "json-validator": ["✓", "check-circle"], "regex-tester": [".*", "regex"],
  "password-generator": ["•••", "key"], "pomodoro-timer": ["25", "timer"],
  "stopwatch": ["00", "timer"], "todo-list": ["✓", "list-checks"],
  "resume-builder": ["CV", "file-signature"], "assignment-cover-page-generator": ["A+", "file-signature"],
  "university-aggregate-calculator": ["%", "graduation-cap"],
  "smart-document-scanner": ["SCAN", "scan-line"],
};

function family(id = "") {
  if (id.startsWith("pdf-") || id.endsWith("-to-pdf")) return "pdf";
  if (id.includes("image") || id.includes("jpg-") || id.includes("png-") || id.includes("webp-")) return "image";
  if (id.includes("calculator") || id.includes("gpa") || id.includes("grade") || id.includes("percentage")) return "calc";
  if (id.includes("timer") || id === "stopwatch" || id === "todo-list") return "productivity";
  if (id.includes("resume") || id.includes("cover") || id.includes("application")) return "document";
  if (id.includes("json") || id.includes("base64") || id.includes("url-") || id.includes("regex") || id.includes("converter")) return "code";
  return "text";
}

export default function Tool3DIcon({ tool, size = "md" }) {
  const [label, icon] = SPECIAL[tool?.id] || ["", tool?.icon];
  return (
    <span className={`tool-3d-icon tool-3d-icon-${size} tool-3d-${family(tool?.id)}`}>
      <span className="tool-3d-icon-glow" />
      <span className="tool-3d-icon-face">
        <ToolIcon name={icon} className="h-6 w-6" />
        {label && <b>{label}</b>}
      </span>
      <span className="tool-3d-icon-edge" />
    </span>
  );
}
