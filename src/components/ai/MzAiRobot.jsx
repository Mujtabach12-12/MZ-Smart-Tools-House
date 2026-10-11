import { Bot, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const FALLBACK_TASKS = ["Tap to search tools", "Ready when you are", "Find your next tool"];
const GAZE_RANGE_X = 3.1;
const GAZE_RANGE_Y = 2.4;
const IDLE_EXPRESSIONS = [
  "happy", "smile", "cheerful", "friendly", "curious", "calm", "playful", "delighted", "bright", "joyful",
  "optimistic", "attentive", "relaxed", "encouraging", "proud", "excited", "gentle", "thoughtful", "wink", "focused",
  "surprised", "listening", "searching", "celebrating", "thinking", "alert",
];
const SUPPORTED_MOODS = new Set([...IDLE_EXPRESSIONS, "concerned", "sad"]);
const BASE_EXPRESSION = {
  happy:"happy", smile:"smile", cheerful:"happy", friendly:"smile", curious:"curious", calm:"smile",
  playful:"happy", delighted:"happy", bright:"smile", joyful:"happy", optimistic:"smile", attentive:"curious",
  relaxed:"smile", encouraging:"happy", proud:"happy", excited:"happy", gentle:"smile", thoughtful:"focused",
  wink:"happy", focused:"focused", surprised:"curious", listening:"curious", searching:"focused",
  celebrating:"happy", thinking:"focused", alert:"curious", concerned:"concerned", sad:"sad",
};

function cleanLabel(value = "") {
  return String(value).replace(/\s+/g, " ").trim().replace(/[.…]+$/g, "").slice(0, 64);
}

function readWeakConnection() {
  const info = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!navigator.onLine || !info) return false;
  const effective = String(info.effectiveType || "").toLowerCase();
  return Boolean(
    info.saveData ||
    ["slow-2g", "2g"].includes(effective) ||
    (Number.isFinite(info.downlink) && info.downlink > 0 && info.downlink < 0.9) ||
    (Number.isFinite(info.rtt) && info.rtt > 450)
  );
}

export default function MzAiRobot({ compact=false, loading=false, label, className="", followCursor=true, mood="" }) {
  const rootRef = useRef(null);
  const supportsFinePointer = useRef(
    typeof window !== "undefined" && window.matchMedia?.("(pointer:fine)")?.matches,
  ).current;
  const [online, setOnline] = useState(() => navigator.onLine !== false);
  const [weakConnection, setWeakConnection] = useState(() => readWeakConnection());
  const [idleIndex, setIdleIndex] = useState(0);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  useEffect(() => {
    const updateNetwork = () => {
      setOnline(navigator.onLine !== false);
      setWeakConnection(readWeakConnection());
    };
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    connection?.addEventListener?.("change", updateNetwork);
    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
      connection?.removeEventListener?.("change", updateNetwork);
    };
  }, []);

  useEffect(() => {
    if (label || loading || mood) return undefined;
    const moodTimer = window.setInterval(() => setIdleIndex((value) => (value + 1) % IDLE_EXPRESSIONS.length), 5200);
    const copyTimer = window.setInterval(() => setFallbackIndex((value) => (value + 1) % FALLBACK_TASKS.length), 7800);
    return () => {
      window.clearInterval(moodTimer);
      window.clearInterval(copyTimer);
    };
  }, [label, loading, mood]);

  useEffect(() => {
    if (!followCursor || !supportsFinePointer) return undefined;
    let frame = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;

    const commit = () => {
      frame = 0;
      const centerX = window.innerWidth / 2 || 1;
      const centerY = window.innerHeight / 2 || 1;
      const rawX = (pointerX - centerX) / centerX;
      const rawY = (pointerY - centerY) / centerY;
      const nx = Math.abs(rawX) < 0.018 ? 0 : rawX;
      const ny = Math.abs(rawY) < 0.018 ? 0 : rawY;
      const x = Math.max(-GAZE_RANGE_X, Math.min(GAZE_RANGE_X, nx * GAZE_RANGE_X));
      const y = Math.max(-GAZE_RANGE_Y, Math.min(GAZE_RANGE_Y, ny * GAZE_RANGE_Y));
      rootRef.current?.style.setProperty("--mz-eye-x", `${x.toFixed(2)}px`);
      rootRef.current?.style.setProperty("--mz-eye-y", `${y.toFixed(2)}px`);
    };

    const onMove = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(commit);
    };
    const reset = () => {
      pointerX = window.innerWidth / 2;
      pointerY = window.innerHeight / 2;
      if (!frame) frame = window.requestAnimationFrame(commit);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", reset, { passive: true });
    document.addEventListener("pointerleave", reset, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", reset);
      document.removeEventListener("pointerleave", reset);
    };
  }, [followCursor, supportsFinePointer]);

  const expression = useMemo(() => {
    if (!online) return "sad";
    if (weakConnection) return "concerned";
    if (loading) return "focused";
    if (SUPPORTED_MOODS.has(mood)) return mood;
    return IDLE_EXPRESSIONS[idleIndex] || "happy";
  }, [idleIndex, loading, mood, online, weakConnection]);

  const baseExpression = BASE_EXPRESSION[expression] || "smile";
  const task = !online
    ? "Reconnect to continue"
    : weakConnection
      ? "Connection is a little slow"
      : cleanLabel(label) || (loading ? "Preparing your tool" : FALLBACK_TASKS[fallbackIndex]);

  return (
    <div
      ref={rootRef}
      className={`mz-ai-robot ${compact ? "is-compact" : ""} ${loading ? "is-loading" : ""} is-${baseExpression} is-${expression} ${className}`.trim()}
      aria-label={`MZ AI: ${task}`}
      data-expression={expression}
    >
      <div className="mz-ai-robot-orbit" aria-hidden="true"><i/><i/><i/></div>
      <div className="mz-ai-robot-head" aria-hidden="true">
        <span className="mz-ai-antenna"><i/></span>
        <div className="mz-ai-face">
          <span className="mz-ai-brow left"/><span className="mz-ai-brow right"/>
          <span className="mz-ai-eye"><i/></span><span className="mz-ai-eye"><i/></span>
          <span className="mz-ai-cheek left"/><span className="mz-ai-cheek right"/>
          <span className="mz-ai-mouth"/>
        </div>
        <span className="mz-ai-ear left"/><span className="mz-ai-ear right"/>
      </div>
      <div className="mz-ai-body"><Bot className="h-4 w-4"/><strong>MZ AI</strong><Sparkles className="h-3 w-3"/></div>
      {!compact ? <div className="mz-ai-task" title={task}><span className="mz-ai-dot"/>{task}</div> : null}
    </div>
  );
}
