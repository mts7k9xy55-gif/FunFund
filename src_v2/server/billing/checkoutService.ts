import Stripe from "stripe";
import { readCheckoutConfig } from "./env";

export interface CheckoutResult {
  ok: boolean;
  status: number;
  body: {
    available: boolean;
    url?: string;
    error?: string;
    missing?: string[];
  };
}

function normalizeSiteUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Stripe.errors.StripeError) {
    return error.message;
  }
  return error instanceof Error ? error.message : "Failed to create checkout session";
}

export async function createRoomCheckoutSession(
  roomId: string,
  options?: { siteUrl?: string }
): Promise<CheckoutResult> {
  if (!roomId) {
    return {
      ok: false,
      status: 400,
      body: {
        available: false,
        error: "roomId is required",
      },
    };
  }

  const { ok, missing, config } = readCheckoutConfig();
  if (!ok) {
    return {
      ok: true,
      status: 200,
      body: {
        available: false,
        error: "Stripe checkout is not configured",
        missing,
      },
    };
  }

  try {
    const stripe = new Stripe(config.secretKey);
    const siteUrl = normalizeSiteUrl(options?.siteUrl ?? config.siteUrl);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: config.priceId, quantity: 1 }],
      success_url: `${siteUrl}?session_id={CHECKOUT_SESSION_ID}&room_id=${roomId}`,
      cancel_url: `${siteUrl}?canceled=true`,
      metadata: { roomId },
      subscription_data: {
        metadata: { roomId },
      },
    });

    return {
      ok: true,
      status: 200,
      body: {
        available: true,
        url: session.url ?? undefined,
      },
    };
  } catch (error) {
    const message = toErrorMessage(error);

    // Most checkout creation failures are configuration mismatches (invalid key/price/mode).
    if (error instanceof Stripe.errors.StripeError) {
      return {
        ok: false,
        status: 200,
        body: {
          available: false,
          error: `Stripe checkout configuration error: ${message}`,
        },
      };
    }

    return {
      ok: false,
      status: 500,
      body: {
        available: true,
        error: message,
      },
    };
  }
}
