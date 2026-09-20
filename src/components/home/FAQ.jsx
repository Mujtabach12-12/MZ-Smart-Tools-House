import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is MZ Smart Tool House really free to use?",
    a: "Yes. Every tool on the platform is completely free, with no sign-up and no hidden charges.",
  },
  {
    q: "Are my files uploaded to a server?",
    a: "Wherever technically possible, tools process your files locally in your browser. If a specific tool ever needs server processing, this will be stated clearly on that tool's page.",
  },
  {
    q: "Can I use MZ Smart Tool House on my phone?",
    a: "Yes. The whole platform is designed mobile-first and works on phones, tablets and desktops.",
  },
  {
    q: "Will more tools be added?",
    a: "Yes. MZ Smart Tool House is being built in phases, and new calculators, PDF, image, text and productivity tools are being added regularly.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="mz-section py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-navy-50">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.q} className="mz-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-navy-900 dark:text-navy-50">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-navy-400 transition ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-navy-500 dark:text-navy-400">{item.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
