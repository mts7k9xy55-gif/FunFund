// convex/evaluations.ts
// 評価システム: 5つの基準でスコアリング、重み付け計算、モード別カスタマイズ

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./_guards";
import { Id } from "./_generated/dataModel";

// 評価モード別の基準名定義
export const EVALUATION_CRITERIA = {
  open: {
    score1: "革新性",
    score2: "実現可能性",
    score3: "社会的インパクト",
    score4: "チーム力",
    score5: "プレゼン",
  },
  closed: {
    score1: "金銭",
    score2: "家事",
    score3: "決定力",
    score4: "協力",
    score5: "ストレス軽減",
  },
} as const;

/**
 * 重み付けスコアを計算
 */
function calculateWeightedScore(
  scores: [number, number, number, number, number],
  weights: [number, number, number, number, number]
): number {
  // 重みの合計を100%に正規化
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  const normalizedWeights = weights.map((w) => w / totalWeight) as [
    number,
    number,
    number,
    number,
    number
  ];

  // 加重平均を計算
  const weightedSum = scores.reduce(
    (sum, score, i) => sum + score * normalizedWeights[i],
    0
  );

  return Math.round(weightedSum * 100) / 100; // 小数点第2位まで
}

/**
 * 評価を作成または更新
 */
export const upsertEvaluation = mutation({
  args: {
    threadId: v.id("threads"),
    mode: v.union(v.literal("open"), v.literal("closed")),
    score1: v.number(),
    score2: v.number(),
    score3: v.number(),
    score4: v.number(),
    score5: v.number(),
    weight1: v.number(),
    weight2: v.number(),
    weight3: v.number(),
    weight4: v.number(),
    weight5: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Threadを取得してRoomIdを取得
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    // Roomのメンバーかチェック
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", thread.roomId))
      .collect();

    const membership = memberships.find((m) => m.userId === user._id);
    if (!membership) {
      throw new Error("You are not a member of this room");
    }

    // スコアの範囲チェック（1-5）
    const scores: [number, number, number, number, number] = [
      args.score1,
      args.score2,
      args.score3,
      args.score4,
      args.score5,
    ];
    for (const score of scores) {
      if (score < 1 || score > 5) {
        throw new Error("Scores must be between 1 and 5");
      }
    }

    // 重みの範囲チェック（0-100）
    const weights: [number, number, number, number, number] = [
      args.weight1,
      args.weight2,
      args.weight3,
      args.weight4,
      args.weight5,
    ];
    for (const weight of weights) {
      if (weight < 0 || weight > 100) {
        throw new Error("Weights must be between 0 and 100");
      }
    }

    // 加重平均スコアを計算
    const weightedScore = calculateWeightedScore(scores, weights);

    // 既存の評価を検索
    const existing = await ctx.db
      .query("evaluations")
      .withIndex("by_threadId_evaluatorId", (q) =>
        q.eq("threadId", args.threadId).eq("evaluatorId", user._id)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // 更新
      await ctx.db.patch(existing._id, {
        mode: args.mode,
        score1: args.score1,
        score2: args.score2,
        score3: args.score3,
        score4: args.score4,
        score5: args.score5,
        weight1: args.weight1,
        weight2: args.weight2,
        weight3: args.weight3,
        weight4: args.weight4,
        weight5: args.weight5,
        weightedScore,
        comment: args.comment,
        updatedAt: now,
      });

      return existing._id;
    } else {
      // 新規作成
      return await ctx.db.insert("evaluations", {
        threadId: args.threadId,
        roomId: thread.roomId,
        evaluatorId: user._id,
        mode: args.mode,
        score1: args.score1,
        score2: args.score2,
        score3: args.score3,
        score4: args.score4,
        score5: args.score5,
        weight1: args.weight1,
        weight2: args.weight2,
        weight3: args.weight3,
        weight4: args.weight4,
        weight5: args.weight5,
        weightedScore,
        comment: args.comment,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Threadの評価一覧を取得
 */
export const getEvaluationsByThread = query({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      return [];
    }

    // Roomのメンバーかチェック
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", thread.roomId))
      .collect();

    const membership = memberships.find((m) => m.userId === user._id);
    if (!membership) {
      throw new Error("You are not a member of this room");
    }

    const evaluations = await ctx.db
      .query("evaluations")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .collect();

    // 評価者情報を取得
    const evaluationsWithUsers = await Promise.all(
      evaluations.map(async (eval) => {
        const evaluator = await ctx.db.get(eval.evaluatorId);
        return {
          ...eval,
          evaluatorName: evaluator?.name ?? "Unknown",
        };
      })
    );

    return evaluationsWithUsers;
  },
});

/**
 * 自分の評価を取得
 */
export const getMyEvaluation = query({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const evaluation = await ctx.db
      .query("evaluations")
      .withIndex("by_threadId_evaluatorId", (q) =>
        q.eq("threadId", args.threadId).eq("evaluatorId", user._id)
      )
      .first();

    return evaluation;
  },
});

/**
 * Threadの平均評価スコアを取得
 */
export const getThreadAverageScore = query({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      return null;
    }

    // Roomのメンバーかチェック
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", thread.roomId))
      .collect();

    const membership = memberships.find((m) => m.userId === user._id);
    if (!membership) {
      throw new Error("You are not a member of this room");
    }

    const evaluations = await ctx.db
      .query("evaluations")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .collect();

    if (evaluations.length === 0) {
      return {
        averageWeightedScore: 0,
        evaluationCount: 0,
        averageScores: {
          score1: 0,
          score2: 0,
          score3: 0,
          score4: 0,
          score5: 0,
        },
      };
    }

    // 加重平均スコアの平均
    const totalWeightedScore = evaluations.reduce(
      (sum, e) => sum + e.weightedScore,
      0
    );
    const averageWeightedScore =
      Math.round((totalWeightedScore / evaluations.length) * 100) / 100;

    // 各スコアの平均
    const averageScores = {
      score1:
        Math.round(
          (evaluations.reduce((sum, e) => sum + e.score1, 0) /
            evaluations.length) *
            100
        ) / 100,
      score2:
        Math.round(
          (evaluations.reduce((sum, e) => sum + e.score2, 0) /
            evaluations.length) *
            100
        ) / 100,
      score3:
        Math.round(
          (evaluations.reduce((sum, e) => sum + e.score3, 0) /
            evaluations.length) *
            100
        ) / 100,
      score4:
        Math.round(
          (evaluations.reduce((sum, e) => sum + e.score4, 0) /
            evaluations.length) *
            100
        ) / 100,
      score5:
        Math.round(
          (evaluations.reduce((sum, e) => sum + e.score5, 0) /
            evaluations.length) *
            100
        ) / 100,
    };

    return {
      averageWeightedScore,
      evaluationCount: evaluations.length,
      averageScores,
    };
  },
});
