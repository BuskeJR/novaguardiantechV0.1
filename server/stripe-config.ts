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
  residencial: {
    name: "Plano Residencial",
    price: 1990, // R$19,90 em centavos
    maxDevices: 10,
    maxDomains: 500,
    maxIps: 10,
    billingCycle: "mensal",
    annualDiscount: 15, // 15% de desconto anual
    stripePriceId: process.env.STRIPE_RESIDENCIAL_PRICE_ID,
    description: "1 a 10 dispositivos em rede",
  },
  plus: {
    name: "Plano Plus Empresarial",
    price: 4790, // R$47,90 em centavos
    maxDevices: 25,
    maxDomains: 2000,
    maxIps: 25,
    billingCycle: "mensal",
    annualDiscount: 20, // 20% de desconto anual
    stripePriceId: process.env.STRIPE_PLUS_PRICE_ID,
    description: "1 a 25 dispositivos em rede",
  },
  pro: {
    name: "Plano Pro Empresarial",
    price: 8990, // R$89,90 em centavos
    maxDevices: 50,
    maxDomains: 5000,
    maxIps: 50,
    billingCycle: "mensal",
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    description: "1 a 50 dispositivos em rede",
    popular: true,
  },
};
