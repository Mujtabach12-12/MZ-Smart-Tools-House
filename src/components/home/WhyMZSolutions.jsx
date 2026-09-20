import { ShieldCheck, Zap, Wallet, MonitorSmartphone } from "lucide-react";

const REASONS = [
  {
    icon: ShieldCheck,
    title: "Privacy First",
    description: "Most tools run entirely in your browser — your files and documents are never uploaded to a server.",
  },
  {
    icon: Zap,
    title: "Fast & Lightweight",
    description: "No sign-up, no waiting, no bloated pages. Open a tool and get your result instantly.",
  },
  {
    icon: Wallet,
    title: "Always Free",
    description: "Every tool on MZ Smart Tool House is free to use, with no hidden limits or premium paywalls.",
  },
  {
    icon: MonitorSmartphone,
    title: "Works Everywhere",
    description: "A responsive design that works smoothly on your phone, tablet or laptop.",
  },
];

export default function WhyMZSolutions() {
  return (
    <section className="bg-navy-50/60 py-16 dark:bg-navy-900/40">
      <div className="mz-section">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-navy-50">Why MZ Smart Tool House</h2>
          <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">Built for students, with students' needs in mind.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((reason) => (
            <div key={reason.title} className="mz-card p-6 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <reason.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold text-navy-900 dark:text-navy-50">{reason.title}</h3>
              <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
