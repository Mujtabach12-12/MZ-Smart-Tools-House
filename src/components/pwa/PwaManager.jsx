import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, ExternalLink, RefreshCw, Share2, Smartphone, Sparkles, WifiOff, X, Zap } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { notify } from '../../lib/toast';

const isNative = Capacitor.isNativePlatform();
const isStandalone = () => isNative || window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIosSafari = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);
const isMobileBrowser = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || window.matchMedia?.('(max-width: 767px)').matches;
const INSTALL_DISMISSED_KEY = 'mz-install-offer-dismissed-session';

function wasInstallOfferDismissed() {
  try { return sessionStorage.getItem(INSTALL_DISMISSED_KEY) === '1'; } catch { return false; }
}

export default function PwaManager() {
  const initialInstalled = isStandalone();
  const installEventRef = useRef(null);
  const installedRef = useRef(initialInstalled);
  const offerTimerRef = useRef(null);
  const [installed, setInstalled] = useState(initialInstalled);
  const [installReady, setInstallReady] = useState(false);
  const [showInstallOffer, setShowInstallOffer] = useState(false);
  const [updateWorker, setUpdateWorker] = useState(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [iosHelp, setIosHelp] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);

  const emitState = (next = {}) => {
    window.dispatchEvent(new CustomEvent('mz-pwa-state', {
      detail: {
        available: Boolean(installEventRef.current),
        installed: isStandalone() || installedRef.current,
        native: isNative,
        ...next,
      },
    }));
  };

  useEffect(() => {
    document.documentElement.classList.toggle('capacitor-native', isNative);

    const maybeShowInstallOffer = (delay = 1100) => {
      if (isNative || isStandalone() || !isMobileBrowser() || wasInstallOfferDismissed()) return;
      window.clearTimeout(offerTimerRef.current);
      offerTimerRef.current = window.setTimeout(() => setShowInstallOffer(true), delay);
    };

    const onBeforeInstall = (event) => {
      // Keep the browser's native install path available while retaining the event
      // for our explicit Install buttons. Avoiding preventDefault also avoids the
      // Chromium deferred-prompt console diagnostic seen in the previous build.
      installEventRef.current = event;
      setInstallReady(true);
      emitState({ available: true, installed: false });
      window.dispatchEvent(new CustomEvent('mz-pwa-install-available', { detail: { available: true } }));
      maybeShowInstallOffer(450);
    };

    const onInstalled = () => {
      installedRef.current = true;
      setInstalled(true);
      installEventRef.current = null;
      setInstallReady(false);
      setShowInstallOffer(false);
      setInstallHelp(false);
      setIosHelp(false);
      emitState({ available: false, installed: true });
      notify('App installed successfully. Open it from your home screen anytime.', { type: 'success', title: 'MZ Smart Tool House' });
      window.dispatchEvent(new CustomEvent('mz-pwa-install-available', { detail: { available: false } }));
    };

    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);

    const requestInstall = async () => {
      if (isStandalone() || installedRef.current) {
        installedRef.current = true;
        setInstalled(true);
        setShowInstallOffer(false);
        setInstallHelp(true);
        emitState({ installed: true, available: false });
        return;
      }

      const deferred = installEventRef.current;
      if (deferred?.prompt) {
        setShowInstallOffer(false);
        try {
          await deferred.prompt();
          const choice = await deferred.userChoice?.catch?.(() => null);
          if (choice?.outcome === 'accepted') {
            notify('Installation accepted. Your browser is finishing setup.', { type: 'success', title: 'Install App' });
          } else if (choice?.outcome === 'dismissed') {
            notify('Install was dismissed. You can install anytime from the download button.', { type: 'info', title: 'Install App' });
          }
        } catch {
          // Some browsers consume their native install event before our button is
          // pressed. Fall back to clear browser-specific instructions rather than
          // pretending installation succeeded.
          if (isIosSafari()) setIosHelp(true);
          else setInstallHelp(true);
        } finally {
          installEventRef.current = null;
          setInstallReady(false);
          emitState({ available: false });
          window.dispatchEvent(new CustomEvent('mz-pwa-install-available', { detail: { available: false } }));
        }
        return;
      }

      setShowInstallOffer(false);
      if (isIosSafari()) setIosHelp(true);
      else setInstallHelp(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('mz-pwa-install-request', requestInstall);
    queueMicrotask(() => emitState({ installed: isStandalone() }));

    // A friendly first-visit install card is shown on mobile even if the browser
    // has not emitted beforeinstallprompt yet. The button then falls back to exact
    // browser install instructions. Dismissal lasts only for the current session.
    maybeShowInstallOffer(1200);

    let webRegistration;
    const nativeListeners = [];
    if (isNative) {
      StatusBar.setStyle({ style: StatusBarStyle.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#f8fafc' }).catch(() => {});
      SplashScreen.hide().catch(() => {});
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack && window.history.length > 1) window.history.back();
        else CapacitorApp.exitApp();
      }).then((handle) => nativeListeners.push(handle)).catch(() => {});

      const onDocumentClick = (event) => {
        const anchor = event.target.closest?.('a[href]');
        if (!anchor || anchor.target === '_self') return;
        const href = anchor.href;
        if (!href) return;
        const url = new URL(href);
        if (!/^https?:$/i.test(url.protocol) || url.origin === window.location.origin) return;
        event.preventDefault();
        Browser.open({ url: href, presentationStyle: 'popover' }).catch(() => window.open(href, '_blank', 'noopener,noreferrer'));
      };
      document.addEventListener('click', onDocumentClick, true);
      nativeListeners.push({ remove: async () => document.removeEventListener('click', onDocumentClick, true) });
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
        webRegistration = reg;
        if (reg.waiting) setUpdateWorker(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdateWorker(worker);
          });
        });
      }).catch(() => {});
    }

    return () => {
      window.clearTimeout(offerTimerRef.current);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('mz-pwa-install-request', requestInstall);
      nativeListeners.forEach((handle) => handle?.remove?.());
      webRegistration = null;
      document.documentElement.classList.remove('capacitor-native');
    };
  }, []);

  const install = () => window.dispatchEvent(new Event('mz-pwa-install-request'));
  const dismissOffer = () => {
    try { sessionStorage.setItem(INSTALL_DISMISSED_KEY, '1'); } catch {}
    setShowInstallOffer(false);
  };
  const update = () => {
    if (!updateWorker) return;
    notify('Updating to the latest version…', { type: 'info', title: 'App update' });
    updateWorker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  return (
    <>
      {!installed && showInstallOffer ? (
        <div className="mz-install-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismissOffer(); }}>
          <section className="mz-install-sheet" role="dialog" aria-modal="true" aria-labelledby="mz-install-title">
            <div className="mz-install-sheet-handle" aria-hidden="true" />
            <button type="button" className="mz-install-close" onClick={dismissOffer} aria-label="Not now"><X className="h-5 w-5" /></button>
            <div className="flex items-start gap-3.5">
              <div className="mz-install-app-icon"><img src="/icons/icon-192.png" width="64" height="64" alt="" /></div>
              <div className="min-w-0 flex-1">
                <p className="mz-install-kicker"><Sparkles className="h-3.5 w-3.5" /> MZ SMART TOOL HOUSE</p>
                <h2 id="mz-install-title" className="mt-1.5 text-xl font-black tracking-tight text-navy-950 dark:text-white">Install MZ as an app</h2>
                <p className="mt-1.5 text-sm leading-5 text-navy-500 dark:text-navy-400">Open tools faster from your home screen with an app-like full-screen experience.</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="mz-install-benefit"><Smartphone className="h-4 w-4" /><span>Home screen</span></div>
              <div className="mz-install-benefit"><Zap className="h-4 w-4" /><span>Quick launch</span></div>
              <div className="mz-install-benefit"><Download className="h-4 w-4" /><span>No app store</span></div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
              <button type="button" className="mz-btn-primary w-full !py-3" onClick={install}><Download className="h-4 w-4" /> {installReady ? 'Install App' : 'Install / Add to Home Screen'}</button>
              <button type="button" className="mz-btn-secondary w-full sm:w-auto" onClick={dismissOffer}>Not now</button>
            </div>
            {!installReady ? <p className="mt-2.5 text-center text-[11px] leading-4 text-navy-400">If one-tap install is not available yet, we’ll show the exact browser steps.</p> : null}
          </section>
        </div>
      ) : null}

      {iosHelp ? (
        <div className="mz-install-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIosHelp(false); }}>
          <section className="mz-install-sheet max-w-md" role="dialog" aria-modal="true" aria-label="Install on iPhone or iPad">
            <button className="mz-install-close" onClick={() => setIosHelp(false)} aria-label="Close"><X className="h-5 w-5" /></button>
            <div className="flex items-start gap-3"><Share2 className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" /><div><h2 className="text-lg font-extrabold">Install on iPhone or iPad</h2><p className="mt-2 text-sm leading-6 text-navy-500 dark:text-navy-400">In Safari, tap <b>Share</b>, choose <b>Add to Home Screen</b>, then tap <b>Add</b>. MZ Smart Tool House will appear like an app on your home screen.</p></div></div>
          </section>
        </div>
      ) : null}

      {installHelp ? (
        <div className="mz-install-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setInstallHelp(false); }}>
          <section className="mz-install-sheet max-w-md" role="dialog" aria-modal="true" aria-label="App installation information">
            <button className="mz-install-close" onClick={() => setInstallHelp(false)} aria-label="Close"><X className="h-5 w-5" /></button>
            <div className="flex items-start gap-3">
              {installed ? <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" /> : <ExternalLink className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" />}
              <div className="flex-1">
                <h2 className="text-lg font-extrabold">{installed ? 'App is installed' : 'Install from your browser'}</h2>
                <p className="mt-2 text-sm leading-6 text-navy-500 dark:text-navy-400">
                  {installed ? 'MZ Smart Tool House is already running in installed/standalone mode on this device.' : 'Open your browser menu (⋮) and choose “Install app” or “Add to Home screen”. On supported Chromium browsers, the one-tap install button will become available automatically when the browser marks the site as installable.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {offline ? <div className="fixed bottom-24 left-3 z-[79] flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg md:bottom-3 dark:border-slate-700 dark:bg-navy-900 dark:text-slate-200" role="status"><WifiOff className="h-4 w-4" /> Offline mode</div> : null}
      {updateWorker && !isNative ? <div className="fixed inset-x-3 bottom-24 z-[81] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-brand-200 bg-white p-3 shadow-xl md:bottom-3 dark:border-brand-900 dark:bg-navy-900" role="status"><RefreshCw className="h-5 w-5 shrink-0 text-brand-600" /><p className="flex-1 text-xs font-semibold">A new version is ready.</p><button className="mz-btn-primary" onClick={update}>Update</button></div> : null}
    </>
  );
}
