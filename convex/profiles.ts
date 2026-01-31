import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new profile with initial balance and credibility
export const create = mutation({
  args: {
    userId: v.string(),
    username: v.optional(v.string()),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    bio: v.optional(v.string()),
    initialBalance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { initialBalance, ...profileData } = args;
    const profileId = await ctx.db.insert("profiles", {
      ...profileData,
      balance: initialBalance ?? 0,
      credibilityScore: 0,
      completedTasksCount: 0,
      totalEarnings: 0,
      createdAt: now,
      updatedAt: now,
    });
    return profileId;
  },
});

// Get profile by user ID (from auth provider)
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    return profile;
  },
});

// Get profile by ID
export const getById = query({
  args: { id: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update profile
export const update = mutation({
  args: {
    id: v.id("profiles"),
    username: v.optional(v.string()),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// List all profiles
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("profiles").collect();
  },
});
