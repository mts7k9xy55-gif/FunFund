import { v } from "convex/values";
import { query } from "./_generated/server";
import { getUserOrNull, requireRoomMember } from "./_guards";

function safeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
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

export const getThreadView = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    let normalizedThreadId = null;
    try {
      normalizedThreadId = ctx.db.normalizeId("threads", args.threadId);
    } catch {
      return {
        thread: null,
        messages: [],
        decisions: [],
        executions: [],
      };
    }
    if (!normalizedThreadId) {
      return {
        thread: null,
        messages: [],
        decisions: [],
        executions: [],
      };
    }

    const user = await getUserOrNull(ctx);
    if (!user) {
      return {
        thread: null,
        messages: [],
        decisions: [],
        executions: [],
      };
    }

    const rawThread = await ctx.db.get(normalizedThreadId);
    if (!rawThread) {
      return {
        thread: null,
        messages: [],
        decisions: [],
        executions: [],
      };
    }

    const membership = await (async () => {
      try {
        return await requireRoomMember(ctx, rawThread.roomId, user._id);
      } catch {
        return null;
      }
    })();
    if (!membership) {
      return {
        thread: null,
        messages: [],
        decisions: [],
        executions: [],
      };
    }

    const rawMessages = await (async () => {
      try {
        return await ctx.db
          .query("messages")
          .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
          .collect();
      } catch {
        return [];
      }
    })();

    const rawDecisions = await (async () => {
      try {
        return await ctx.db
          .query("decisions")
          .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
          .collect();
      } catch {
        return [];
      }
    })();

    const legacyDecisionReasonIds = new Set(
      rawDecisions.map((decision) => String(decision.reasonMessageId))
    );

    const thread = compactUndefined({
      _id: rawThread._id,
      roomId: rawThread.roomId,
      type: rawThread.type,
      title: safeString(rawThread.title),
      decisionOwnerId: rawThread.decisionOwnerId,
      dueAt: safeNumber(rawThread.dueAt),
      meetingUrl: safeString(rawThread.meetingUrl),
      options: Array.isArray(rawThread.options)
        ? rawThread.options.filter((row): row is string => typeof row === "string")
        : undefined,
      commitmentGoalAmount: safeNumber(rawThread.commitmentGoalAmount),
      createdBy: rawThread.createdBy,
      createdAt: safeNumber(rawThread.createdAt) ?? 0,
      archivedAt: safeNumber(rawThread.archivedAt),
      archivedBy: rawThread.archivedBy,
    });

    const messages = rawMessages
      .filter((message) => {
        if (message.kind === "reason" && legacyDecisionReasonIds.has(String(message._id))) {
          return false;
        }
        if (!message.hiddenAt) {
          return true;
        }
        return membership.role === "owner" || message.createdBy === user._id;
      })
      .map((message) =>
        compactUndefined({
          _id: message._id,
          roomId: message.roomId,
          threadId: message.threadId,
          kind: message.kind,
          body: safeString(message.body) ?? "",
          createdBy: message.createdBy,
          createdAt: safeNumber(message.createdAt) ?? 0,
          hiddenAt: safeNumber(message.hiddenAt),
          hiddenBy: message.hiddenBy,
        })
      );

    const decisions = rawDecisions
      .filter((decision) => {
        const visibility = decision.visibility ?? "private";
        if (decision.createdBy === user._id) {
          return true;
        }
        if (visibility === "public") {
          return true;
        }
        if (visibility === "shared_to_target" && decision.targetUserId === user._id) {
          return true;
        }
        return false;
      })
      .map((decision) => ({
        ...decision,
        createdAt: safeNumber(decision.createdAt) ?? 0,
      }));

    const executions = await (async () => {
      try {
        const rows = await ctx.db
          .query("executions")
          .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
          .collect();
        return rows.map((row) => ({
          ...row,
          createdAt: safeNumber(row.createdAt) ?? 0,
        }));
      } catch {
        return [];
      }
    })();

    return {
      thread,
      messages,
      decisions,
      executions,
    };
  },
});
