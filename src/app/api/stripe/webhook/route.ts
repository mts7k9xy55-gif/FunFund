// src/app/api/stripe/webhook/route.ts
// Stripe Webhookハンドラー

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

// Convex HTTP ActionエンドポイントのベースURL
const getConvexHttpActionUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  // ConvexのHTTP ActionエンドポイントはベースURL + パス
  // 例: https://xxx.convex.cloud/stripe/updateRoomStatus
  return `${baseUrl}${path}`;
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Webhook署名検証
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    // イベントタイプに応じて処理
    switch (event.type) {
      case "invoice.paid": {
        // サブスクリプション支払い成功 → active
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        if (!subscriptionId) {
          console.error("No subscription ID in invoice.paid event");
          break;
        }

        // Subscriptionからmetadataを取得
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const roomId = subscription.metadata?.roomId;

        if (!roomId) {
          console.error("No roomId in subscription metadata");
          break;
        }

        // Convex HTTP Actionを呼び出し
        const response = await fetch(getConvexHttpActionUrl("/stripe/updateRoomStatus"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, status: "active" }),
        });

        if (!response.ok) {
          throw new Error(`Convex action failed: ${response.statusText}`);
        }

        console.log(`Room ${roomId} set to active`);
        break;
      }

      case "customer.subscription.deleted": {
        // サブスクリプション削除 → canceled
        const subscription = event.data.object as Stripe.Subscription;
        const roomId = subscription.metadata?.roomId;

        if (!roomId) {
          console.error("No roomId in subscription metadata");
          break;
        }

        const response = await fetch(getConvexHttpActionUrl("/stripe/updateRoomStatus"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, status: "canceled" }),
        });

        if (!response.ok) {
          throw new Error(`Convex action failed: ${response.statusText}`);
        }

        console.log(`Room ${roomId} set to canceled`);
        break;
      }

      case "invoice.payment_failed": {
        // 支払い失敗 → past_due
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) {
          console.error("No subscription ID in invoice.payment_failed event");
          break;
        }

        // Subscriptionからmetadataを取得
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const roomId = subscription.metadata?.roomId;

        if (!roomId) {
          console.error("No roomId in subscription metadata");
          break;
        }

        const response = await fetch(getConvexHttpActionUrl("/stripe/updateRoomStatus"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, status: "past_due" }),
        });

        if (!response.ok) {
          throw new Error(`Convex action failed: ${response.statusText}`);
        }

        console.log(`Room ${roomId} set to past_due`);
        break;
      }

      case "checkout.session.completed": {
        // Checkout完了時にStripe情報を保存
        const session = event.data.object as Stripe.Checkout.Session;
        const roomId = session.metadata?.roomId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!roomId || !customerId || !subscriptionId) {
          console.error("Missing required fields in checkout.session.completed");
          break;
        }

        // Convex HTTP ActionでStripe情報を保存
        const saveInfoResponse = await fetch(getConvexHttpActionUrl("/stripe/setRoomStripeInfo"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          }),
        });

        if (!saveInfoResponse.ok) {
          throw new Error(`Convex action failed: ${saveInfoResponse.statusText}`);
        }

        // 初回支払いが成功している場合はactiveに設定
        if (session.payment_status === "paid") {
          const activateResponse = await fetch(getConvexHttpActionUrl("/stripe/updateRoomStatus"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, status: "active" }),
          });

          if (!activateResponse.ok) {
            throw new Error(`Convex action failed: ${activateResponse.statusText}`);
          }
        }

        console.log(`Room ${roomId} Stripe info saved`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}
