import { v } from "convex/values";
import { query } from "./_generated/server";
import { getUserOrNull, requireRoomMember } from "./_guards";

function safeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function compactUndefined<T extends Record<string, unknown>>(row: T): T {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined) {
      next[key] = value;
    }
  }
  return next as T;
}

export const getThreadMeta = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    let normalizedThreadId = null;
    try {
      normalizedThreadId = ctx.db.normalizeId("threads", args.threadId);
    } catch {
      return null;
    }
    if (!normalizedThreadId) {
      return null;
    }

    const user = await getUserOrNull(ctx);
    if (!user) {
      return null;
    }

    const thread = await ctx.db.get(normalizedThreadId);
    if (!thread) {
      return null;
    }

    try {
      await requireRoomMember(ctx, thread.roomId, user._id);
    } catch {
      return null;
    }

    return compactUndefined({
      _id: thread._id,
      _creationTime: thread._creationTime,
      roomId: thread.roomId,
      type: thread.type,
      title: typeof thread.title === "string" ? thread.title : undefined,
      decisionOwnerId: thread.decisionOwnerId,
      dueAt: safeNumber(thread.dueAt),
      meetingUrl: typeof thread.meetingUrl === "string" ? thread.meetingUrl : undefined,
      options: Array.isArray(thread.options)
        ? thread.options.filter((row): row is string => typeof row === "string")
        : undefined,
      commitmentGoalAmount: safeNumber(thread.commitmentGoalAmount),
      createdBy: thread.createdBy,
      createdAt: safeNumber(thread.createdAt) ?? 0,
      archivedAt: safeNumber(thread.archivedAt),
      archivedBy: thread.archivedBy,
    });
  },
});
