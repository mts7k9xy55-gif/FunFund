import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  requireReason,
  requireRoomMember,
  requireUser,
  requireWritePermission,
} from "./_guards";

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeOptions(options: string[] | undefined): string[] | undefined {
  if (!options) {
    return undefined;
  }
  const normalized = options.map((row) => row.trim()).filter((row) => row.length > 0);
  return normalized.length > 0 ? normalized : undefined;
}

export const createThreadV2 = mutation({
  args: {
    roomId: v.id("rooms"),
    type: v.union(v.literal("comment"), v.literal("proposal"), v.literal("project")),
    title: v.string(),
    initialBody: v.string(),
    reason: v.optional(v.string()),
    decisionOwnerId: v.optional(v.id("users")),
    dueAt: v.optional(v.number()),
    meetingUrl: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    commitmentGoalAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    await requireWritePermission(ctx, args.roomId, user._id);

    if (args.type === "proposal" || args.type === "project") {
      requireReason(args.reason, `${args.type} creation`);
    }
    if (args.decisionOwnerId) {
      await requireRoomMember(ctx, args.roomId, args.decisionOwnerId);
    }
    if (args.dueAt !== undefined && (!Number.isFinite(args.dueAt) || args.dueAt <= 0)) {
      throw new Error("Invalid dueAt");
    }
    if (
      args.commitmentGoalAmount !== undefined &&
      (!Number.isFinite(args.commitmentGoalAmount) || args.commitmentGoalAmount <= 0)
    ) {
      throw new Error("Invalid commitment goal amount");
    }

    const now = Date.now();
    const threadId = await ctx.db.insert("threads", {
      roomId: args.roomId,
      type: args.type,
      title: normalizeOptionalText(args.title),
      decisionOwnerId: args.decisionOwnerId,
      dueAt: args.dueAt,
      meetingUrl: normalizeOptionalText(args.meetingUrl),
      options: normalizeOptions(args.options),
      commitmentGoalAmount:
        args.commitmentGoalAmount !== undefined
          ? Math.round(args.commitmentGoalAmount)
          : undefined,
      createdBy: user._id,
      createdAt: now,
    });

    await ctx.db.insert("messages", {
      roomId: args.roomId,
      threadId,
      kind: "comment",
      body: args.initialBody,
      createdBy: user._id,
      createdAt: now,
    });

    if (args.reason) {
      await ctx.db.insert("messages", {
        roomId: args.roomId,
        threadId,
        kind: "reason",
        body: args.reason,
        createdBy: user._id,
        createdAt: now,
      });
    }

    return threadId;
  },
});
