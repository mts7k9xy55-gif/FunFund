import { httpAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRoomMember, requireUser } from "./_guards";

type PayoutMethod = "stripe_connect" | "bank_account";
type AccountType = "ordinary" | "checking" | "savings";

async function findOrCreateUserByClerkId(ctx: any, clerkUserId: string) {
  let user = await ctx.db
    .query("users")
    .withIndex("by_userId", (q: any) => q.eq("userId", clerkUserId))
    .first();

  if (user) {
    return user;
  }

  const userId = await ctx.db.insert("users", {
    userId: clerkUserId,
    name: "Unknown",
    role: "human",
    reputation: 1,
    createdAt: Date.now(),
  });
  user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Failed to create user");
  }
  return user;
}

async function normalizeDefaultAccount(
  ctx: any,
  userId: string,
  accountIdToKeepDefault: string
) {
  const accounts = await ctx.db
    .query("payoutAccounts")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect();

  await Promise.all(
    accounts
      .filter((account: any) => account._id !== accountIdToKeepDefault && account.isDefault)
      .map((account: any) =>
        ctx.db.patch(account._id, {
          isDefault: false,
          updatedAt: Date.now(),
        })
      )
  );
}

function resolveLedgerMethod(method?: PayoutMethod): PayoutMethod | "unspecified" {
  return method ?? "unspecified";
}

async function registerPayoutAccountCore(
  ctx: any,
  args: {
    clerkUserId: string;
    method: "stripe_connect" | "bank_account";
    status?: "pending" | "active" | "disabled";
    externalRef?: string;
    bankName?: string;
    bankCode?: string;
    branchName?: string;
    branchCode?: string;
    accountType?: AccountType;
    accountNumber?: string;
    accountHolderName?: string;
    onlineBankingUrl?: string;
    accountLast4?: string;
    isDefault?: boolean;
  }
) {
  const user = await findOrCreateUserByClerkId(ctx, args.clerkUserId);
  const normalizedAccountNumber = args.accountNumber?.replace(/[^0-9]/g, "");
  const normalizedAccountLast4 =
    args.accountLast4 ?? normalizedAccountNumber?.slice(-4);

  const userAccounts = await ctx.db
    .query("payoutAccounts")
    .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
    .collect();

  const existing = userAccounts.find((account: any) => {
    if (args.externalRef && account.externalRef) {
      return account.method === args.method && account.externalRef === args.externalRef;
    }
    if (
      args.method === "bank_account" &&
      normalizedAccountNumber &&
      args.branchCode &&
      (args.bankCode || args.bankName)
    ) {
      return (
        account.method === args.method &&
        account.accountNumber === normalizedAccountNumber &&
        account.branchCode === args.branchCode &&
        (args.bankCode ? account.bankCode === args.bankCode : account.bankName === args.bankName)
      );
    }
    return (
      account.method === args.method &&
      account.accountLast4 === normalizedAccountLast4 &&
      account.bankName === args.bankName
    );
  });

  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, {
      status: args.status ?? "active",
      externalRef: args.externalRef,
      bankName: args.bankName,
      bankCode: args.bankCode,
      branchName: args.branchName,
      branchCode: args.branchCode,
      accountType: args.accountType,
      accountNumber: normalizedAccountNumber,
      accountHolderName: args.accountHolderName,
      onlineBankingUrl: args.onlineBankingUrl,
      accountLast4: normalizedAccountLast4,
      isDefault: args.isDefault ?? existing.isDefault,
      updatedAt: now,
    });
    if (args.isDefault ?? existing.isDefault) {
      await normalizeDefaultAccount(ctx, user._id, existing._id);
    }
    return existing._id;
  }

  const accountId = await ctx.db.insert("payoutAccounts", {
    userId: user._id,
    method: args.method,
    status: args.status ?? "active",
    externalRef: args.externalRef,
    bankName: args.bankName,
    bankCode: args.bankCode,
    branchName: args.branchName,
    branchCode: args.branchCode,
    accountType: args.accountType,
    accountNumber: normalizedAccountNumber,
    accountHolderName: args.accountHolderName,
    onlineBankingUrl: args.onlineBankingUrl,
    accountLast4: normalizedAccountLast4,
    isDefault: args.isDefault ?? userAccounts.length === 0,
    createdAt: now,
    updatedAt: now,
  });

  const account = await ctx.db.get(accountId);
  if (account?.isDefault) {
    await normalizeDefaultAccount(ctx, user._id, accountId);
  }

  return accountId;
}

