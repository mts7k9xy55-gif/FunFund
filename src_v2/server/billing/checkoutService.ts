import Stripe from "stripe";
import { readStripeConfig } from "./env";

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

export async function createRoomCheckoutSession(roomId: string): Promise<CheckoutResult> {
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

  const { ok, missing, config } = readStripeConfig();
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
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: config.priceId, quantity: 1 }],
      success_url: `${config.siteUrl}?session_id={CHECKOUT_SESSION_ID}&room_id=${roomId}`,
      cancel_url: `${config.siteUrl}?canceled=true`,
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
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
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
