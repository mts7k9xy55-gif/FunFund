import { NextRequest, NextResponse } from "next/server";
import { postConvexPayout } from "@v2/server/payouts/convexPayoutGateway";

interface SettleBody {
  ledgerId?: string;
  status?: "settled" | "failed" | "canceled";
  note?: string;
}

export async function POST(request: NextRequest) {
  const expectedAdminKey = process.env.PAYOUT_ADMIN_KEY;
  if (!expectedAdminKey) {
    return NextResponse.json(
      { error: "PAYOUT_ADMIN_KEY is not configured" },
      { status: 500 }
    );
  }

  const providedAdminKey = request.headers.get("x-admin-key");
  if (!providedAdminKey || providedAdminKey !== expectedAdminKey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: SettleBody;
  try {
    body = (await request.json()) as SettleBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.ledgerId || !body.status) {
    return NextResponse.json(
      { error: "ledgerId and status are required" },
      { status: 400 }
    );
  }

  try {
    const result = await postConvexPayout("/payouts/settle", {
      ledgerId: body.ledgerId,
      status: body.status,
      note: body.note,
      adminKey: expectedAdminKey,
    });

    return NextResponse.json({
      ok: true,
      ledgerId: result.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to settle payout ledger";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
