import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import Seo from "../components/layout/Seo";
import { notify } from "../lib/toast";

function deviceLabel() {
  const width = window.innerWidth;
  return width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
}

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const clean = message.trim();
    if (clean.length < 8) {
      setStatus("error");
      setNotice("Please add a little more detail so we can understand your message.");
      return;
    }
    if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      setStatus("local");
      setNotice("Contact messaging is coming soon. Thanks for your interest. You can use the Feedback option for now.");
      return;
    }
    setStatus("sending");
    setNotice("");
    const payload = new URLSearchParams({
      "form-name": "mz-feedback",
      id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
      name: name.trim(),
      email: email.trim(),
      category: "General Feedback",
      rating: "",
      message: clean,
      page: "/contact",
      device: deviceLabel(),
      createdAt: new Date().toISOString(),
    });
    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setStatus("sent");
      setNotice("Thanks for reaching out. Your message has been received.");
      setMessage("");
      notify("Thanks for reaching out. Your message has been received.", { type: "success", title: "Message sent" });
    } catch {
      setStatus("error");
      setNotice("We couldn't reach the contact service. Please try again or use the Feedback button so your message can be saved safely on this device.");
    }
  }

  return (
    <div className="mz-section max-w-2xl py-14">
      <Seo path="/contact" title="Contact Us" description="Get in touch with the MZ Smart Tool House team." />
      <h1 className="text-3xl font-bold text-navy-900 dark:text-navy-50">Contact Us</h1>
      <p className="mt-2 text-navy-500 dark:text-navy-400">
        Have a suggestion, found a bug, or want to request a tool? Send us a message.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a href="mailto:mujtaba31202@gmail.com" className="mz-card flex items-center gap-3 p-4 hover:border-brand-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Mail className="h-5 w-5" /></span>
          <span className="min-w-0"><small className="block text-xs font-bold uppercase tracking-wide text-navy-400">Email Muhammad Mujtaba</small><strong className="block break-all text-sm">mujtaba31202@gmail.com</strong></span>
        </a>
        <a href="tel:03704892504" className="mz-card flex items-center gap-3 p-4 hover:border-brand-300">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Phone className="h-5 w-5" /></span>
          <span><small className="block text-xs font-bold uppercase tracking-wide text-navy-400">Contact</small><strong className="block text-sm">03704892504</strong></span>
        </a>
      </div>

      <form onSubmit={handleSubmit} className="mz-card mt-6 space-y-4 p-6">
        <div>
          <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Name</label>
          <input id="contact-name" required className="mz-input" type="text" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Email</label>
          <input id="contact-email" required className="mz-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={160} placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">Message</label>
          <textarea id="contact-message" required rows={5} className="mz-input" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={3000} placeholder="How can we help?" />
        </div>
        {notice ? <div role={status === "error" ? "alert" : "status"} className={`rounded-xl p-3 text-sm ${status === "sent" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200" : status === "error" ? "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200" : "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"}`}>{notice}</div> : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="mz-btn-primary" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send Message"}</button>
          {status === "error" || status === "local" ? <button type="button" className="mz-btn-secondary" onClick={() => window.dispatchEvent(new Event("mz-feedback-open"))}>Open Feedback</button> : null}
        </div>
      </form>
    </div>
  );
}
