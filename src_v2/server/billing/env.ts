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

function readRuntimeConfig(): StripeRuntimeConfig {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    priceId: process.env.STRIPE_PRICE_ID ?? "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ?? null,
  };
}

function checkConfig(
  config: StripeRuntimeConfig,
  required: Array<keyof StripeRuntimeConfig>
): StripeConfigCheck {
  const missing = required
    .filter((key) => {
      const value = config[key];
      return value === null || value === "";
    })
    .map((key) => {
      switch (key) {
        case "secretKey":
          return "STRIPE_SECRET_KEY";
        case "webhookSecret":
          return "STRIPE_WEBHOOK_SECRET";
        case "priceId":
          return "STRIPE_PRICE_ID";
        case "siteUrl":
          return "NEXT_PUBLIC_SITE_URL";
        case "convexUrl":
          return "NEXT_PUBLIC_CONVEX_URL";
        default:
          return String(key);
      }
    });

  return {
    ok: missing.length === 0,
    missing,
    config,
  };
}

export function readCheckoutConfig(): StripeConfigCheck {
  const config = readRuntimeConfig();
  return checkConfig(config, ["secretKey", "priceId"]);
}

export function readWebhookConfig(): StripeConfigCheck {
  const config = readRuntimeConfig();
  return checkConfig(config, ["secretKey", "webhookSecret", "convexUrl"]);
}

export function readStripeConfig(): StripeConfigCheck {
  // Backward-compatible helper: strictest check used by older callers.
  const config = readRuntimeConfig();
  return checkConfig(config, ["secretKey", "webhookSecret", "priceId", "convexUrl"]);
}
