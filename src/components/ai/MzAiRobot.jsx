import { Bot, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const FALLBACK_TASKS = ["Ready to help", "Keeping tools responsive", "Watching workspace quality"];

function cleanLabel(value = "") {
  return String(value).replace(/\s+/g, " ").trim().replace(/[.…]+$/g, "").slice(0, 54);
}

function readPageName() {
  const heading = document.querySelector("main h1, [data-tool-title], .mz-page-title");
  const headingText = cleanLabel(heading?.textContent || "");
  if (headingText) return headingText;
  const titleText = cleanLabel((document.title || "").split(/[|—]/)[0]);
  return titleText || "MZ Smart Tools House";
}

function describeInteraction(target) {
  if (!(target instanceof Element)) return "";
  const control = target.closest("button, a, summary, input, textarea, select, [role='button']");
  if (!control) return "";

  const tag = control.tagName.toLowerCase();
  const type = (control.getAttribute("type") || "").toLowerCase();
  if (tag === "input" && ["password", "email", "tel"].includes(type)) return "Editing input";

  const explicit = cleanLabel(
    control.getAttribute("aria-label") ||
    control.getAttribute("title") ||
    control.getAttribute("placeholder") ||
    control.textContent ||
    ""
  );
  if (!explicit) return "";

  if (tag === "button" || control.getAttribute("role") === "button") return `Using ${explicit}`;
  if (tag === "a") return `Opening ${explicit}`;
  if (tag === "summary") return `Viewing ${explicit}`;
  if (tag === "select") return `Choosing ${explicit}`;
  return `Editing ${explicit}`;
}

export default function MzAiRobot({ compact = false, loading = false, label }) {
  const { pathname } = useLocation();
  const [pageName, setPageName] = useState("");
  const [liveAction, setLiveAction] = useState("");
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [processingAction, setProcessingAction] = useState("");

  useEffect(() => {
    const refresh = () => setPageName(readPageName());
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    const timer = window.setTimeout(refresh, 50);
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, [pathname]);

  useEffect(() => {
    let clearTimer;
    const announce = (event) => {
      const next = describeInteraction(event.target);
      if (!next) return;
      setLiveAction(next);
      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => setLiveAction(""), 3600);
    };
    document.addEventListener("pointerdown", announce, true);
    document.addEventListener("focusin", announce, true);
    document.addEventListener("change", announce, true);
    return () => {
      document.removeEventListener("pointerdown", announce, true);
      document.removeEventListener("focusin", announce, true);
      document.removeEventListener("change", announce, true);
      window.clearTimeout(clearTimer);
    };
  }, []);


  useEffect(() => {
    const readProcessing = () => {
      const candidates = [...document.querySelectorAll('[role="status"], [aria-busy="true"], .mz-tool-loading, .mz-pdf-page-loading')];
      const visible = candidates.find((node) => {
        const style = window.getComputedStyle(node);
        return style.display !== "none" && style.visibility !== "hidden" && node.getClientRects().length;
      });
      setProcessingAction(cleanLabel(visible?.textContent || ""));
    };
    readProcessing();
    const observer = new MutationObserver(readProcessing);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-busy", "class"] });
    return () => observer.disconnect();
  }, [pathname]);
  useEffect(() => {
    const timer = window.setInterval(() => setFallbackIndex((value) => (value + 1) % FALLBACK_TASKS.length), 4200);
    return () => window.clearInterval(timer);
  }, []);

  const task = useMemo(() => {
    if (label) return cleanLabel(label);
    if (processingAction) return processingAction;
    if (liveAction) return liveAction;
    if (loading) return pageName ? `Processing ${pageName}` : "Processing current task";
    if (pageName && pageName !== "MZ Smart Tools House") return `Working on ${pageName}`;
    return FALLBACK_TASKS[fallbackIndex];
  }, [fallbackIndex, label, liveAction, loading, pageName, processingAction]);

  return <div className={`mz-ai-robot ${compact ? "is-compact" : ""} ${loading ? "is-loading" : ""}`} aria-label={`MZ AI: ${task}`}>
    <div className="mz-ai-robot-orbit"><i/><i/><i/></div>
    <div className="mz-ai-robot-head">
      <span className="mz-ai-antenna"><i /></span>
      <div className="mz-ai-face"><span className="mz-ai-eye"/><span className="mz-ai-eye"/><span className="mz-ai-mouth"/></div>
      <span className="mz-ai-ear left"/><span className="mz-ai-ear right"/>
    </div>
    <div className="mz-ai-body"><Bot className="h-4 w-4"/><strong>MZ AI</strong><Sparkles className="h-3 w-3"/></div>
    {!compact ? <div className="mz-ai-task" title={task}><span className="mz-ai-dot"/>{task}</div> : null}
  </div>;
}
