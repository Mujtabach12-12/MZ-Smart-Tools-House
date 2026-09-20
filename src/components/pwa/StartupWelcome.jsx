import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// The branded startup screen is for the installed PWA/native app only. Normal
// website visitors should reach the page immediately instead of waiting through
// a splash animation on every browser visit.
const STARTUP_MS = 1800;

export default function StartupWelcome() {
  useEffect(() => {
    const startup = document.getElementById('mz-native-startup');
    if (!startup) return undefined;

    const installedWebApp = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (!Capacitor.isNativePlatform() && !installedWebApp) {
      startup.remove();
      return undefined;
    }

    const leaveTimer = window.setTimeout(() => startup.classList.add('is-leaving'), STARTUP_MS - 350);
    const hideTimer = window.setTimeout(() => {
      startup.classList.add('is-hidden');
      window.setTimeout(() => startup.remove(), 160);
    }, STARTUP_MS);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return null;
}
