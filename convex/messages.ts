// convex/messages.ts
// コメント投稿: 書き込みガード適用

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserOrNull, requireRoomMember, requireUser, requireWritePermission } from "./_guards";
import { Id } from "./_generated/dataModel";

/**
 * コメントを投稿
 * - 書き込みガード適用（active room + member/owner）
 */
export const postComment = mutation({
  args: {
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // 書き込みガード: active room + member/owner
    await requireWritePermission(ctx, args.roomId, user._id);

    // Threadが存在し、同じRoomに属するかチェック
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.roomId !== args.roomId) {
      throw new Error("Thread not found or does not belong to this room");
    }

    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      threadId: args.threadId,
      kind: "comment",
      body: args.body,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * 返信の表示状態を切り替え
 * - owner または 送信者のみ
 */
export const setMessageHidden = mutation({
  args: {
    messageId: v.id("messages"),
    hidden: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const membership = await requireRoomMember(ctx, message.roomId, user._id);
    const canModerate = membership.role === "owner" || message.createdBy === user._id;
    if (!canModerate) {
      throw new Error("Only room owner or sender can update message visibility");
    }

    await ctx.db.patch(args.messageId, {
      hiddenAt: args.hidden ? Date.now() : undefined,
      hiddenBy: args.hidden ? user._id : undefined,
    });

    return args.messageId;
  },
});

/**
 * 返信を削除
 * - owner または 送信者のみ
 * - decisions.reasonMessageId に紐づく理由は削除不可
 */
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const membership = await requireRoomMember(ctx, message.roomId, user._id);
    const canModerate = membership.role === "owner" || message.createdBy === user._id;
    if (!canModerate) {
      throw new Error("Only room owner or sender can delete message");
    }

    const decisions = await ctx.db
      .query("decisions")
      .withIndex("by_thread", (q) => q.eq("threadId", message.threadId))
      .collect();
    const boundToDecision = decisions.some(
      (decision) => decision.reasonMessageId === args.messageId
    );
    if (boundToDecision) {
      throw new Error("Decision reason message cannot be deleted");
    }

    await ctx.db.delete(args.messageId);
    return args.messageId;
  },
});

export const listThreadMessages = query({
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
      .query("decisions")
      .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
      .collect();
    const legacyDecisionReasonIds = new Set(decisions.map((decision) => decision.reasonMessageId));

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
      .collect();

    return messages
      .filter((message) => {
        if (message.kind === "reason" && legacyDecisionReasonIds.has(message._id)) {
          return false;
        }
        if (!message.hiddenAt) {
          return true;
        }
        return membership.role === "owner" || message.createdBy === user._id;
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});
