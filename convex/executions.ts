// convex/executions.ts
// 実行ログ: 書き込みガード適用

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireWritePermission } from "./_guards";
import { Id } from "./_generated/dataModel";

/**
 * 実行ログを記録
 * - 書き込みガード適用（active room + member/owner）
 */
export const logExecution = mutation({
  args: {
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    status: v.union(
      v.literal("planned"),
      v.literal("done"),
      v.literal("canceled")
    ),
    note: v.string(),
    evidenceUrl: v.optional(v.string()),
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

    // projectタイプのThreadのみ実行ログを記録可能
    if (thread.type !== "project") {
      throw new Error("Execution logs can only be added to project threads");
    }

    const executionId = await ctx.db.insert("executions", {
      roomId: args.roomId,
      threadId: args.threadId,
      status: args.status,
      note: args.note,
      evidenceUrl: args.evidenceUrl,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    // 実行ログメッセージも作成
    await ctx.db.insert("messages", {
      roomId: args.roomId,
      threadId: args.threadId,
      kind: "execution",
      body: args.note,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return executionId;
  },
});

/**
 * Threadの実行ログ一覧を取得
 */
export const listExecutions = query({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);

    if (!thread) {
      return [];
    }

    // メンバーかチェック
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", thread.roomId))
      .collect();
    
    const membership = memberships.find((m) => m.userId === user._id);

    if (!membership) {
      throw new Error("You are not a member of this room");
    }

    const executions = await ctx.db
      .query("executions")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    return executions;
  },
});
