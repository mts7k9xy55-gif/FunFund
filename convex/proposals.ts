import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new proposal
export const create = mutation({
  args: {
    authorId: v.id("profiles"),
    title: v.string(),
    description: v.string(),
    goalAmount: v.number(),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const proposalId = await ctx.db.insert("proposals", {
      ...args,
      currentAmount: 0,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
    return proposalId;
  },
});

// Get proposal by ID
export const getById = query({
  args: { id: v.id("proposals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get proposal with author info
export const getWithAuthor = query({
  args: { id: v.id("proposals") },
  handler: async (ctx, args) => {
    const proposal = await ctx.db.get(args.id);
    if (!proposal) return null;
    
    const author = await ctx.db.get(proposal.authorId);
    return { ...proposal, author };
  },
});

// List all active proposals
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("proposals")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

// List proposals by author
export const listByAuthor = query({
  args: { authorId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("proposals")
      .withIndex("by_authorId", (q) => q.eq("authorId", args.authorId))
      .collect();
  },
});

// List proposals by category
export const listByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("proposals")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

// Update proposal
export const update = mutation({
  args: {
    id: v.id("proposals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    goalAmount: v.optional(v.number()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Update current funding amount
export const updateFunding = mutation({
  args: {
    id: v.id("proposals"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const proposal = await ctx.db.get(args.id);
    if (!proposal) throw new Error("Proposal not found");
    
    const newAmount = proposal.currentAmount + args.amount;
    await ctx.db.patch(args.id, {
      currentAmount: newAmount,
      updatedAt: Date.now(),
    });
    
    return newAmount;
  },
});

// Delete proposal
export const remove = mutation({
  args: { id: v.id("proposals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
