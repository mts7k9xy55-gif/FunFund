import { NextRequest } from "next/server";
import Stripe from "stripe";

async function callConvex(path: string, body: Record<string, unknown>) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  const convexHttpBase = convexUrl.replace(/\.cloud$/, ".cloud/api");

  const res = await fetch(`${convexHttpBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("Convex HTTP Action failed", path, await res.text());
  }
}

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !stripeWebhookSecret) {
    return new Response("Stripe configuration is missing", { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing signature", { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      stripeWebhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const roomId = session.metadata?.roomId;
      const subscriptionId = (session as any).subscription;

      if (roomId && subscriptionId) {
        await callConvex("/stripe/setRoomStripeInfo", {
          roomId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: subscriptionId,
          status: "active",
        });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        await callConvex("/stripe/updateRoomStatus", {
          stripeSubscriptionId: subscriptionId,
          status: "active",
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription;

      if (subscriptionId) {
        await callConvex("/stripe/updateRoomStatus", {
          stripeSubscriptionId: subscriptionId,
          status: "past_due",
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;

      await callConvex("/stripe/updateRoomStatus", {
        stripeSubscriptionId: sub.id,
        status: "canceled",
      });
      break;
    }

    default:
      break;
  }

  return new Response("ok", { status: 200 });
}
