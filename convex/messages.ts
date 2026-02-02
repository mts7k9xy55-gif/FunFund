// convex/messages.ts
// コメント投稿: 書き込みガード適用

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser, requireWritePermission } from "./_guards";
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
