import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createUser = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("human"), v.literal("ai")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      userId: args.userId,
      name: args.name,
      role: args.role,
      reputation: 1.0,
      createdAt: Date.now(),
    });
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
