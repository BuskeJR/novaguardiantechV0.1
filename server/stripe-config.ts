import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn(
    "STRIPE_SECRET_KEY not configured. Stripe features will be disabled in development."
  );
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2024-10-28.acacia" })
  : null;

export const PRICING_PLANS = {
  free: {
    name: "Gratuito",
    price: 0,
    maxDomains: 100,
    maxIps: 5,
    trialDays: 3,
  },
  pro: {
    name: "Profissional",
    price: 9900, // $99 em centavos
    maxDomains: 1000,
    maxIps: 50,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  enterprise: {
    name: "Empresarial",
    price: 29900, // $299 em centavos
    maxDomains: 10000,
    maxIps: 500,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
};
