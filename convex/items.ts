import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";

// ヘルパー: 認証済みユーザーを取得
async function getAuthenticatedUser(ctx: any) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: ログインが必要です");
    }

    // Clerk の userId から Convex users を検索
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();

    if (!user) {
      // ユーザーが存在しない場合は作成を試みる
      try {
        const newUser = await ctx.db.insert("users", {
          userId: identity.subject,
          name: identity.name ?? identity.email ?? "Unknown",
          role: "human",
          reputation: 1.0,
          createdAt: Date.now(),
        });
        return await ctx.db.get(newUser);
      } catch (insertError: any) {
        // 重複エラーの場合は既存のユーザーを再取得
        if (insertError.message?.includes("duplicate") || insertError.message?.includes("unique")) {
          const existingUser = await ctx.db
            .query("users")
            .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
            .first();
          if (existingUser) {
            return existingUser;
          }
        }
        throw new Error(`User not found and creation failed: ${insertError.message}`);
      }
    }

    return user;
  } catch (error: any) {
    console.error("getAuthenticatedUser error:", error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// ヘルパー: ユーザーがアイテムを閲覧可能か確認
async function canViewItem(
  ctx: any,
  item: any,
  userId: Id<"users">
): Promise<boolean> {
  // 可視性がない場合は public として扱う
  const visibility = item.visibility ?? "public";

  if (visibility === "public") {
    return true;
  }

  if (visibility === "dm") {
    // DM: 作成者または受信者のみ
    return item.authorId === userId || item.recipientId === userId;
  }

  if (visibility === "group" && item.groupId) {
    // グループ: メンバーのみ
    const group = await ctx.db.get(item.groupId);
    if (!group) return false;
    return group.memberIds.includes(userId);
  }

  return false;
}

export const createItem = mutation({
  args: {
    type: v.union(
      v.literal("PROPOSAL"),
      v.literal("COMMENT"),
      v.literal("REACTION"),
      v.literal("EVALUATION")
    ),
    content: v.string(),
    score: v.optional(v.number()),
    reason: v.optional(v.string()),
    parentId: v.optional(v.id("items")),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("group"), v.literal("dm"))
    ),
    groupId: v.optional(v.id("groups")),
    recipientId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    try {
      // 認証チェック: サーバー側でユーザーIDを取得
      const user = await getAuthenticatedUser(ctx);

      // グループへの投稿の場合、メンバーかチェック
      if (args.visibility === "group" && args.groupId) {
        const group = await ctx.db.get(args.groupId);
        if (!group || !group.memberIds.includes(user._id)) {
          throw new Error("Forbidden: このグループに投稿する権限がありません");
        }
      }

      // DM の場合、recipientId が必要
      if (args.visibility === "dm" && !args.recipientId) {
        throw new Error("Bad Request: DM には recipientId が必要です");
      }

      return await ctx.db.insert("items", {
        type: args.type,
        content: args.content,
        score: args.score,
        reason: args.reason,
        parentId: args.parentId,
        authorId: user._id, // サーバー側で取得したユーザーID
        visibility: args.visibility ?? "public",
        groupId: args.groupId,
        recipientId: args.recipientId,
        createdAt: Date.now(),
      });
    } catch (error: any) {
      console.error("createItem error:", error);
      throw new Error(`Failed to create item: ${error.message}`);
    }
  },
});

export const listRootProposals = query({
  args: {},
  handler: async (ctx) => {
    // 認証情報を取得（なくても public は見れる）
    const identity = await ctx.auth.getUserIdentity();
    let currentUserId: Id<"users"> | null = null;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
        .first();
      currentUserId = user?._id ?? null;
    }

    const allItems = await ctx.db
      .query("items")
      .filter((q) => q.eq(q.field("type"), "PROPOSAL"))
      .collect();

    // 可視性フィルタ
    const visibleItems = [];
    for (const item of allItems) {
      if (currentUserId && (await canViewItem(ctx, item, currentUserId))) {
        visibleItems.push(item);
      } else if ((item.visibility ?? "public") === "public") {
        visibleItems.push(item);
      }
    }

    return visibleItems;
  },
});

export const listChildren = query({
  args: { parentId: v.id("items") },
  handler: async (ctx, args) => {
    // 認証情報を取得
    const identity = await ctx.auth.getUserIdentity();
    let currentUserId: Id<"users"> | null = null;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
        .first();
      currentUserId = user?._id ?? null;
    }

    const allChildren = await ctx.db
      .query("items")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();

    // 可視性フィルタ
    const visibleItems = [];
    for (const item of allChildren) {
      if (currentUserId && (await canViewItem(ctx, item, currentUserId))) {
        visibleItems.push(item);
      } else if ((item.visibility ?? "public") === "public") {
        visibleItems.push(item);
      }
    }

    return visibleItems;
  },
});

const DAMPING_FACTOR = 0.6;
const MAX_DEPTH = 8;

// Bルール：score と reason の両方が揃っている時だけ「シグナル」
// （保存しない。計算時に判定）
function isSignal(item: {
  type: string;
  score?: number;
  reason?: string;
}): boolean {
  return (
    item.type === "EVALUATION" &&
    typeof item.score === "number" &&
    typeof item.reason === "string" &&
    item.reason.trim().length > 0
  );
}

