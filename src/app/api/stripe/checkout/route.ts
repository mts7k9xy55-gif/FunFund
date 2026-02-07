// src/app/api/stripe/checkout/route.ts
// Stripe Checkoutセッション作成

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const { roomId } = await request.json();
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePriceId = process.env.STRIPE_PRICE_ID;

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId is required" },
        { status: 400 }
      );
    }

    if (!stripeSecretKey || !stripePriceId) {
      return NextResponse.json(
        { error: "Stripe configuration is missing" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // Roomの存在確認（Convexから取得）
    // 注意: ここでは簡易的にroomIdのみを使用
    // 実際には認証チェックが必要

    // Stripe Checkoutセッションを作成
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId, // 環境変数から価格IDを取得
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}?session_id={CHECKOUT_SESSION_ID}&room_id=${roomId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}?canceled=true`,
      metadata: {
        roomId: roomId as string,
      },
      subscription_data: {
        metadata: {
          roomId: roomId as string,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
