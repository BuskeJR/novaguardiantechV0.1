import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.warn(
    "MERCADOPAGO_ACCESS_TOKEN not configured. MercadoPago features will be disabled."
  );
}

export const mercadopago = accessToken
  ? new MercadoPagoConfig({ accessToken })
  : null;

export const MERCADOPAGO_PRICING_PLANS = {
  free: {
    name: "Plano Gratuito",
    price: 0,
    maxDevices: 0,
    maxDomains: 100,
    maxIps: 5,
    billingCycle: "gratuito",
    trialDays: 3,
    description: "Perfeito para começar",
  },
  residencial: {
    name: "Plano Residencial",
    price: 19.90,
    maxDevices: 10,
    maxDomains: 500,
    maxIps: 10,
    billingCycle: "mensal",
    annualDiscount: 15,
    description: "1 a 10 dispositivos em rede",
  },
  plus: {
    name: "Plano Plus Empresarial",
    price: 47.90,
    maxDevices: 25,
    maxDomains: 2000,
    maxIps: 25,
    billingCycle: "mensal",
    annualDiscount: 20,
    description: "1 a 25 dispositivos em rede",
  },
  pro: {
    name: "Plano Pro Empresarial",
    price: 89.90,
    maxDevices: 50,
    maxDomains: 5000,
    maxIps: 50,
    billingCycle: "mensal",
    description: "1 a 50 dispositivos em rede",
    popular: true,
  },
};
