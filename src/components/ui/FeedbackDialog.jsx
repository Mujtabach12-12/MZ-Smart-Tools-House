import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, MessageCircle, Send, Star, X } from "lucide-react";
import { notify } from "../../lib/toast";
import { useLocation } from "react-router-dom";
import { feedbackDeviceLabel, flushFeedbackQueue, submitFeedback } from "../../lib/feedback";

const CATEGORIES = ["Bug Report", "Feature Request", "Tool Suggestion", "UI/UX Feedback", "General Feedback"];

export default function FeedbackDialog({ open, onClose }) {
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");
  const firstFieldRef = useRef(null);
  const currentPage = useMemo(() => `${location.pathname}${location.search}`, [location.pathname, location.search]);
  useEffect(() => {
    const flush = async () => {
      if (!navigator.onLine || ["localhost", "127.0.0.1"].includes(window.location.hostname)) return;
      const result = await flushFeedbackQueue();
      if (result.sent) notify(`${result.sent} saved feedback item${result.sent === 1 ? "" : "s"} sent.`, { type:"success", title:"Feedback synced" });
    };
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    const onKeyDown = (event) => { if (event.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);
  if (!open) return null;

  async function submit(event) {
    event.preventDefault();
    const clean = message.trim();
    if (clean.length < 8) { setStatus("error"); setNotice("Please add a little more detail so the feedback is useful."); return; }
    const payload = { id: crypto.randomUUID?.() || String(Date.now()), name:name.trim(), email:email.trim(), category, rating: rating || "", message:clean, page:currentPage, device:feedbackDeviceLabel(), createdAt:new Date().toISOString() };
    setStatus("sending"); setNotice("");
    const result = await submitFeedback(payload);
    if (result.status === "sent") {
      setStatus("sent"); setNotice("Thanks for helping us improve MZ Smart Tool House. Your feedback has been received."); notify("Thanks for helping us improve MZ Smart Tool House.", { type:"success", title:"Feedback received" }); setMessage(""); return;
    }
    setStatus("queued");
    setNotice(result.status === "queued" ? "We couldn't reach the feedback service, so your feedback was saved safely on this device and can sync later." : "Feedback could not be sent or saved on this device. Please try again later.");
  }

  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="feedback-title" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose?.()}}>
    <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-white p-5 shadow-2xl dark:border-navy-700 dark:bg-navy-900 sm:p-7">
      <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white"><MessageCircle className="h-5 w-5"/></span><div className="min-w-0 flex-1"><h2 id="feedback-title" className="text-xl font-extrabold">Share feedback</h2><p className="mt-1 text-sm leading-6 text-navy-500 dark:text-navy-400">Tell us what is broken, confusing or worth building next. Current page is included automatically.</p></div><button className="mz-btn-ghost" onClick={onClose} aria-label="Close feedback"><X className="h-5 w-5"/></button></div>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold">Name <span className="font-normal text-navy-400">optional</span><input ref={firstFieldRef} className="mz-input mt-1" value={name} onChange={(e)=>setName(e.target.value)} maxLength={80}/></label><label className="text-sm font-semibold">Email <span className="font-normal text-navy-400">optional</span><input className="mz-input mt-1" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} maxLength={160}/></label></div>
        <label className="block text-sm font-semibold">Category<select className="mz-input mt-1" value={category} onChange={(e)=>setCategory(e.target.value)}>{CATEGORIES.map((item)=><option key={item}>{item}</option>)}</select></label>
        <fieldset><legend className="text-sm font-semibold">Rating <span className="font-normal text-navy-400">optional</span></legend><div className="mt-2 flex gap-1" aria-label="Feedback rating">{[1,2,3,4,5].map((value)=><button key={value} type="button" className={`rounded-lg p-2 transition ${rating>=value?"bg-amber-50 text-amber-500 dark:bg-amber-950/30":"text-navy-300 hover:bg-navy-50 hover:text-amber-400 dark:hover:bg-navy-800"}`} onClick={()=>setRating(value)} aria-label={`${value} star${value===1?"":"s"}`} aria-pressed={rating===value}><Star className={`h-5 w-5 ${rating>=value?"fill-current":""}`}/></button>)}</div></fieldset>
        <label className="block text-sm font-semibold">Message<textarea className="mz-input mt-1 min-h-32" value={message} onChange={(e)=>setMessage(e.target.value)} maxLength={3000} placeholder="What happened, what did you expect, or what would make this better?" required/></label>
        <div className="rounded-xl bg-navy-50 px-3 py-2 text-xs text-navy-500 dark:bg-navy-950 dark:text-navy-400">Page: <strong>{currentPage}</strong> · Device: <strong>{feedbackDeviceLabel()}</strong></div>
        {notice ? <div className={`rounded-xl p-3 text-sm ${status==="sent"?"bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200":status==="error"?"bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200":"bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"}`} role="status">{status==="sent"?<CheckCircle2 className="mr-2 inline h-4 w-4"/>:null}{notice}</div> : null}
        <div className="flex justify-end gap-2"><button type="button" className="mz-btn-secondary" onClick={onClose}>Cancel</button><button className="mz-btn-primary" disabled={status==="sending"}><Send className="h-4 w-4"/>{status==="sending"?"Sending…":"Send Feedback"}</button></div>
      </form>
    </div>
  </div>;
}
