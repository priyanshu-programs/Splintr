import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    // TODO: Verify webhook signature using stripe.webhooks.constructEvent
    // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);

    // TODO: Handle events:
    // - checkout.session.completed → create user, set subscription_tier
    // - invoice.paid → reset monthly usage counters
    // - invoice.payment_failed → set status to past_due, send email
    // - customer.subscription.updated → sync plan changes
    // - customer.subscription.deleted → downgrade to free

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
