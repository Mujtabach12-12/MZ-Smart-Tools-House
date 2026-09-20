import { useEffect } from 'react';

// The first-paint startup screen lives in index.html so Android users see it
// immediately, even while React/Vite chunks are still loading. This component
// only controls its exit; it does not duplicate the overlay.
const STARTUP_MS = 4200;

export default function StartupWelcome() {
  useEffect(() => {
    const startup = document.getElementById('mz-native-startup');
    if (!startup) return undefined;

    const leaveTimer = window.setTimeout(() => startup.classList.add('is-leaving'), STARTUP_MS - 500);
    const hideTimer = window.setTimeout(() => {
      startup.classList.add('is-hidden');
      window.setTimeout(() => startup.remove(), 180);
    }, STARTUP_MS);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return null;
}
