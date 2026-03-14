"use client";

import { useState } from "react";

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27C93F" strokeWidth={2} className="flex-shrink-0 mt-0.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const plans = [
  {
    tier: "Starter",
    monthlyPrice: 19,
    yearlyPrice: 190,
    desc: "For individual creators building their initial presence.",
    features: [
      "50 Generations / month",
      "3 Connected platforms",
      "1 Voice profile",
      "Posts & captions",
      "2 hrs/mo transcription",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    tier: "Pro",
    monthlyPrice: 49,
    yearlyPrice: 490,
    desc: "For active creators running multi-channel distribution.",
    features: [
      "300 Generations / month",
      "8 Connected platforms",
      "5 Voice profiles",
      "+ Threads, articles, scripts",
      "Smart scheduling & analytics",
      "10 hrs/mo transcription",
    ],
    cta: "Start 7-Day Trial",
    popular: true,
  },
  {
    tier: "Business",
    monthlyPrice: 99,
    yearlyPrice: 990,
    desc: "For teams, agencies, and high-volume media operations.",
    features: [
      "Unlimited Generations",
      "Unlimited platforms/profiles",
      "+ Video gen, carousels",
      "Bulk scheduling, auto-queue",
      "10 Team members",
      "50 hrs/mo transcription",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="relative z-10 bg-background px-10 py-28">
      <div className="font-mono text-[0.7rem] font-extrabold text-[var(--sp-fg-light)] text-center mb-16 uppercase tracking-[0.25em]">
        05 / Subscription Modules
      </div>
      <h2 className="font-sans text-[clamp(2.4rem,3.5vw,3.8rem)] font-bold tracking-tight leading-tight text-center mb-6">
        Transparent Architecture
      </h2>

      {/* Toggle */}
      <div className="flex justify-center items-center gap-5 mb-16">
        <span className={`font-mono text-sm font-semibold ${!annual ? 'text-[var(--sp-fg)]' : 'text-[var(--sp-fg-light)]'}`}>
          MONTHLY
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-11 h-6 rounded-full transition-colors ${annual ? 'bg-[var(--sp-fg)]' : 'bg-[var(--sp-fg-light)]'}`}
        >
          <div className={`absolute top-[3px] w-[18px] h-[18px] bg-background rounded-full transition-all ${annual ? 'right-[3px]' : 'left-[3px]'}`} />
        </button>
        <span className={`font-mono text-sm ${annual ? 'text-[var(--sp-fg)]' : 'text-[var(--sp-fg-light)]'}`}>
          ANNUAL{" "}
          <span className="text-[var(--sp-green)] bg-[var(--sp-green)]/10 px-2 py-0.5 rounded text-xs ml-1">
            SAVE 17%
          </span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.tier}
            className={`bg-background p-10 rounded-2xl flex flex-col relative ${
              plan.popular
                ? "scale-105 border-2 border-[var(--sp-fg)] shadow-[0_20px_40px_rgba(0,0,0,0.1)] z-[2]"
                : "shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-foreground/[0.04]"
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--sp-fg)] text-background font-mono text-[0.65rem] font-extrabold px-4 py-1.5 rounded-full tracking-[0.1em]">
                MOST POPULAR
              </div>
            )}
            <div className={`font-mono text-sm font-extrabold uppercase tracking-[0.15em] mb-3 ${plan.popular ? 'text-[var(--sp-fg)]' : 'text-[var(--sp-fg-light)]'}`}>
              {plan.tier}
            </div>
            <div className="font-sans text-5xl font-bold tracking-tight mb-2">
              ${annual ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice}
              <small className="text-lg text-[var(--sp-fg-light)] font-medium">/mo</small>
            </div>
            <p className="font-mono text-sm leading-relaxed text-[var(--sp-fg-light)] mb-6 pb-6 border-b border-foreground/[0.06]">
              {plan.desc}
            </p>
            <ul className="list-none mb-10 flex-1 space-y-4">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--sp-fg)] leading-snug">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`h-[54px] px-10 w-full font-sans text-sm font-semibold tracking-wide transition-all ${
                plan.popular
                  ? "bg-[var(--sp-fg)] text-background shadow-md hover:bg-foreground hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-background/40 backdrop-blur-sm text-[var(--sp-fg)] brackets brackets-dark"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
