import { NextRequest, NextResponse } from "next/server";
import { createRoomCheckoutSession } from "@v2/server/billing/checkoutService";
import { isV2BillingEnabled } from "@/lib/featureFlags";

interface CheckoutRequestBody {
  roomId?: string;
}

export async function POST(request: NextRequest) {
  if (!isV2BillingEnabled()) {
    return NextResponse.json(
      {
        available: false,
        error: "v2 billing is disabled",
      },
      { status: 503 }
    );
  }

  let roomId = "";

  try {
    const body = (await request.json()) as CheckoutRequestBody;
    roomId = body.roomId ?? "";
  } catch {
    return NextResponse.json(
      {
        available: false,
        error: "Invalid JSON body",
      },
      { status: 400 }
    );
  }

  const result = await createRoomCheckoutSession(roomId, {
    siteUrl: request.nextUrl.origin,
  });
  return NextResponse.json(result.body, { status: result.status });
}
