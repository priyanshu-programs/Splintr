import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export const PLANS = {
  starter: {
    name: "Starter",
    monthlyPriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
    yearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID!,
    price: { monthly: 19, yearly: 190 },
    limits: {
      generations: 50,
      platforms: 3,
      voiceProfiles: 1,
      contentLibrary: 100,
      transcriptionHours: 2,
      teamMembers: 1,
    },
  },
  pro: {
    name: "Pro",
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    yearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
    price: { monthly: 49, yearly: 490 },
    limits: {
      generations: 300,
      platforms: 8,
      voiceProfiles: 5,
      contentLibrary: 1000,
      transcriptionHours: 10,
      teamMembers: 3,
    },
  },
  business: {
    name: "Business",
    monthlyPriceId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID!,
    yearlyPriceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID!,
    price: { monthly: 99, yearly: 990 },
    limits: {
      generations: -1, // unlimited
      platforms: -1,
      voiceProfiles: -1,
      contentLibrary: -1,
      transcriptionHours: 50,
      teamMembers: 10,
    },
  },
} as const;

export type PlanTier = keyof typeof PLANS;
