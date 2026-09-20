import Seo from "../components/layout/Seo";
import { getAiConfigStatus } from "../services/ai";
import { Link } from "react-router-dom";

function Status({ ok, children }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>{children}</span>;
}

export default function Settings() {
  const ai = getAiConfigStatus();
  const camera = typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
  const secure = typeof window !== "undefined" && window.isSecureContext;
  return <>
    <Seo title="Tool Configuration" description="Tool configuration for MZ Smart Tool House." path="/settings" robots="noindex,nofollow,noarchive" />
    <main className="mz-section py-10 sm:py-14">
      <div className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Settings</p>
        <h1 className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">Tool Configuration</h1>
        <p className="mt-2 text-navy-500 dark:text-navy-400">This page shows configuration status only. Secret API keys are never displayed in the browser.</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="mz-card p-5"><div className="flex items-center justify-between"><h2 className="font-bold">AI API</h2><Status ok={ai.configured}>{ai.configured ? "Configured" : "Not configured"}</Status></div><p className="mt-2 text-sm text-navy-500">{ai.configured ? `Server endpoint: ${ai.endpoint}` : "Set VITE_API_BASE_URL to a backend that exposes POST /api/ai. Keep provider keys on that server."}</p></section>
        <section className="mz-card p-5"><div className="flex items-center justify-between"><h2 className="font-bold">OCR</h2><Status ok={true}>Browser available</Status></div><p className="mt-2 text-sm text-navy-500">OCR processing is designed to run locally when the OCR engine is installed and loaded by the relevant tool.</p></section>
        <section className="mz-card p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Camera</h2><Status ok={camera && secure}>{camera && secure ? "Supported" : "Upload fallback"}</Status></div><p className="mt-2 text-sm text-navy-500">Camera capture requires browser support, permission and a secure context. File upload remains available.</p></section>
        <section className="mz-card p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Backend</h2><Status ok={Boolean(import.meta.env.VITE_API_BASE_URL)}>{import.meta.env.VITE_API_BASE_URL ? "Configured" : "Not configured"}</Status></div><p className="mt-2 text-sm text-navy-500">Browser-only tools continue to work without a backend. Server-dependent features show their configuration requirement instead of fake output.</p></section>
      </div>
      <Link to="/tool-health" className="mz-btn-secondary mt-6">Open Tool Health Dashboard</Link>
    </main>
  </>;
}
