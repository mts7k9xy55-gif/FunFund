import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./_guards";

const DEFAULT_AVATAR = "🙂";

function normalizeDisplayName(input?: string) {
  const value = input?.trim();
  if (!value) return undefined;
  return value.slice(0, 40);
}

function normalizeAvatarEmoji(input?: string) {
  const value = input?.trim();
  if (!value) return undefined;
  return value.slice(0, 8);
}

// Create a new profile
export const create = mutation({
  args: {
    userId: v.string(),
    username: v.optional(v.string()),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    displayName: v.optional(v.string()),
    avatarEmoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const profileId = await ctx.db.insert("profiles", {
      ...args,
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
    displayName: v.optional(v.string()),
    avatarEmoji: v.optional(v.string()),
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

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    return {
      profileId: profile?._id ?? null,
      displayName: profile?.displayName ?? user?.name ?? identity.name ?? null,
      avatarEmoji: profile?.avatarEmoji ?? DEFAULT_AVATAR,
    };
  },
});

export const upsertMyProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatarEmoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx);
    const now = Date.now();
    const displayName = normalizeDisplayName(args.displayName);
    const avatarEmoji = normalizeAvatarEmoji(args.avatarEmoji);

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", me.userId))
      .first();

    if (existing) {
      const patch: {
        updatedAt: number;
        displayName?: string;
        avatarEmoji?: string;
      } = { updatedAt: now };
      if (displayName !== undefined) {
        patch.displayName = displayName;
      }
      if (avatarEmoji !== undefined) {
        patch.avatarEmoji = avatarEmoji;
      }
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("profiles", {
        userId: me.userId,
        displayName,
        avatarEmoji,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (displayName) {
      await ctx.db.patch(me._id, { name: displayName });
    }

    return {
      displayName: displayName ?? existing?.displayName ?? me.name ?? null,
      avatarEmoji: avatarEmoji ?? existing?.avatarEmoji ?? DEFAULT_AVATAR,
    };
  },
});
