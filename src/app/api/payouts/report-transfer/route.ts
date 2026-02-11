import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { postConvexPayout } from "@v2/server/payouts/convexPayoutGateway";

interface ReportTransferBody {
  ledgerId?: string;
  note?: string;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ReportTransferBody;
  try {
    body = (await request.json()) as ReportTransferBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.ledgerId) {
    return NextResponse.json({ error: "ledgerId is required" }, { status: 400 });
  }

  try {
    const result = await postConvexPayout("/payouts/reportTransfer", {
      clerkUserId: userId,
      ledgerId: body.ledgerId,
      note: body.note?.trim() || undefined,
    });

    return NextResponse.json({
      ok: true,
      ledgerId: result.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to report transfer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

