import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { postConvexPayout } from "@v2/server/payouts/convexPayoutGateway";

interface BankRegisterBody {
  bankCode?: string;
  bankName?: string;
  branchName?: string;
  branchCode?: string;
  accountType?: "ordinary" | "checking" | "savings";
  accountNumber?: string;
  accountHolderName?: string;
  onlineBankingUrl?: string;
  isDefault?: boolean;
}

function isDigits(value: string, length: number): boolean {
  const regex = new RegExp(`^[0-9]{${length}}$`);
  return regex.test(value);
}

function normalizeAccountNumber(value: string): string {
  return value.replace(/[^0-9]/g, "");
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
  const bankCode = body.bankCode?.trim() ?? "";
  const branchName = body.branchName?.trim() ?? "";
  const branchCode = body.branchCode?.trim() ?? "";
  const accountType = body.accountType ?? "ordinary";
  const accountHolderName = body.accountHolderName?.trim() ?? "";
  const accountNumber = normalizeAccountNumber(body.accountNumber?.trim() ?? "");
  const onlineBankingUrl = body.onlineBankingUrl?.trim() ?? undefined;
  const accountLast4 = accountNumber.slice(-4);

  if (!bankName || accountNumber.length < 4 || accountNumber.length > 8) {
    return NextResponse.json(
      { error: "bankName and accountNumber (4-8 digits) are required" },
      { status: 400 }
    );
  }
  if (bankCode && !isDigits(bankCode, 4)) {
    return NextResponse.json({ error: "bankCode must be 4 digits" }, { status: 400 });
  }
  if (branchCode && !isDigits(branchCode, 3)) {
    return NextResponse.json({ error: "branchCode must be 3 digits" }, { status: 400 });
  }
  if (!["ordinary", "checking", "savings"].includes(accountType)) {
    return NextResponse.json({ error: "invalid accountType" }, { status: 400 });
  }

  try {
    const result = await postConvexPayout("/payouts/registerAccount", {
      clerkUserId: userId,
      method: "bank_account",
      status: "active",
      bankCode: bankCode || undefined,
      bankName,
      branchName: branchName || undefined,
      branchCode: branchCode || undefined,
      accountType,
      accountNumber,
      accountHolderName: accountHolderName || undefined,
      onlineBankingUrl,
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
