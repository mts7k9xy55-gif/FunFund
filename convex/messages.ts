// convex/messages.ts
// コメント投稿: 書き込みガード適用

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserOrNull, requireRoomMember, requireUser, requireWritePermission } from "./_guards";

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

    const messages = await (async () => {
      try {
        return await ctx.db
          .query("messages")
          .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
          .collect();
      } catch {
        return [];
      }
    })();

    return messages
      .filter((message) => {
        if (!message.hiddenAt) {
          return true;
        }
        return membership.role === "owner" || message.createdBy === user._id;
      })
      .map((message) =>
        compactUndefined({
          _id: message._id,
          _creationTime: message._creationTime,
          roomId: message.roomId,
          threadId: message.threadId,
          kind: message.kind,
          body: typeof message.body === "string" ? message.body : "",
          createdBy: message.createdBy,
          createdAt: safeNumber(message.createdAt) ?? 0,
          hiddenAt: safeNumber(message.hiddenAt),
          hiddenBy: message.hiddenBy,
        })
      )
      .sort((a, b) => (safeNumber(a.createdAt) ?? 0) - (safeNumber(b.createdAt) ?? 0));
  },
});
