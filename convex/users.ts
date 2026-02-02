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

// ユーザー検索（名前で部分一致）
export const searchUsers = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // 現在のユーザーを取得
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!currentUser) {
      return [];
    }

    const searchQuery = args.query.toLowerCase().trim();
    if (searchQuery.length < 1) {
      return [];
    }

    const allUsers = await ctx.db.query("users").collect();

    // 自分以外のユーザーで、名前が一致するものを検索
    const matchedUsers = allUsers.filter((user) => {
      if (user._id === currentUser._id) return false;
      const name = (user.name ?? "").toLowerCase();
      const userId = user.userId.toLowerCase();
      return name.includes(searchQuery) || userId.includes(searchQuery);
    });

    return matchedUsers.slice(0, 20); // 最大20件
  },
});

// 特定ユーザーの詳細を取得
export const getUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
