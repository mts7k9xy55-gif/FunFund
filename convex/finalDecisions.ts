import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getUserOrNull,
  requireOwnerPermission,
  requireRoomMember,
  requireUser,
} from "./_guards";

export const finalizeDecision = mutation({
  args: {
    threadId: v.id("threads"),
    conclusion: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    await requireOwnerPermission(ctx, thread.roomId, user._id);

    const conclusion = args.conclusion.trim();
    if (!conclusion) {
      throw new Error("Final decision conclusion is required");
    }

    const existing = await ctx.db
      .query("finalDecisions")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    const currentRows = existing.filter((row) => row.isCurrent);
    await Promise.all(currentRows.map((row) => ctx.db.patch(row._id, { isCurrent: false })));

    const maxVersion = existing.reduce((max, row) => Math.max(max, row.version), 0);

    const finalDecisionId = await ctx.db.insert("finalDecisions", {
      roomId: thread.roomId,
      threadId: args.threadId,
      version: maxVersion + 1,
      isCurrent: true,
      conclusion,
      note: args.note?.trim() || undefined,
      decidedBy: user._id,
      decidedAt: Date.now(),
    });

    return finalDecisionId;
  },
});

export const listFinalDecisions = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    let normalizedThreadId = null;
    try {
      normalizedThreadId = ctx.db.normalizeId("threads", args.threadId);
    } catch {
      return [];
    }
    if (!normalizedThreadId) {
      return [];
    }
    const user = await getUserOrNull(ctx);
    if (!user) {
      return [];
    }
    const thread = await ctx.db.get(normalizedThreadId);
    if (!thread) {
      return [];
    }

    const membership = await (async () => {
      try {
        return await requireRoomMember(ctx, thread.roomId, user._id);
      } catch {
        return null;
      }
    })();
    if (!membership) {
      return [];
    }

    const decisions = await ctx.db
      .query("finalDecisions")
      .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
      .collect();

    const deciders = await Promise.all(
      decisions.map((decision) => ctx.db.get(decision.decidedBy))
    );

    return decisions
      .map((decision, index) => ({
        ...decision,
        deciderName: deciders[index]?.name ?? "Unknown",
      }))
      .sort((a, b) => b.version - a.version);
  },
});
