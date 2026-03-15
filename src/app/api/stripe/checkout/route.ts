import { NextRequest, NextResponse } from "next/server";

const isMock = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();

    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid priceId" },
        { status: 400 }
      );
    }

    /* ── Mock mode ── */
    if (isMock) {
      // Simulate a short delay
      await new Promise((r) => setTimeout(r, 300));
      return NextResponse.json({ url: "/dashboard?upgraded=true" });
    }

    /* ── Real mode ── */
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env." },
        { status: 500 }
      );
    }

    // Dynamic import to avoid build errors when Stripe env vars are missing
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { typescript: true });

    // Get user email from Supabase auth
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Look up or create Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Store stripe_customer_id in Supabase
      // Cast needed: stripe_customer_id column added via migration, not yet in generated types
      await (supabase as any)
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?upgraded=true`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    const message =
      error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
