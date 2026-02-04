// convex/distributions.ts
// 分配提案機能: 貢献度%ベースの分配計算

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireOwnerPermission } from "./_guards";
import { Id } from "./_generated/dataModel";

/**
 * 分配提案を作成
 */
export const createDistributionProposal = mutation({
  args: {
    roomId: v.id("rooms"),
    threadId: v.optional(v.id("threads")),
    contributions: v.array(
      v.object({
        userId: v.id("users"),
        percentage: v.number(),
      })
    ),
    totalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // メンバーかチェック
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const membership = memberships.find((m) => m.userId === user._id);
    if (!membership) {
      throw new Error("You are not a member of this room");
    }

    // 貢献度の合計が100%かチェック
    const totalPercentage = args.contributions.reduce(
      (sum, c) => sum + c.percentage,
      0
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error("Total contribution percentage must equal 100%");
    }

    // 各ユーザーがRoomのメンバーかチェック
    for (const contribution of args.contributions) {
      const isMember = memberships.some(
        (m) => m.userId === contribution.userId
      );
      if (!isMember) {
        throw new Error(
          `User ${contribution.userId} is not a member of this room`
        );
      }
    }

    const now = Date.now();

    return await ctx.db.insert("distributionProposals", {
      roomId: args.roomId,
      threadId: args.threadId,
      proposedBy: user._id,
      contributions: args.contributions,
      totalAmount: args.totalAmount,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Roomの分配提案一覧を取得
 */
export const getDistributionProposals = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return [];
    }

    // メンバーかチェック
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const membership = memberships.find((m) => m.userId === user._id);
    if (!membership) {
      throw new Error("You are not a member of this room");
    }

    const proposals = await ctx.db
      .query("distributionProposals")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();

    // 提案者情報を取得
    const proposalsWithUsers = await Promise.all(
      proposals.map(async (proposal) => {
        const proposer = await ctx.db.get(proposal.proposedBy);
        const contributionsWithUsers = await Promise.all(
          proposal.contributions.map(async (c) => {
            const user = await ctx.db.get(c.userId);
            return {
              ...c,
              userName: user?.name ?? "Unknown",
            };
          })
        );

        return {
          ...proposal,
          proposerName: proposer?.name ?? "Unknown",
          contributions: contributionsWithUsers,
        };
      })
    );

    return proposalsWithUsers;
  },
});

/**
 * 分配提案を承認/却下（ownerのみ）
 */
export const updateDistributionProposalStatus = mutation({
  args: {
    proposalId: v.id("distributionProposals"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    // owner権限チェック
    await requireOwnerPermission(ctx, proposal.roomId, user._id);

    await ctx.db.patch(args.proposalId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.proposalId;
  },
});

/**
 * Roomメンバーの貢献度を自動計算（評価スコアベース）
 */
export const calculateContributionsFromEvaluations = query({
  args: {
    roomId: v.id("rooms"),
    threadId: v.optional(v.id("threads")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return null;
    }

    // メンバーかチェック
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const membership = memberships.find((m) => m.userId === user._id);
    if (!membership) {
      throw new Error("You are not a member of this room");
    }

    // Threadを取得
    const threads = args.threadId
      ? [await ctx.db.get(args.threadId)].filter(Boolean)
      : await ctx.db
          .query("threads")
          .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
          .collect();

    if (threads.length === 0) {
      return [];
    }

    // 各メンバーの評価スコア合計を計算
    const memberScores: Record<string, number> = {};

    for (const thread of threads) {
      const evaluations = await ctx.db
        .query("evaluations")
        .withIndex("by_threadId", (q) => q.eq("threadId", thread._id))
        .collect();

      for (const eval of evaluations) {
        if (!memberScores[eval.evaluatorId]) {
          memberScores[eval.evaluatorId] = 0;
        }
        memberScores[eval.evaluatorId] += eval.weightedScore;
      }
    }

    // スコア合計を計算
    const totalScore = Object.values(memberScores).reduce(
      (sum, score) => sum + score,
      0
    );

    if (totalScore === 0) {
      // スコアがない場合は均等分配
      return memberships.map((m) => ({
        userId: m.userId,
        percentage: Math.round((100 / memberships.length) * 100) / 100,
      }));
    }

    // スコアに基づいて貢献度%を計算
    const contributions = memberships.map((m) => {
      const score = memberScores[m.userId] ?? 0;
      const percentage = Math.round((score / totalScore) * 100 * 100) / 100;
      return {
        userId: m.userId,
        percentage: Math.max(0, Math.min(100, percentage)), // 0-100%に制限
      };
    });

    // 合計が100%になるように調整
    const currentTotal = contributions.reduce(
      (sum, c) => sum + c.percentage,
      0
    );
    if (currentTotal !== 100) {
      const diff = 100 - currentTotal;
      // 最大の貢献度を持つメンバーに差分を追加
      const maxIndex = contributions.reduce(
        (maxIdx, c, idx) =>
          c.percentage > contributions[maxIdx].percentage ? idx : maxIdx,
        0
      );
      contributions[maxIndex].percentage += diff;
    }

    return contributions;
  },
});
