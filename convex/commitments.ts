import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getUserOrNull,
  requireRoomMember,
  requireUser,
  requireWritePermission,
} from "./_guards";

function normalizeOptionalText(text: string | undefined) {
  const trimmed = text?.trim();
  return trimmed ? trimmed : undefined;
}

export const upsertCommitment = mutation({
  args: {
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    amount: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireWritePermission(ctx, args.roomId, user._id);

    if (!Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Commitment amount must be greater than 0");
    }

    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.roomId !== args.roomId) {
      throw new Error("Thread not found or does not belong to this room");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("commitments")
      .withIndex("by_thread_supporter", (q) =>
        q.eq("threadId", args.threadId).eq("supporterUserId", user._id)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        amount: Math.round(args.amount),
        note: normalizeOptionalText(args.note),
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("commitments", {
      roomId: args.roomId,
      threadId: args.threadId,
      supporterUserId: user._id,
      amount: Math.round(args.amount),
      note: normalizeOptionalText(args.note),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listThreadCommitments = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedThreadId = ctx.db.normalizeId("threads", args.threadId);
    if (!normalizedThreadId) {
      return {
        commitments: [],
        totalAmount: 0,
        supporterCount: 0,
      };
    }

    const user = await getUserOrNull(ctx);
    if (!user) {
      return {
        commitments: [],
        totalAmount: 0,
        supporterCount: 0,
      };
    }

    const thread = await ctx.db.get(normalizedThreadId);
    if (!thread) {
      return {
        commitments: [],
        totalAmount: 0,
        supporterCount: 0,
      };
    }

    try {
      await requireRoomMember(ctx, thread.roomId, user._id);
    } catch {
      return {
        commitments: [],
        totalAmount: 0,
        supporterCount: 0,
      };
    }

    const commitments = await ctx.db
      .query("commitments")
      .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
      .collect();

    const sorted = commitments.sort((a, b) => b.updatedAt - a.updatedAt);
    const users = await Promise.all(sorted.map((row) => ctx.db.get(row.supporterUserId)));

    return {
      commitments: sorted.map((row, index) => ({
        ...row,
        supporterName: users[index]?.name ?? "Unknown",
      })),
      totalAmount: sorted.reduce((sum, row) => sum + row.amount, 0),
      supporterCount: sorted.length,
    };
  },
});
