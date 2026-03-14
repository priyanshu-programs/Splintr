"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Does the AI actually sound like me?",
    a: "Yes. Splintr uses advanced context windowing to ingest your past writing. It maps your tonal markers, vocabulary, and sentence structures to build a custom Prompt Profile — not a generic overlay.",
  },
  {
    q: "Can I edit content before publishing?",
    a: 'Absolutely. All generations start in Draft state. Our editor lets you tweak, rewrite, or hit "Regenerate" with specific instructions before approving for the queue.',
  },
  {
    q: "What file formats are supported?",
    a: "Raw text, URLs, .txt, .md, .docx, .pdf, .mp3, .wav, .m4a, .ogg, .mp4, .mov, .webm. We also support direct YouTube and podcast RSS links with auto-transcription.",
  },
  {
    q: "Do you publish directly to my socials?",
    a: "Yes, via official APIs. Authenticate once and Splintr handles the publishing queue directly to LinkedIn, X, Instagram, and more — no third-party scheduler needed.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — every new user gets a 7-day free trial of the Pro plan. No credit card required to start. You'll receive reminders at day 3 and day 6.",
  },
  {
    q: "How does the AI voice model improve over time?",
    a: "Each time you edit a generation before publishing, Splintr records your preferences. Over time, the model learns your corrections and produces increasingly accurate output.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative z-10 bg-[#ECEEF1] dark:bg-white/[0.02] px-10 py-28">
      <div className="font-mono text-[0.7rem] font-extrabold text-[var(--sp-fg-light)] text-center mb-16 uppercase tracking-[0.25em]">
        06 / System Documentation
      </div>
      <h2 className="font-sans text-[clamp(2.4rem,3.5vw,3.8rem)] font-bold tracking-tight leading-tight text-center mb-6">
        Common Inquiries
      </h2>
      <div className="max-w-[800px] mx-auto bg-background rounded-2xl px-12 py-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mt-16 dark:border dark:border-white/10">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`border-b border-foreground/[0.06] dark:border-white/10 last:border-b-0 py-6 cursor-pointer`}
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              <div className="font-sans text-base font-semibold flex justify-between items-center">
                {faq.q}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <div
                className={`overflow-hidden transition-all duration-400 font-mono text-sm leading-relaxed text-[var(--sp-fg-light)] ${
                  isOpen ? "max-h-[200px] mt-4" : "max-h-0"
                }`}
              >
                {faq.a}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