async function createPayoutRequestCore(
  ctx: any,
  args: {
    clerkUserId: string;
    roomId: any;
    recipientUserId?: any;
    amount: number;
    currency?: string;
    method?: "stripe_connect" | "bank_account";
    note?: string;
    distributionProposalId?: any;
  }
) {
  if (args.amount <= 0) {
    throw new Error("amount must be positive");
  }

  const requester = await findOrCreateUserByClerkId(ctx, args.clerkUserId);
  const membership = await requireRoomMember(ctx, args.roomId, requester._id);

  const recipientUserId = args.recipientUserId ?? requester._id;
  const roomMembers = await ctx.db
    .query("roomMembers")
    .withIndex("by_room", (q: any) => q.eq("roomId", args.roomId))
    .collect();

  const recipientMembership = roomMembers.find(
    (member: any) => member.userId === recipientUserId
  );
  if (!recipientMembership) {
    throw new Error("recipient is not a member of this room");
  }

  if (membership.role !== "owner" && requester._id !== recipientUserId) {
    throw new Error("only owners can request payout for other members");
  }

  const payoutAccounts = await ctx.db
    .query("payoutAccounts")
    .withIndex("by_userId", (q: any) => q.eq("userId", recipientUserId))
    .collect();

  const activeAccounts = payoutAccounts.filter(
    (account: any) => account.status === "active"
  );
  const selectedAccount =
    activeAccounts.find((account: any) => args.method && account.method === args.method) ??
    activeAccounts.find((account: any) => account.isDefault) ??
    activeAccounts[0];

  const method = selectedAccount?.method ?? resolveLedgerMethod(args.method);
  const status = selectedAccount ? "pending" : "requires_method";
  const now = Date.now();

  return await ctx.db.insert("payoutLedger", {
    roomId: args.roomId,
    recipientUserId,
    amount: Math.round(args.amount),
    currency: args.currency ?? "JPY",
    status,
    method,
    requestedBy: requester._id,
    settledBy: undefined,
    payoutAccountId: selectedAccount?._id,
    distributionProposalId: args.distributionProposalId,
    requestedAt: now,
    settledAt: undefined,
    note: args.note,
    createdAt: now,
    updatedAt: now,
  });
}

async function settlePayoutLedgerCore(
  ctx: any,
  args: {
    ledgerId: any;
    status: "settled" | "failed" | "canceled";
    note?: string;
    adminKey: string;
  }
) {
  const expected = process.env.PAYOUT_ADMIN_KEY ?? "";
  if (!expected || args.adminKey !== expected) {
    throw new Error("invalid admin key");
  }

  const row = await ctx.db.get(args.ledgerId);
  if (!row) {
    throw new Error("ledger entry not found");
  }

  await ctx.db.patch(args.ledgerId, {
    status: args.status,
    note: args.note ?? row.note,
    settledAt: args.status === "settled" ? Date.now() : row.settledAt,
    updatedAt: Date.now(),
  });

  return args.ledgerId;
}

function mergeNotes(currentNote?: string, extraNote?: string) {
  if (!extraNote?.trim()) {
    return currentNote;
  }
  if (!currentNote?.trim()) {
    return extraNote.trim();
  }
  return `${currentNote}\n${extraNote.trim()}`;
}

