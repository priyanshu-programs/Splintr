"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { createCheckoutSession } from "@/lib/stripe-store";
import { useToast } from "@/components/ui/toaster";

/* ── Plan definitions ── */

interface Plan {
  tier: string;
  tierKey: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  /** Env var name for the Stripe price ID (monthly) */
  monthlyPriceEnv: string;
  /** Env var name for the Stripe price ID (yearly) */
  yearlyPriceEnv: string;
}

const plans: Plan[] = [
  {
    tier: "Starter",
    tierKey: "starter",
    monthlyPrice: 19,
    yearlyPrice: 190,
    description: "For individual creators building their initial presence.",
    features: [
      "50 Generations / month",
      "3 Connected platforms",
      "1 Voice profile",
      "Posts & captions",
      "100 item content library",
      "2 hrs/mo transcription",
      "Email support",
    ],
    cta: "Start Free",
    popular: false,
    monthlyPriceEnv: "STRIPE_STARTER_MONTHLY_PRICE_ID",
    yearlyPriceEnv: "STRIPE_STARTER_YEARLY_PRICE_ID",
  },
  {
    tier: "Pro",
    tierKey: "pro",
    monthlyPrice: 49,
    yearlyPrice: 490,
    description: "For active creators running multi-channel distribution.",
    features: [
      "300 Generations / month",
      "8 Connected platforms",
      "5 Voice profiles",
      "Threads, articles & scripts",
      "1,000 item content library",
      "Smart scheduling & analytics",
      "10 hrs/mo transcription",
      "3 Team members",
      "Priority email support",
    ],
    cta: "Start 7-Day Trial",
    popular: true,
    monthlyPriceEnv: "STRIPE_PRO_MONTHLY_PRICE_ID",
    yearlyPriceEnv: "STRIPE_PRO_YEARLY_PRICE_ID",
  },
  {
    tier: "Business",
    tierKey: "business",
    monthlyPrice: 99,
    yearlyPrice: 990,
    description: "For teams, agencies, and high-volume media operations.",
    features: [
      "Unlimited Generations",
      "Unlimited platforms & profiles",
      "Video gen & carousels",
      "Bulk scheduling, auto-queue",
      "Unlimited content library",
      "50 hrs/mo transcription",
      "10 Team members",
      "Export & custom reports",
      "Priority + onboarding call",
    ],
    cta: "Contact Sales",
    popular: false,
    monthlyPriceEnv: "STRIPE_BUSINESS_MONTHLY_PRICE_ID",
    yearlyPriceEnv: "STRIPE_BUSINESS_YEARLY_PRICE_ID",
  },
];

/* ── Price ID mapping (client-side env vars for Stripe price IDs) ── */

const PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY || "price_starter_monthly",
    yearly: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY || "price_starter_yearly",
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY || "price_pro_monthly",
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY || "price_pro_yearly",
  },
  business: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY || "price_business_monthly",
    yearly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY || "price_business_yearly",
  },
};



/* ── Inner page (needs useSearchParams, must be wrapped in Suspense) ── */

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [annual, setAnnual] = useState(true);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast({ message: "Plan upgraded successfully!", type: "success" });
      // Clean up the URL
      router.replace("/pricing", { scroll: false });
    }
  }, [searchParams, router, toast]);

  const handleCheckout = useCallback(
    async (plan: Plan) => {
      // Business tier goes to contact/sales
      if (plan.tierKey === "business") {
        // For now, redirect to signup — replace with a contact form later
        router.push("/signup");
        return;
      }

      setLoadingTier(plan.tierKey);
      setError(null);

      try {
        const priceId = annual
          ? PRICE_IDS[plan.tierKey].yearly
          : PRICE_IDS[plan.tierKey].monthly;

        const { url } = await createCheckoutSession(priceId);
        // Redirect to Stripe Checkout (or mock dashboard URL)
        window.location.href = url;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        setLoadingTier(null);
      }
    },
    [annual, router]
  );

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      {/* Nav */}
      <nav className="h-16 bg-background border-b border-foreground/5 flex items-center px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 border border-[#0A0A0C] flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 stroke-[var(--sp-fg)] fill-none"
              strokeWidth={1.5}
            >
              <path d="M4 12 L20 12 M12 4 L12 20" />
              <circle cx="12" cy="12" r="4" fill="var(--sp-fg)" />
            </svg>
          </div>
          <span className="font-mono text-sm font-bold tracking-wider">
            SPLINTR
          </span>
        </Link>
        <div className="flex-1" />
        <Link
          href="/login"
          className="text-sm font-medium text-[#6A6D75] hover:text-[var(--sp-fg)] mr-4"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="h-9 px-4 bg-[var(--sp-fg)] text-background rounded-lg text-sm font-medium flex items-center hover:bg-foreground transition-colors"
        >
          Get Started
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="font-mono text-xs font-bold tracking-[0.25em] text-[#6A6D75] uppercase mb-3">
            // Pricing
          </p>
          <h1 className="font-sans text-4xl font-bold tracking-tight mb-4">
            Transparent Architecture
          </h1>
          <p className="text-[#6A6D75] max-w-md mx-auto">
            Start free, scale as you grow. All plans include a 7-day trial.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span
            className={`font-mono text-sm font-bold ${
              !annual ? "text-[var(--sp-fg)]" : "text-[#6A6D75]"
            }`}
          >
            MONTHLY
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              annual ? "bg-[var(--sp-fg)]" : "bg-[var(--sp-fg)]/20"
            }`}
          >
            <div
              className={`w-5 h-5 bg-background rounded-full shadow-sm absolute top-0.5 transition-all ${
                annual ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
          <span
            className={`font-mono text-sm font-bold ${
              annual ? "text-[var(--sp-fg)]" : "text-[#6A6D75]"
            }`}
          >
            ANNUAL{" "}
            <span className="text-[#27C93F] bg-[#27C93F]/10 px-2 py-0.5 rounded text-xs ml-1">
              SAVE 17%
            </span>
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-md mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isLoading = loadingTier === plan.tierKey;

            return (
              <div
                key={plan.tier}
                className={`bg-background rounded-2xl p-8 flex flex-col relative ${
                  plan.popular
                    ? "border-2 border-[#0A0A0C] shadow-lg scale-105 z-10"
                    : "border border-foreground/5"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--sp-fg)] text-background font-mono text-[10px] font-bold px-3 py-1 rounded-full tracking-wider">
                    MOST POPULAR
                  </div>
                )}
                <div className="font-mono text-xs font-bold tracking-wider text-[#6A6D75] uppercase mb-2">
                  {plan.tier}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">
                    $
                    {annual
                      ? Math.round(plan.yearlyPrice / 12)
                      : plan.monthlyPrice}
                  </span>
                  <span className="text-[#6A6D75]">/mo</span>
                </div>
                {annual && (
                  <p className="text-xs text-[#6A6D75] mb-4">
                    Billed annually (${plan.yearlyPrice}/yr)
                  </p>
                )}
                <p className="text-sm text-[#6A6D75] mb-6 pb-6 border-b border-foreground/5">
                  {plan.description}
                </p>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-[#27C93F] shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={isLoading || loadingTier !== null}
                  className={`h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    plan.popular
                      ? "bg-[var(--sp-fg)] text-background hover:bg-foreground"
                      : "border border-[#0A0A0C]/10 hover:border-[#0A0A0C]/30"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/"
            className="text-sm text-[#6A6D75] hover:text-[var(--sp-fg)] flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Page export with Suspense boundary for useSearchParams ── */

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#6A6D75]" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
