import { NextRequest, NextResponse } from "next/server";

const isMock = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

export async function POST(request: NextRequest) {
  try {
    /* ── Mock mode ── */
    if (isMock) {
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json({ url: "/settings?tab=billing" });
    }

    /* ── Real mode ── */
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env." },
        { status: 500 }
      );
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { typescript: true });

    // Get user from Supabase auth
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get stripe_customer_id from users table
    // Cast needed: stripe_customer_id column added via migration, not yet in generated types
    const { data: profile } = await (supabase as any)
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe to a plan first." },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings?tab=billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    const message =
      error instanceof Error ? error.message : "Portal session failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
