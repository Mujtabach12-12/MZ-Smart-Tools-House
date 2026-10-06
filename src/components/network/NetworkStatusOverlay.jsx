import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import MzAiRobot from "../ai/MzAiRobot";

function readConnectionState() {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (offline) return "offline";
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return "online";
  const effectiveType = String(connection.effectiveType || "").toLowerCase();
  const downlink = Number(connection.downlink || 0);
  const rtt = Number(connection.rtt || 0);
  const weak = effectiveType === "slow-2g" || effectiveType === "2g" ||
    (downlink > 0 && downlink < 0.8) || (rtt > 0 && rtt >= 1200);
  return weak ? "weak" : "online";
}

export default function NetworkStatusOverlay() {
  const [status, setStatus] = useState(readConnectionState);
  const [dismissedWeak, setDismissedWeak] = useState(false);
  const [dismissedOffline, setDismissedOffline] = useState(false);

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const update = () => {
      const next = readConnectionState();
      setStatus(next);
      if (next !== "weak") setDismissedWeak(false);
      if (next !== "offline") setDismissedOffline(false);
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    connection?.addEventListener?.("change", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      connection?.removeEventListener?.("change", update);
    };
  }, []);

  const copy = useMemo(() => status === "offline"
    ? {
        title: "Oops — MZ AI lost the internet",
        text: "Please reconnect me so online tools can keep working. Browser-only tools may still work with cached assets.",
      }
    : {
        title: "MZ AI sees a weak connection",
        text: "Your connection looks slow. Online tools may take longer, while browser-only tools can continue normally.",
      }, [status]);

  const hidden = status === "online" || (status === "weak" && dismissedWeak) || (status === "offline" && dismissedOffline);
  if (hidden) return null;

  return (
    <div className={`mz-network-state is-${status}`} role={status === "offline" ? "alertdialog" : "status"} aria-live="polite">
      <div className="mz-network-card">
        <div className="mz-network-robot"><MzAiRobot compact loading label={status === "offline" ? "Waiting for internet" : "Connection is weak"} /></div>
        <div className="mz-network-copy">
          <span className="mz-network-kicker">{status === "offline" ? <WifiOff /> : <Wifi />} MZ AI NETWORK</span>
          <h2>{copy.title}</h2>
          <p>{copy.text}</p>
          <div className="mz-network-actions">
            <button type="button" className="mz-btn-primary" onClick={() => setStatus(readConnectionState())}>
              <RefreshCw className="h-4 w-4" /> Retry connection
            </button>
            <button type="button" className="mz-btn-secondary" onClick={() => status === "offline" ? setDismissedOffline(true) : setDismissedWeak(true)}>
              {status === "offline" ? "Continue offline" : "Dismiss"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
