import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { postConvexPayout } from "@v2/server/payouts/convexPayoutGateway";

interface PayoutRequestBody {
  roomId?: string;
  recipientUserId?: string;
  amount?: number;
  currency?: string;
  method?: "stripe_connect" | "bank_account";
  note?: string;
  distributionProposalId?: string;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PayoutRequestBody;
  try {
    body = (await request.json()) as PayoutRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.roomId || typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json(
      { error: "roomId and positive amount are required" },
      { status: 400 }
    );
  }

  try {
    const result = await postConvexPayout("/payouts/request", {
      clerkUserId: userId,
      roomId: body.roomId,
      recipientUserId: body.recipientUserId,
      amount: body.amount,
      currency: body.currency ?? "JPY",
      method: body.method,
      note: body.note,
      distributionProposalId: body.distributionProposalId,
    });

    return NextResponse.json({
      ok: true,
      ledgerId: result.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create payout request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