async function computeItemScore(
  ctx: any,
  rootId: Id<"items">,
  depth: number
): Promise<{ score: number; evaluationCount: number }> {
  if (depth >= MAX_DEPTH) return { score: 0, evaluationCount: 0 };

  const children = await ctx.db
    .query("items")
    .withIndex("by_parent", (q: any) => q.eq("parentId", rootId))
    .collect();

  let weightedSum = 0;
  let weightSum = 0;
  let evaluationCount = 0;

  for (const child of children) {
    // まず子自身が“本気評価”なら寄与
    if (isSignal(child) && child.authorId) {
      const author = await ctx.db.get(child.authorId);
      const rep = author?.reputation ?? 1.0;
      const w = rep * Math.pow(DAMPING_FACTOR, depth + 1);

      weightedSum += (child.score as number) * w;
      weightSum += w;
      evaluationCount += 1;
    }

    // どの type でも再帰して、深いところの“本気評価”も拾う
    const rec = await computeItemScore(ctx, child._id, depth + 1);
    // 再帰結果は「平均」なので、そのまま足すと歪む。
    // MVPは「評価ノードのみ寄与」方針なので、ここでは rec.score を足さない。
    // 深い評価は上の isSignal(child) 判定で拾われる（childが評価のとき）。
    evaluationCount += rec.evaluationCount;
  }

  const score = weightSum > 0 ? weightedSum / weightSum : 0;
  return { score, evaluationCount };
}

export const getItemScore = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    return await computeItemScore(ctx, args.itemId, 0);
  },
});

// フラクタル信頼度計算：ユーザーの過去評価が「的中」した度合い
async function computeReputation(
  ctx: any,
  userId: Id<"users">
): Promise<number> {
  // そのユーザーが行った全ての評価（EVALUATION）を取得
  const allItems = await ctx.db.query("items").collect();
  const myEvaluations = allItems.filter(
    (item: Doc<"items">) =>
      item.authorId === userId &&
      isSignal(item) &&
      item.parentId !== undefined
  );

  if (myEvaluations.length === 0) return 1.0; // デフォルト値

  let totalAccuracy = 0;
  let count = 0;

  for (const evalItem of myEvaluations) {
    if (!evalItem.parentId || !evalItem.score) continue;

    // 自分が評価した対象（提案 or 他の評価）の「最終スコア」を計算
    const targetScoreResult = await computeItemScore(ctx, evalItem.parentId, 0);
    const targetFinalScore = targetScoreResult.score;

    // 自分の評価スコアと最終スコアの「一致度」（0-1の範囲）
    // スコア範囲を -10 〜 +10 と仮定
    const scoreDiff = Math.abs(evalItem.score - targetFinalScore);
    const accuracy = Math.max(0, 1 - scoreDiff / 10);

    // 自分の評価自体が受けた評価（フラクタル）を取得
    const evalOfMyEval = await computeItemScore(ctx, evalItem._id, 0);
    // 自分の評価への評価が高いほど、自分の reputation に寄与
    const fractalWeight = 1 + evalOfMyEval.score / 10; // 正規化

    totalAccuracy += accuracy * fractalWeight;
    count++;
  }

  return count > 0 ? Math.max(0.1, totalAccuracy / count) : 1.0; // 最小値 0.1
}

// ユーザーの信頼度を取得（計算ベース）
export const getUserReputation = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await computeReputation(ctx, args.userId);
  },
});

// ユーザーが行った評価履歴を取得（プロフィール用）
export const getUserEvaluations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const allItems = await ctx.db.query("items").collect();
    const evaluations = allItems
      .filter((item: Doc<"items">) => item.authorId === args.userId && isSignal(item))
      .map(async (evalItem) => {
        // 評価対象の最終スコア
        const targetScore = evalItem.parentId
          ? await computeItemScore(ctx, evalItem.parentId, 0)
          : { score: 0, evaluationCount: 0 };

        // この評価自体が受けた評価（フラクタル）
        const evalOfEval = await computeItemScore(ctx, evalItem._id, 0);

        return {
          _id: evalItem._id,
          parentId: evalItem.parentId,
          score: evalItem.score,
          reason: evalItem.reason,
          createdAt: evalItem.createdAt,
          targetFinalScore: targetScore.score,
          evalOfEvalScore: evalOfEval.score,
        };
      });

    return Promise.all(evaluations);
  },
});

// 全てのルートアイテム（スレッド）を取得（可視性フィルタ付き）
export const listRootItems = query({
  args: {},
  handler: async (ctx) => {
    // 認証情報を取得（なくても public は見れる）
    const identity = await ctx.auth.getUserIdentity();
    let currentUserId: Id<"users"> | null = null;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
        .first();
      currentUserId = user?._id ?? null;
    }

    const allItems = await ctx.db.query("items").collect();
    // parentId が undefined または null のものがルート
    const rootItems = allItems.filter((item) => !item.parentId);

    // 可視性フィルタ
    const visibleItems = [];
    for (const item of rootItems) {
      if (currentUserId && (await canViewItem(ctx, item, currentUserId))) {
        visibleItems.push(item);
      } else if ((item.visibility ?? "public") === "public") {
        visibleItems.push(item);
      }
    }

    return visibleItems;
  },
});
