import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { postConvexPayout } from "@v2/server/payouts/convexPayoutGateway";

interface BankRegisterBody {
  bankName?: string;
  accountLast4?: string;
  isDefault?: boolean;
}

function isValidLast4(value: string): boolean {
  return /^[0-9]{4}$/.test(value);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: BankRegisterBody;
  try {
    body = (await request.json()) as BankRegisterBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bankName = body.bankName?.trim() ?? "";
  const accountLast4 = body.accountLast4?.trim() ?? "";
  if (!bankName || !isValidLast4(accountLast4)) {
    return NextResponse.json(
      { error: "bankName and accountLast4 (4 digits) are required" },
      { status: 400 }
    );
  }

  try {
    const result = await postConvexPayout("/payouts/registerAccount", {
      clerkUserId: userId,
      method: "bank_account",
      status: "active",
      bankName,
      accountLast4,
      isDefault: body.isDefault ?? true,
    });

    return NextResponse.json({
      ok: true,
      accountId: result.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to register bank account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
