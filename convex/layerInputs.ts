// convex/layerInputs.ts
// 3レイヤー入力（メモ/アンケート/インタビュー）の保存と取得

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, requireWritePermission } from "./_guards";

/**
 * 3レイヤー入力を保存または更新
 */
export const saveLayerInputs = mutation({
  args: {
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    memo: v.optional(v.string()),
    questionnaire: v.optional(v.string()), // JSON文字列
    interview: v.optional(v.string()), // JSON文字列
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

    // 既存の入力を検索
    const existing = await ctx.db
      .query("layerInputs")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("createdBy"), user._id))
      .first();

    if (existing) {
      // 更新
      await ctx.db.patch(existing._id, {
        memo: args.memo ?? existing.memo,
        questionnaire: args.questionnaire ?? existing.questionnaire,
        interview: args.interview ?? existing.interview,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // 新規作成
      const id = await ctx.db.insert("layerInputs", {
        roomId: args.roomId,
        threadId: args.threadId,
        memo: args.memo,
        questionnaire: args.questionnaire,
        interview: args.interview,
        createdBy: user._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return id;
    }
  },
});

/**
 * 3レイヤー入力を取得
 */
export const getLayerInputs = query({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const inputs = await ctx.db
      .query("layerInputs")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("createdBy"), user._id))
      .first();

    if (!inputs) {
      return null;
    }

    return {
      memo: inputs.memo ?? "",
      questionnaire: inputs.questionnaire ? JSON.parse(inputs.questionnaire) : null,
      interview: inputs.interview ? JSON.parse(inputs.interview) : null,
    };
  },
});
