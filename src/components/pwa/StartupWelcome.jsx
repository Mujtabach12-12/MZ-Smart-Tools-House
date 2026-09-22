import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

const APP_STARTUP_MS = 1250;
const WEB_STARTUP_MS = 1000;

export default function StartupWelcome() {
  useEffect(() => {
    const startup = document.getElementById("mz-native-startup");
    if (!startup) return undefined;

    const installedWebApp =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    const nativeApp = Capacitor.isNativePlatform();
    const appLike = nativeApp || installedWebApp;

    if (!appLike) {
      try {
        if (window.sessionStorage.getItem("mz-web-startup-seen") === "1") {
          startup.remove();
          return undefined;
        }
        window.sessionStorage.setItem("mz-web-startup-seen", "1");
      } catch {
        // Storage may be unavailable in privacy modes; showing the short welcome
        // once more is safer than blocking startup.
      }
    }

    const duration = appLike ? APP_STARTUP_MS : WEB_STARTUP_MS;
    const leaveTimer = window.setTimeout(
      () => startup.classList.add("is-leaving"),
      Math.max(420, duration - 260),
    );
    const hideTimer = window.setTimeout(() => {
      startup.classList.add("is-hidden");
      window.setTimeout(() => startup.remove(), 180);
    }, duration);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return null;
}
