// convex/decisions.ts
// 判断（Decision）: 理由必須 + 書き込みガード

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireWritePermission, requireReason } from "./_guards";
import { Id } from "./_generated/dataModel";

/**
 * 判断を下す
 * - stance (yes/no/hold) + reason が必須
 * - 書き込みガード適用（active room + member/owner）
 * - 理由は空なら拒否
 */
export const decide = mutation({
  args: {
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    stance: v.union(
      v.literal("yes"),
      v.literal("no"),
      v.literal("hold")
    ),
    reasonBody: v.string(), // 理由必須
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // 書き込みガード: active room + member/owner
    await requireWritePermission(ctx, args.roomId, user._id);

    // 理由必須チェック
    requireReason(args.reasonBody, "Decision");

    // Threadが存在し、同じRoomに属するかチェック
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.roomId !== args.roomId) {
      throw new Error("Thread not found or does not belong to this room");
    }

    // 既存の判断をチェック（1人1判断）
    const existingDecision = await ctx.db
      .query("decisions")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("createdBy"), user._id))
      .first();

    if (existingDecision) {
      // 既存の判断を更新
      // 理由メッセージを更新
      const reasonMessage = await ctx.db.get(existingDecision.reasonMessageId);
      if (reasonMessage) {
        await ctx.db.patch(reasonMessage._id, {
          body: args.reasonBody,
        });
      }

      // 判断を更新
      await ctx.db.patch(existingDecision._id, {
        stance: args.stance,
      });

      return existingDecision._id;
    }

    // 理由メッセージを作成
    const reasonMessageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      threadId: args.threadId,
      kind: "reason",
      body: args.reasonBody,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    // 判断を作成
    const decisionId = await ctx.db.insert("decisions", {
      roomId: args.roomId,
      threadId: args.threadId,
      stance: args.stance,
      reasonMessageId,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return decisionId;
  },
});

/**
 * Threadの判断一覧を取得
 */
export const listDecisions = query({
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

    const decisions = await ctx.db
      .query("decisions")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    // 理由メッセージも取得
    const decisionsWithReasons = await Promise.all(
      decisions.map(async (d) => {
        const reasonMessage = await ctx.db.get(d.reasonMessageId);
        return {
          ...d,
          reason: reasonMessage?.body ?? "",
        };
      })
    );

    return decisionsWithReasons;
  },
});
