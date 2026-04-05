import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_stub", {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const MEMBERSHIP_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "price_stub";
export const MONTHLY_PRICE_GBP = 2500; // £25.00 in pence
