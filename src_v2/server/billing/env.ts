export interface StripeRuntimeConfig {
  secretKey: string;
  webhookSecret: string;
  priceId: string;
  siteUrl: string;
  convexUrl: string | null;
}

export interface StripeConfigCheck {
  ok: boolean;
  missing: string[];
  config: StripeRuntimeConfig;
}

export function readStripeConfig(): StripeConfigCheck {
  const config: StripeRuntimeConfig = {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    priceId: process.env.STRIPE_PRICE_ID ?? "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ?? null,
  };

  const missing: string[] = [];
  if (!config.secretKey) missing.push("STRIPE_SECRET_KEY");
  if (!config.webhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!config.priceId) missing.push("STRIPE_PRICE_ID");

  return {
    ok: missing.length === 0,
    missing,
    config,
  };
}
