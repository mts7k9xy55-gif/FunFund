import { v } from "convex/values";
import { query } from "./_generated/server";
import { getUserOrNull } from "./_guards";

export const getThreadView = query({
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

    try {
      const user = await getUserOrNull(ctx);
      if (!user) {
        return null;
      }

      const thread = await ctx.db.get(normalizedThreadId);
      if (!thread) {
        return null;
      }

      const memberships = await ctx.db
        .query("roomMembers")
        .withIndex("by_room", (q) => q.eq("roomId", thread.roomId))
        .collect();
      const membership = memberships.find((row) => row.userId === user._id);
      if (!membership) {
        return null;
      }

      let decisionsRaw: any[] = [];
      try {
        decisionsRaw = await ctx.db
          .query("decisions")
          .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
          .collect();
      } catch {
        decisionsRaw = [];
      }

      const legacyDecisionReasonIds = new Set(
        decisionsRaw.map((decision) => decision.reasonMessageId)
      );

      let messagesRaw: any[] = [];
      try {
        messagesRaw = await ctx.db
          .query("messages")
          .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
          .collect();
      } catch {
        messagesRaw = [];
      }
      const messages = messagesRaw.filter((message) => {
        if (
          message.kind === "reason" &&
          legacyDecisionReasonIds.has(message._id)
        ) {
          return false;
        }
        if (!message.hiddenAt) {
          return true;
        }
        return membership.role === "owner" || message.createdBy === user._id;
      });

      const decisions = decisionsRaw.filter((decision) => {
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
      });

      let executions: any[] = [];
      try {
        executions = await ctx.db
          .query("executions")
          .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
          .collect();
      } catch {
        executions = [];
      }

      return {
        thread,
        messages,
        decisions,
        executions,
      };
    } catch {
      return null;
    }
  },
});