async function reportPayoutTransferCore(
  ctx: any,
  args: {
    clerkUserId: string;
    ledgerId: any;
    note?: string;
  }
) {
  const reporter = await findOrCreateUserByClerkId(ctx, args.clerkUserId);
  const ledger = await ctx.db.get(args.ledgerId);
  if (!ledger) {
    throw new Error("ledger entry not found");
  }

  const membership = await requireRoomMember(ctx, ledger.roomId, reporter._id);
  const canReport =
    membership.role === "owner" ||
    ledger.requestedBy === reporter._id ||
    ledger.recipientUserId === reporter._id;
  if (!canReport) {
    throw new Error("you are not allowed to report this transfer");
  }

  if (ledger.status === "settled" || ledger.status === "canceled") {
    throw new Error("this payout is already finalized");
  }

  const note = mergeNotes(
    ledger.note,
    args.note ?? `Manual transfer reported at ${new Date().toISOString()}`
  );

  await ctx.db.patch(args.ledgerId, {
    status: "ready",
    note,
    updatedAt: Date.now(),
  });

  return args.ledgerId;
}

export const registerPayoutAccountByClerkUserId = mutation({
  args: {
    clerkUserId: v.string(),
    method: v.union(v.literal("stripe_connect"), v.literal("bank_account")),
    status: v.optional(v.union(v.literal("pending"), v.literal("active"), v.literal("disabled"))),
    externalRef: v.optional(v.string()),
    bankName: v.optional(v.string()),
    bankCode: v.optional(v.string()),
    branchName: v.optional(v.string()),
    branchCode: v.optional(v.string()),
    accountType: v.optional(
      v.union(v.literal("ordinary"), v.literal("checking"), v.literal("savings"))
    ),
    accountNumber: v.optional(v.string()),
    accountHolderName: v.optional(v.string()),
    onlineBankingUrl: v.optional(v.string()),
    accountLast4: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => await registerPayoutAccountCore(ctx, args),
});

export const createPayoutRequestByClerkUserId = mutation({
  args: {
    clerkUserId: v.string(),
    roomId: v.id("rooms"),
    recipientUserId: v.optional(v.id("users")),
    amount: v.number(),
    currency: v.optional(v.string()),
    method: v.optional(
      v.union(v.literal("stripe_connect"), v.literal("bank_account"))
    ),
    note: v.optional(v.string()),
    distributionProposalId: v.optional(v.id("distributionProposals")),
  },
  handler: async (ctx, args) => await createPayoutRequestCore(ctx, args),
});

export const settlePayoutLedgerByAdmin = mutation({
  args: {
    ledgerId: v.id("payoutLedger"),
    status: v.union(v.literal("settled"), v.literal("failed"), v.literal("canceled")),
    note: v.optional(v.string()),
    adminKey: v.string(),
  },
  handler: async (ctx, args) => await settlePayoutLedgerCore(ctx, args),
});

export const reportPayoutTransferByClerkUserId = mutation({
  args: {
    clerkUserId: v.string(),
    ledgerId: v.id("payoutLedger"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => await reportPayoutTransferCore(ctx, args),
});

export const listMyPayoutAccounts = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("payoutAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const listRoomPayoutLedger = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireRoomMember(ctx, args.roomId, user._id);

    return await ctx.db
      .query("payoutLedger")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();
  },
});

export const listMembersMissingPayoutMethod = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireRoomMember(ctx, args.roomId, user._id);

    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const result = await Promise.all(
      members.map(async (member) => {
        const accounts = await ctx.db
          .query("payoutAccounts")
          .withIndex("by_userId", (q) => q.eq("userId", member.userId))
          .collect();
        const hasActiveAccount = accounts.some((account) => account.status === "active");
        const memberUser = await ctx.db.get(member.userId);
        return {
          userId: member.userId,
          userName: memberUser?.name ?? "Unknown",
          hasActiveAccount,
        };
      })
    );

    return result.filter((member) => !member.hasActiveAccount);
  },
});

