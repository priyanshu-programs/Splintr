import { NextRequest, NextResponse } from "next/server";

const isMock = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

/**
 * Map a Stripe price ID back to a subscription tier name.
 */
function tierFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_PRO || ""]: "pro",
    [process.env.STRIPE_PRICE_TEAM || ""]: "business",
    // Add starter if needed
  };
  return priceMap[priceId] || "starter";
}

export async function POST(request: NextRequest) {
  /* ── Mock mode: accept anything ── */
  if (isMock) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    // Supabase admin client for DB updates
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    switch (event.type) {
      /* ── Checkout completed: new subscription ── */
      case "checkout.session.completed": {
        const session = event.data.object;
        const supabaseUserId = session.metadata?.supabase_user_id;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        if (supabaseUserId && customerId) {
          // Fetch the subscription to get the price ID
          let tier = "pro";
          if (session.subscription) {
            const subId =
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id;
            const sub = await stripe.subscriptions.retrieve(subId);
            const priceId = sub.items.data[0]?.price?.id;
            if (priceId) {
              tier = tierFromPriceId(priceId);
            }
          }

          // Update user record
          await supabase
            .from("users")
            .update({
              stripe_customer_id: customerId,
              subscription_tier: tier,
              subscription_status: "active",
            })
            .eq("id", supabaseUserId);
        }
        break;
      }

      /* ── Subscription updated: plan change, renewal, etc. ── */
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const priceId = subscription.items.data[0]?.price?.id;
        const tier = priceId ? tierFromPriceId(priceId) : undefined;

        const updateData: Record<string, string> = {
          subscription_status: subscription.status === "active" ? "active" : "past_due",
        };
        if (tier) {
          updateData.subscription_tier = tier;
        }

        await supabase
          .from("users")
          .update(updateData)
          .eq("stripe_customer_id", customerId);
        break;
      }

      /* ── Subscription deleted: downgrade to free ── */
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await supabase
          .from("users")
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      /* ── Invoice paid: could reset usage counters ── */
      case "invoice.paid": {
        // TODO: Reset monthly usage counters when implemented
        break;
      }

      /* ── Invoice payment failed ── */
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          await supabase
            .from("users")
            .update({ subscription_status: "past_due" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      default:
        // Unhandled event type — log but don't fail
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
