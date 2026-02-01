import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // ✅ 生ログ保存のみ（親スコア更新などの副作用は絶対に入れない）
    return await ctx.db.insert("items", {
      type: args.type,
      content: args.content,
      score: args.score,
      reason: args.reason,
      parentId: args.parentId,
      userId: args.userId,
      createdAt: Date.now(),
    });
  },
});

export const listRootProposals = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("items")
      .filter((q) => q.eq(q.field("type"), "PROPOSAL"))
      .collect();
  },
});

export const listChildren = query({
  args: { parentId: v.id("items") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
  },
});
import { Id } from "./_generated/dataModel";

const DAMPING_FACTOR = 0.6;
const MAX_DEPTH = 8;

// Bルール：score と reason の両方が揃っている時だけ「シグナル」
// （保存しない。計算時に判定）
function isSignal(item: {
  type: "PROPOSAL" | "COMMENT" | "REACTION" | "EVALUATION";
  score?: number;
  reason?: string;
}) {
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
    if (isSignal(child)) {
      const author = await ctx.db.get(child.userId);
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
