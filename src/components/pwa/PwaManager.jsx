import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, ExternalLink, RefreshCw, WifiOff, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { notify } from '../../lib/toast';

const isNative = Capacitor.isNativePlatform();
const isStandalone = () => isNative || window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIosSafari = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);
// Chromium logs a browser diagnostic whenever beforeinstallprompt is deferred with
// preventDefault() but prompt() has not yet been called. The default production
// mode is therefore native-first and does not intercept the event. Set
// VITE_PWA_DEFER_INSTALL=true only when a one-click custom deferred prompt is
// preferred over a completely quiet console.
const SHOULD_DEFER_INSTALL = import.meta.env.VITE_PWA_DEFER_INSTALL === 'true';

export default function PwaManager() {
  const installEventRef = useRef(null);
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [updateWorker, setUpdateWorker] = useState(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [iosHelp, setIosHelp] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);
  const [nativeInstallAvailable, setNativeInstallAvailable] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  const emitState = (next = {}) => window.dispatchEvent(new CustomEvent('mz-pwa-state', { detail: { available:Boolean(installEventRef.current) || nativeInstallAvailable, installed:isStandalone() || installed, native:isNative, deferredPrompt:SHOULD_DEFER_INSTALL, ...next } }));

  useEffect(() => {
    document.documentElement.classList.toggle('capacitor-native', isNative);
    const onBeforeInstall = (event) => {
      setNativeInstallAvailable(true);
      setShowInstallBanner(true);
      if (SHOULD_DEFER_INSTALL) {
        event.preventDefault();
        installEventRef.current = event;
        setInstallEvent(event);
      } else {
        installEventRef.current = null;
        setInstallEvent(null);
      }
      emitState({ available:true, installed:false, deferredPrompt:SHOULD_DEFER_INSTALL });
      window.dispatchEvent(new CustomEvent('mz-pwa-install-available', { detail: { available:true, deferredPrompt:SHOULD_DEFER_INSTALL } }));
    };
    const onInstalled = () => {
      setInstalled(true); installEventRef.current = null; setInstallEvent(null); setNativeInstallAvailable(false); setShowInstallBanner(false); setInstallHelp(false);
      emitState({ available:false, installed:true });
      notify('App installed successfully.', { type:'success', title:'MZ Smart Tool House' });
      window.dispatchEvent(new CustomEvent('mz-pwa-install-available', { detail: { available:false } }));
    };
    const onOnline = () => setOffline(false), onOffline = () => setOffline(true);
    const requestInstall = async () => {
      if (isStandalone() || installed) { setInstalled(true); setInstallHelp(true); emitState({installed:true}); return; }
      const deferred = installEventRef.current;
      if (!deferred) { if (isIosSafari()) setIosHelp(true); else setInstallHelp(true); return; }
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice.catch(() => null);
        if (choice?.outcome === 'accepted') { setInstalled(true); notify('Installation accepted. Your browser is finishing setup.', { type:'success', title:'Install App' }); }
      } finally {
        installEventRef.current = null; setInstallEvent(null); setNativeInstallAvailable(false); setShowInstallBanner(false);
        emitState({ available:false });
        window.dispatchEvent(new CustomEvent('mz-pwa-install-available', { detail: { available:false } }));
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('mz-pwa-install-request', requestInstall);
    queueMicrotask(() => emitState({ installed:isStandalone() }));

    let webRegistration;
    const nativeListeners = [];
    if (isNative) {
      StatusBar.setStyle({ style: StatusBarStyle.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#f8fafc' }).catch(() => {});
      SplashScreen.hide().catch(() => {});
      CapacitorApp.addListener('backButton', ({ canGoBack }) => { if (canGoBack && window.history.length > 1) window.history.back(); else CapacitorApp.exitApp(); }).then((handle) => nativeListeners.push(handle)).catch(() => {});
      const onDocumentClick = (event) => {
        const anchor = event.target.closest?.('a[href]'); if (!anchor || anchor.target === '_self') return;
        const href = anchor.href; if (!href || !/^https?:$/i.test(new URL(href).protocol) || new URL(href).origin === window.location.origin) return;
        event.preventDefault(); Browser.open({ url:href, presentationStyle:'popover' }).catch(() => window.open(href, '_blank', 'noopener,noreferrer'));
      };
      document.addEventListener('click', onDocumentClick, true);
      nativeListeners.push({ remove: async () => document.removeEventListener('click', onDocumentClick, true) });
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope:'/' }).then((reg) => {
        webRegistration = reg;
        if (reg.waiting) setUpdateWorker(reg.waiting);
        reg.addEventListener('updatefound', () => { const worker=reg.installing; if (!worker) return; worker.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdateWorker(worker); }); });
      }).catch(() => {});
    }
    if (!isNative && isIosSafari() && !window.navigator.standalone) setIosHelp(false);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall); window.removeEventListener('appinstalled', onInstalled); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); window.removeEventListener('mz-pwa-install-request', requestInstall);
      nativeListeners.forEach((handle) => handle?.remove?.()); webRegistration = null; document.documentElement.classList.remove('capacitor-native');
    };
  }, [installed]);

  const install = () => window.dispatchEvent(new Event('mz-pwa-install-request'));
  const update = () => { if (!updateWorker) return; notify('Updating to the latest version…', { type:'info', title:'App update' }); updateWorker.postMessage({ type:'SKIP_WAITING' }); window.location.reload(); };

  return <>
    {!installed && installEvent && SHOULD_DEFER_INSTALL && showInstallBanner ? <div className="fixed inset-x-3 bottom-3 z-[80] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-navy-900" role="dialog" aria-label="Install MZ Smart Tool House"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white"><Download className="h-5 w-5"/></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">Install MZ Smart Tool House</p><p className="text-xs text-slate-500 dark:text-slate-400">Use MZ Tools like an app on this device.</p></div><button className="mz-btn-primary" onClick={install}>Install</button><button className="mz-btn-ghost" aria-label="Dismiss install prompt" onClick={()=>setShowInstallBanner(false)}><X className="h-4 w-4"/></button></div> : null}
    {iosHelp ? <div className="fixed inset-x-3 bottom-3 z-[82] mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-navy-900" role="dialog" aria-label="Install on iPhone or iPad"><div className="flex gap-3"><ExternalLink className="h-5 w-5 shrink-0 text-brand-600"/><div className="flex-1"><strong className="text-sm">Install on iPhone/iPad</strong><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">In Safari, tap Share and choose <b>Add to Home Screen</b>. Apple does not provide the same install prompt used by Chromium browsers.</p></div><button className="mz-btn-ghost" onClick={()=>setIosHelp(false)} aria-label="Close"><X className="h-4 w-4"/></button></div></div> : null}
    {installHelp ? <div className="fixed inset-0 z-[125] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="App installation information" onMouseDown={(e)=>{if(e.target===e.currentTarget)setInstallHelp(false)}}><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-navy-900"><div className="flex items-start gap-3">{installed?<CheckCircle2 className="h-6 w-6 text-emerald-600"/>:<Download className="h-6 w-6 text-brand-600"/>}<div className="flex-1"><h2 className="text-lg font-extrabold">{installed?'App is installed':'Install App'}</h2><p className="mt-2 text-sm leading-6 text-navy-500 dark:text-navy-400">{installed?'MZ Smart Tool House is already running in installed/standalone mode on this device.':nativeInstallAvailable && !SHOULD_DEFER_INSTALL ? 'Installation is available in this browser. Use the browser address-bar Install icon or menu → Install app. MZ uses the native browser flow by default so the console stays free of the deferred-prompt diagnostic.' : 'This browser has not offered an install prompt yet. PWA installation requires a supported browser, HTTPS in production, a valid manifest and service worker. You can also check your browser menu for “Install app” or “Add to Home Screen”.'}</p></div><button className="mz-btn-ghost" onClick={()=>setInstallHelp(false)} aria-label="Close"><X className="h-4 w-4"/></button></div></div></div> : null}
    {offline ? <div className="fixed bottom-3 left-3 z-[79] flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg dark:border-slate-700 dark:bg-navy-900 dark:text-slate-200" role="status"><WifiOff className="h-4 w-4"/> Offline mode</div> : null}
    {updateWorker && !isNative ? <div className="fixed inset-x-3 bottom-3 z-[81] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-brand-200 bg-white p-3 shadow-xl dark:border-brand-900 dark:bg-navy-900" role="status"><RefreshCw className="h-5 w-5 shrink-0 text-brand-600"/><p className="flex-1 text-xs font-semibold">A new version is ready.</p><button className="mz-btn-primary" onClick={update}>Update</button></div> : null}
  </>;
}
