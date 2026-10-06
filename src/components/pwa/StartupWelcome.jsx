import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

const APP_STARTUP_MS = 5200;
const WEB_STARTUP_MS = 5200;
const STARTUP_SESSION_KEY = "mz-startup-seen-v3";
const STARTUP_STEPS = [
  "PDF Tools",
  "Image Tools",
  "Document Scanner",
  "Calculators",
  "Developer Tools",
  "Converters",
];

export default function StartupWelcome() {
  useEffect(() => {
    const startup = document.getElementById("mz-native-startup");
    if (!startup) return undefined;

    try {
      if (window.sessionStorage.getItem(STARTUP_SESSION_KEY) === "1") {
        document.documentElement.classList.add("mz-startup-skip");
        startup.remove();
        return undefined;
      }
    } catch {
      // sessionStorage can be unavailable in restrictive privacy modes.
    }

    const installedWebApp =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    const nativeApp = Capacitor.isNativePlatform();
    const appLike = nativeApp || installedWebApp;

    const duration = appLike ? APP_STARTUP_MS : WEB_STARTUP_MS;
    const label = startup.querySelector("[data-mz-startup-tool]");
    const progress = startup.querySelector("[data-mz-startup-progress]");
    let step = 0;
    if (label) label.textContent = STARTUP_STEPS[0];
    if (progress) progress.style.setProperty("--mz-startup-duration", `${duration}ms`);

    const stepTimer = window.setInterval(() => {
      step = (step + 1) % STARTUP_STEPS.length;
      if (label) {
        label.classList.remove("is-changing");
        void label.offsetWidth;
        label.textContent = STARTUP_STEPS[step];
        label.classList.add("is-changing");
      }
    }, 1000);

    const leaveTimer = window.setTimeout(
      () => startup.classList.add("is-leaving"),
      Math.max(520, duration - 360),
    );
    const hideTimer = window.setTimeout(() => {
      try { window.sessionStorage.setItem(STARTUP_SESSION_KEY, "1"); } catch { /* best effort */ }
      document.documentElement.classList.add("mz-startup-skip");
      startup.classList.add("is-hidden");
      window.setTimeout(() => startup.remove(), 220);
    }, duration);

    return () => {
      window.clearInterval(stepTimer);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return null;
}
