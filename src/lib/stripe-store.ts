/**
 * stripe-store.ts
 *
 * Dual-mode storage layer for Stripe billing.
 * - Mock mode (NEXT_PUBLIC_MOCK_AUTH=true): returns mock URLs and subscription data
 * - Real mode: calls server-side API routes that interact with Stripe
 */

/* ── Types ── */

export interface SubscriptionInfo {
  plan: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutResult {
  url: string;
}

export interface PortalResult {
  url: string;
}

/* ── Mock helpers ── */

const MOCK_SUBSCRIPTION: SubscriptionInfo = {
  plan: "pro",
  status: "active",
  currentPeriodEnd: new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString(),
  cancelAtPeriodEnd: false,
};

/* ── Public API ── */

/**
 * Create a Stripe Checkout session for a given price ID.
 * In mock mode, returns a fake redirect URL.
 */
export async function createCheckoutSession(
  priceId: string
): Promise<CheckoutResult> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Checkout failed" }));
    throw new Error(err.error || "Failed to create checkout session");
  }

  return res.json();
}

/**
 * Create a Stripe Billing Portal session.
 * In mock mode, returns a fake redirect URL.
 */
export async function createPortalSession(): Promise<PortalResult> {
  const res = await fetch("/api/stripe/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Portal failed" }));
    throw new Error(err.error || "Failed to create portal session");
  }

  return res.json();
}

/**
 * Get the current user's subscription info.
 * In mock mode, returns mock subscription data.
 * In real mode, fetches from the server.
 */
export async function getCurrentSubscription(): Promise<SubscriptionInfo | null> {
  const isMock = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

  if (isMock) {
    // Check localStorage for any mock subscription overrides
    const stored = localStorage.getItem("splintr_mock_subscription");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall through to default
      }
    }
    return MOCK_SUBSCRIPTION;
  }

  // Real mode: fetch from Supabase via API or directly
  // For now, return null — the settings page already handles this via settings-store
  return null;
}
