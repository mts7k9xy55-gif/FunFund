import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./_guards";

function summarizeLegacyProject(source: {
  title: string;
  description: string;
  createdAt: number;
  thumbnailUrl?: string;
  decisions?: string[];
  suitableFor?: string;
  notSuitableFor?: string;
}) {
  return {
    title: source.title,
    description: source.description,
    thumbnailUrl: source.thumbnailUrl,
    decisions: source.decisions ?? [],
    suitableFor: source.suitableFor,
    notSuitableFor: source.notSuitableFor,
    weightedScore: 0,
    evaluationCount: 0,
    currentAmount: 0,
    goalAmount: 0,
    daysRemaining: 30,
    visibility: "public" as const,
    createdAt: source.createdAt,
    updatedAt: Date.now(),
  };
}

export const listPublicCatalog = query({
  args: {},
  handler: async (ctx) => {
    const published = await ctx.db
      .query("publicProjectsV2")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .collect();

    return published
      .filter((row) => !!row.sourceItemId)
      .filter((row) => row.currentAmount > 0 || row.decisions.length > 0)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((row) => ({
        id: row.sourceItemId!,
        title: row.title,
        description: row.description,
        thumbnailUrl: row.thumbnailUrl,
        currentAmount: row.currentAmount,
        goalAmount: row.goalAmount,
        daysRemaining: row.daysRemaining,
        createdAt: row.createdAt,
      }));
  },
});

export const getPublicProject = query({
  args: {
    itemId: v.id("items"),
  },
  handler: async (ctx, args) => {
    const v2 = await ctx.db
      .query("publicProjectsV2")
      .withIndex("by_sourceItemId", (q) => q.eq("sourceItemId", args.itemId))
      .first();

    if (!v2) {
      return null;
    }

    return {
      id: args.itemId,
      title: v2.title,
      description: v2.description,
      thumbnailUrl: v2.thumbnailUrl,
      decisions: v2.decisions,
      suitableFor: v2.suitableFor,
      notSuitableFor: v2.notSuitableFor,
      currentAmount: v2.currentAmount,
      goalAmount: v2.goalAmount,
      daysRemaining: v2.daysRemaining,
      createdAt: v2.createdAt,
    };
  },
});

export const seedPublicProjectsFromLegacy = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    void user;

    const rootItems = await ctx.db
      .query("items")
      .withIndex("by_parent", (q) => q.eq("parentId", undefined))
      .collect();

    const publicItems = rootItems
      .filter((item) => (item.visibility ?? "public") === "public")
      .slice(0, args.limit ?? 200);

    let created = 0;
    for (const item of publicItems) {
      const existing = await ctx.db
        .query("publicProjectsV2")
        .withIndex("by_sourceItemId", (q) => q.eq("sourceItemId", item._id))
        .first();

      if (existing) {
        continue;
      }

      const preview = await ctx.db
        .query("publicPreviews")
        .withIndex("by_item", (q) => q.eq("itemId", item._id))
        .first();

      const legacy = summarizeLegacyProject({
        title: item.content?.substring(0, 100) ?? "",
        description: preview?.description ?? item.content?.substring(0, 200) ?? "",
        thumbnailUrl: preview?.thumbnailUrl,
        decisions: preview?.decisions ?? [],
        suitableFor: preview?.suitableFor,
        notSuitableFor: preview?.notSuitableFor,
        createdAt: item.createdAt,
      });

      await ctx.db.insert("publicProjectsV2", {
        sourceItemId: item._id,
        ...legacy,
      });
      created += 1;
    }

    return { created };
  },
});
