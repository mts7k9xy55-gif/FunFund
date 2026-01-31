import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user's balance
export const getBalance = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }
    return profile.balance;
  },
});

// Get transaction history for a user
export const getTransactionHistory = query({
  args: { 
    profileId: v.id("profiles"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .order("desc")
      .take(limit);
    return transactions;
  },
});

// Deposit money to virtual wallet (チャージ)
export const deposit = mutation({
  args: {
    profileId: v.id("profiles"),
    amount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Deposit amount must be positive");
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const balanceBefore = profile.balance;
    const balanceAfter = balanceBefore + args.amount;
    const now = Date.now();

    // Update profile balance
    await ctx.db.patch(args.profileId, {
      balance: balanceAfter,
      updatedAt: now,
    });

    // Create transaction record
    const transactionId = await ctx.db.insert("transactions", {
      profileId: args.profileId,
      type: "deposit",
      amount: args.amount,
      balanceBefore,
      balanceAfter,
      description: args.description ?? "Deposit to virtual wallet",
      createdAt: now,
    });

    return { transactionId, balanceAfter };
  },
});

// Withdraw money from virtual wallet (出金)
export const withdraw = mutation({
  args: {
    profileId: v.id("profiles"),
    amount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Withdrawal amount must be positive");
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.balance < args.amount) {
      throw new Error("Insufficient balance");
    }

    const balanceBefore = profile.balance;
    const balanceAfter = balanceBefore - args.amount;
    const now = Date.now();

    // Update profile balance
    await ctx.db.patch(args.profileId, {
      balance: balanceAfter,
      updatedAt: now,
    });

    // Create transaction record
    const transactionId = await ctx.db.insert("transactions", {
      profileId: args.profileId,
      type: "withdrawal",
      amount: -args.amount,
      balanceBefore,
      balanceAfter,
      description: args.description ?? "Withdrawal from virtual wallet",
      createdAt: now,
    });

    return { transactionId, balanceAfter };
  },
});

// Contribute to a proposal (支援・拠出)
export const contribute = mutation({
  args: {
    profileId: v.id("profiles"),
    proposalId: v.id("proposals"),
    amount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Contribution amount must be positive");
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.balance < args.amount) {
      throw new Error("Insufficient balance");
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "active") {
      throw new Error("Proposal is not active");
    }

    const balanceBefore = profile.balance;
    const balanceAfter = balanceBefore - args.amount;
    const now = Date.now();

    // Update profile balance
    await ctx.db.patch(args.profileId, {
      balance: balanceAfter,
      updatedAt: now,
    });

    // Update proposal's current amount
    await ctx.db.patch(args.proposalId, {
      currentAmount: proposal.currentAmount + args.amount,
      updatedAt: now,
    });

    // Create transaction record
    const transactionId = await ctx.db.insert("transactions", {
      profileId: args.profileId,
      proposalId: args.proposalId,
      type: "contribution",
      amount: -args.amount,
      balanceBefore,
      balanceAfter,
      description: args.description ?? `Contribution to: ${proposal.title}`,
      createdAt: now,
    });

    return { transactionId, balanceAfter, newProposalAmount: proposal.currentAmount + args.amount };
  },
});

// Refund a contribution (返金)
export const refund = mutation({
  args: {
    profileId: v.id("profiles"),
    proposalId: v.id("proposals"),
    amount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Refund amount must be positive");
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.currentAmount < args.amount) {
      throw new Error("Refund amount exceeds proposal's current amount");
    }

    const balanceBefore = profile.balance;
    const balanceAfter = balanceBefore + args.amount;
    const now = Date.now();

    // Update profile balance
    await ctx.db.patch(args.profileId, {
      balance: balanceAfter,
      updatedAt: now,
    });

    // Update proposal's current amount
    await ctx.db.patch(args.proposalId, {
      currentAmount: proposal.currentAmount - args.amount,
      updatedAt: now,
    });

    // Create transaction record
    const transactionId = await ctx.db.insert("transactions", {
      profileId: args.profileId,
      proposalId: args.proposalId,
      type: "refund",
      amount: args.amount,
      balanceBefore,
      balanceAfter,
      description: args.description ?? `Refund from: ${proposal.title}`,
      createdAt: now,
    });

    return { transactionId, balanceAfter, newProposalAmount: proposal.currentAmount - args.amount };
  },
});

// Get contributions for a specific proposal
export const getContributionsByProposal = query({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    const contributions = await ctx.db
      .query("transactions")
      .withIndex("by_proposalId", (q) => q.eq("proposalId", args.proposalId))
      .filter((q) => q.eq(q.field("type"), "contribution"))
      .collect();
    return contributions;
  },
});

// Get total contributions by a user
export const getTotalContributionsByUser = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const contributions = await ctx.db
      .query("transactions")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .filter((q) => q.eq(q.field("type"), "contribution"))
      .collect();
    
    const total = contributions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { total, count: contributions.length };
  },
});
