import Stripe from "stripe";
import { readWebhookConfig } from "./env";
import {
  registerStripeEvent,
  setRoomStripeInfo,
  updateRoomStatus,
} from "./convexBillingClient";

export interface WebhookResult {
  status: number;
  body: string;
}

function extractSubscriptionId(
  value: string | Stripe.Subscription | null | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }
  return typeof value === "string" ? value : value.id;
}

function extractCustomerId(
  value:
    | string
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | null
    | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }
  return typeof value === "string" ? value : value.id;
}

export async function processStripeWebhook(payload: {
  signature: string | null;
  rawBody: string;
}): Promise<WebhookResult> {
  const { ok, missing, config } = readWebhookConfig();
  if (!ok) {
    return {
      status: 500,
      body: `Stripe configuration is missing: ${missing.join(", ")}`,
    };
  }

  if (!payload.signature) {
    return {
      status: 400,
      body: "Missing signature",
    };
  }

  const stripe = new Stripe(config.secretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload.rawBody, payload.signature, config.webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed", error);
    return {
      status: 400,
      body: "Invalid signature",
    };
  }

  const dedupe = await registerStripeEvent({
    eventId: event.id,
    eventType: event.type,
  }).catch((error) => {
    console.error("Failed to register Stripe event dedupe marker", error);
    return { duplicate: false };
  });

  if (dedupe.duplicate) {
    return {
      status: 200,
      body: "duplicate_ignored",
    };
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const roomId = session.metadata?.roomId;
        const subscriptionId = extractSubscriptionId(session.subscription);
        const customerId = extractCustomerId(session.customer);

        if (roomId && subscriptionId) {
          if (customerId) {
            await setRoomStripeInfo({
              roomId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              status: "active",
            });
          } else {
            await updateRoomStatus({
              roomId,
              status: "active",
            });
          }
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = extractCustomerId(invoice.customer);

        if (customerId) {
          await updateRoomStatus({
            stripeCustomerId: customerId,
            status: "active",
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = extractCustomerId(invoice.customer);

        if (customerId) {
          await updateRoomStatus({
            stripeCustomerId: customerId,
            status: "past_due",
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = extractCustomerId(subscription.customer);
        if (!customerId) {
          break;
        }
        await updateRoomStatus({
          stripeCustomerId: customerId,
          status: "canceled",
        });
        break;
      }
      default:
        break;
    }

    return {
      status: 200,
      body: "ok",
    };
  } catch (error) {
    console.error("Failed to process Stripe webhook", error);
    return {
      status: 500,
      body: "Webhook processing failed",
    };
  }
}
