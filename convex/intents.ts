import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRoomMember, requireUser, requireWritePermission } from "./_guards";

function normalizeOptionalReason(reason: string | undefined): string | undefined {
  const trimmed = reason?.trim();
  return trimmed ? trimmed : undefined;
}

function validateOptionalScore(score: number | undefined): number | undefined {
  if (score === undefined) {
    return undefined;
  }
  if (!Number.isFinite(score) || score < 1 || score > 10) {
    throw new Error("Intent score must be between 1 and 10");
  }
  return Math.round(score);
}

export const createIntent = mutation({
  args: {
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    score: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireWritePermission(ctx, args.roomId, user._id);

    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.roomId !== args.roomId) {
      throw new Error("Thread not found or does not belong to this room");
    }

    const intentId = await ctx.db.insert("intents", {
      roomId: args.roomId,
      threadId: args.threadId,
      score: validateOptionalScore(args.score),
      reason: normalizeOptionalReason(args.reason),
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return intentId;
  },
});

export const listIntents = query({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      return [];
    }

    const membership = await requireRoomMember(ctx, thread.roomId, user._id);

    const intents = await ctx.db
      .query("intents")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    const visibleIntents = intents.filter((intent) => {
      if (!intent.hiddenAt) {
        return true;
      }
      return membership.role === "owner" || intent.createdBy === user._id;
    });

    const authors = await Promise.all(
      visibleIntents.map((intent) => ctx.db.get(intent.createdBy))
    );

    return visibleIntents
      .map((intent, index) => ({
        ...intent,
        authorName: authors[index]?.name ?? "Unknown",
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const setIntentHidden = mutation({
  args: {
    intentId: v.id("intents"),
    hidden: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const intent = await ctx.db.get(args.intentId);
    if (!intent) {
      throw new Error("Intent not found");
    }

    const membership = await requireRoomMember(ctx, intent.roomId, user._id);
    const canModerate = membership.role === "owner" || intent.createdBy === user._id;
    if (!canModerate) {
      throw new Error("Only room owner or sender can update intent visibility");
    }

    await ctx.db.patch(args.intentId, {
      hiddenAt: args.hidden ? Date.now() : undefined,
      hiddenBy: args.hidden ? user._id : undefined,
    });

    return args.intentId;
  },
});

export const deleteIntent = mutation({
  args: {
    intentId: v.id("intents"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const intent = await ctx.db.get(args.intentId);
    if (!intent) {
      throw new Error("Intent not found");
    }

    const membership = await requireRoomMember(ctx, intent.roomId, user._id);
    const canModerate = membership.role === "owner" || intent.createdBy === user._id;
    if (!canModerate) {
      throw new Error("Only room owner or sender can delete intent");
    }

    await ctx.db.delete(args.intentId);
    return args.intentId;
  },
});
