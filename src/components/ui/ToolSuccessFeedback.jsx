import { useEffect, useRef, useState } from "react";
import { MessageCircle, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { feedbackDeviceLabel, submitFeedback } from "../../lib/feedback";

const SESSION_KEY = "mz-tool-feedback-asked-v1";

function readAsked() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}"); } catch { return {}; }
}
function markAsked(toolId) {
  try {
    const next = { ...readAsked(), [toolId]: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {}
}

export default function ToolSuccessFeedback({ tool }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);

  useEffect(() => {
    setOpen(false);
    setStatus("idle");
    const onSuccess = () => {
      if (!tool?.id || readAsked()[tool.id]) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setOpen(true), 650);
    };
    window.addEventListener("mz-tool-success", onSuccess);
    return () => {
      window.removeEventListener("mz-tool-success", onSuccess);
      window.clearTimeout(timer.current);
    };
  }, [tool?.id]);

  if (!open || !tool) return null;

  const close = () => {
    markAsked(tool.id);
    setOpen(false);
  };

  const react = async (reaction) => {
    markAsked(tool.id);
    setStatus("sending");
    const payload = {
      id: crypto.randomUUID?.() || String(Date.now()),
      name: "",
      email: "",
      category: "Tool Reaction",
      rating: reaction === "helpful" ? "5" : "2",
      reaction,
      tool: tool.id,
      message: reaction === "helpful" ? `Quick reaction: ${tool.name} was helpful.` : `Quick reaction: ${tool.name} needs improvement.`,
      page: window.location.pathname + window.location.search,
      device: feedbackDeviceLabel(),
      createdAt: new Date().toISOString(),
    };
    const result = await submitFeedback(payload);
    setStatus(result.status === "sent" ? "sent" : "saved");
    window.setTimeout(() => setOpen(false), 1200);
  };

  return (
    <aside className="mz-success-feedback" aria-live="polite" aria-label={`Optional feedback for ${tool.name}`}>
      <button type="button" className="mz-success-feedback-close" onClick={close} aria-label="Dismiss feedback"><X /></button>
      {status === "sent" || status === "saved" ? (
        <div className="mz-success-feedback-thanks"><strong>Thank you!</strong><span>{status === "sent" ? "Your reaction was received." : "Your reaction was saved and can sync later."}</span></div>
      ) : (
        <>
          <div><strong>How was {tool.name}?</strong><span>Optional — one tap helps us improve MZ.</span></div>
          <div className="mz-success-feedback-actions">
            <button type="button" onClick={() => react("helpful")} disabled={status === "sending"}><ThumbsUp /> Helpful</button>
            <button type="button" onClick={() => react("needs-improvement")} disabled={status === "sending"}><ThumbsDown /> Needs work</button>
            <button type="button" onClick={() => { close(); window.dispatchEvent(new Event("mz-feedback-open")); }}><MessageCircle /> Feedback</button>
          </div>
        </>
      )}
    </aside>
  );
}
