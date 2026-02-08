import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { postConvexPayout } from "@v2/server/payouts/convexPayoutGateway";

function normalizeSiteUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured" },
      { status: 500 }
    );
  }

  const siteUrl = normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin
  );

  try {
    const stripe = new Stripe(secretKey);
    const account = await stripe.accounts.create({
      type: "express",
      metadata: {
        clerkUserId: userId,
        app: "funfund",
      },
      capabilities: {
        transfers: { requested: true },
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${siteUrl}/room?payout=refresh`,
      return_url: `${siteUrl}/room?payout=connected`,
      type: "account_onboarding",
    });

    await postConvexPayout("/payouts/registerAccount", {
      clerkUserId: userId,
      method: "stripe_connect",
      status: "pending",
      externalRef: account.id,
      isDefault: false,
    });

    return NextResponse.json({
      ok: true,
      url: accountLink.url,
      accountId: account.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create Stripe onboarding";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