export const listRoomPayoutDestinations = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireRoomMember(ctx, args.roomId, user._id);

    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const destinations = await Promise.all(
      members.map(async (member) => {
        const accounts = await ctx.db
          .query("payoutAccounts")
          .withIndex("by_userId", (q) => q.eq("userId", member.userId))
          .collect();
        const activeAccounts = accounts.filter((account) => account.status === "active");
        const selected =
          activeAccounts.find((account) => account.isDefault) ?? activeAccounts[0] ?? null;
        const memberUser = await ctx.db.get(member.userId);

        return {
          userId: member.userId,
          userName: memberUser?.name ?? "Unknown",
          role: member.role,
          payoutAccount: selected
            ? {
                accountId: selected._id,
                method: selected.method,
                bankName: selected.bankName,
                bankCode: selected.bankCode,
                branchName: selected.branchName,
                branchCode: selected.branchCode,
                accountType: selected.accountType,
                accountNumber: selected.accountNumber,
                accountHolderName: selected.accountHolderName,
                onlineBankingUrl: selected.onlineBankingUrl,
                accountLast4: selected.accountLast4,
              }
            : null,
        };
      })
    );

    return destinations;
  },
});

export const registerPayoutAccountHttp = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = (await request.json()) as {
    clerkUserId?: string;
    method?: "stripe_connect" | "bank_account";
    status?: "pending" | "active" | "disabled";
    externalRef?: string;
    bankName?: string;
    bankCode?: string;
    branchName?: string;
    branchCode?: string;
    accountType?: AccountType;
    accountNumber?: string;
    accountHolderName?: string;
    onlineBankingUrl?: string;
    accountLast4?: string;
    isDefault?: boolean;
  };

  if (!body.clerkUserId || !body.method) {
    return new Response("Missing clerkUserId or method", { status: 400 });
  }

  const id = await registerPayoutAccountCore(ctx, {
    clerkUserId: body.clerkUserId,
    method: body.method,
    status: body.status,
    externalRef: body.externalRef,
    bankName: body.bankName,
    bankCode: body.bankCode,
    branchName: body.branchName,
    branchCode: body.branchCode,
    accountType: body.accountType,
    accountNumber: body.accountNumber,
    accountHolderName: body.accountHolderName,
    onlineBankingUrl: body.onlineBankingUrl,
    accountLast4: body.accountLast4,
    isDefault: body.isDefault,
  });

  return new Response(JSON.stringify({ id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

export const createPayoutRequestHttp = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = (await request.json()) as {
    clerkUserId?: string;
    roomId?: string;
    recipientUserId?: string;
    amount?: number;
    currency?: string;
    method?: "stripe_connect" | "bank_account";
    note?: string;
    distributionProposalId?: string;
  };

  if (!body.clerkUserId || !body.roomId || !body.amount) {
    return new Response("Missing required fields", { status: 400 });
  }

  const id = await createPayoutRequestCore(ctx, {
    clerkUserId: body.clerkUserId,
    roomId: body.roomId as any,
    recipientUserId: body.recipientUserId as any,
    amount: body.amount,
    currency: body.currency,
    method: body.method,
    note: body.note,
    distributionProposalId: body.distributionProposalId as any,
  });

  return new Response(JSON.stringify({ id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

export const settlePayoutLedgerHttp = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = (await request.json()) as {
    ledgerId?: string;
    status?: "settled" | "failed" | "canceled";
    note?: string;
    adminKey?: string;
  };

  if (!body.ledgerId || !body.status || !body.adminKey) {
    return new Response("Missing ledgerId, status or adminKey", { status: 400 });
  }

  const id = await settlePayoutLedgerCore(ctx, {
    ledgerId: body.ledgerId as any,
    status: body.status,
    note: body.note,
    adminKey: body.adminKey,
  });

  return new Response(JSON.stringify({ id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

export const reportPayoutTransferHttp = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = (await request.json()) as {
    clerkUserId?: string;
    ledgerId?: string;
    note?: string;
  };

  if (!body.clerkUserId || !body.ledgerId) {
    return new Response("Missing clerkUserId or ledgerId", { status: 400 });
  }

  const id = await reportPayoutTransferCore(ctx, {
    clerkUserId: body.clerkUserId,
    ledgerId: body.ledgerId as any,
    note: body.note,
  });

  return new Response(JSON.stringify({ id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
