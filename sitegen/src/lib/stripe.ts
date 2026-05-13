import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  // In dev, allow the app to boot without keys so the admin can land on /admin
  // and see what's missing.
  console.warn("[stripe] STRIPE_SECRET_KEY not set — checkout will fail.");
}

export const stripe = new Stripe(key ?? "sk_test_placeholder", {
  apiVersion: "2024-10-28.acacia",
});

export const PRICE_USD_CENTS = Number(process.env.STRIPE_PRICE_USD_CENTS ?? 65000);
