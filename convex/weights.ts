import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireOwnerPermission, requireRoomMember, requireUser } from "./_guards";
import { Id } from "./_generated/dataModel";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function upsertWeightProfile(
  ctx: any,
  userId: Id<"users">,
  payload: {
    globalWeight: number;
    globalCredibilityScore: number;
    publicProfileEnabled?: boolean;
  }
) {
  const existing = await ctx.db
    .query("userWeightProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();

  const now = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, {
      globalWeight: round2(payload.globalWeight),
      globalCredibilityScore: round2(payload.globalCredibilityScore),
      publicProfileEnabled:
        payload.publicProfileEnabled ?? existing.publicProfileEnabled,
      updatedAt: now,
    });
    return await ctx.db.get(existing._id);
  }

  const createdId = await ctx.db.insert("userWeightProfiles", {
    userId,
    globalWeight: round2(payload.globalWeight),
    globalCredibilityScore: round2(payload.globalCredibilityScore),
    publicProfileEnabled: payload.publicProfileEnabled ?? false,
    createdAt: now,
    updatedAt: now,
  });
  return await ctx.db.get(createdId);
}

async function calculateWeightFromEvaluations(ctx: any, userId: Id<"users">) {
  const evaluations = await ctx.db
    .query("evaluations")
    .withIndex("by_evaluatorId", (q: any) => q.eq("evaluatorId", userId))
    .collect();

  if (evaluations.length === 0) {
    return {
      globalWeight: 1,
      globalCredibilityScore: 50,
    };
  }

  const averageWeightedScore =
    evaluations.reduce((sum: number, e: any) => sum + e.weightedScore, 0) /
    evaluations.length;

  const credibilityScore = clamp((averageWeightedScore / 5) * 100, 10, 100);
  const globalWeight = clamp(0.5 + (credibilityScore / 100) * 1.5, 0.5, 2.0);

  return {
    globalWeight,
    globalCredibilityScore: credibilityScore,
  };
}

export const recalculateMyWeightProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const next = await calculateWeightFromEvaluations(ctx, user._id);
    const updated = await upsertWeightProfile(ctx, user._id, next);

    await ctx.db.patch(user._id, {
      reputation: next.globalWeight,
    });

    return updated;
  },
});

export const updateMyWeightProfileVisibility = mutation({
  args: {
    publicProfileEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("userWeightProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!existing) {
      const computed = await calculateWeightFromEvaluations(ctx, user._id);
      return await upsertWeightProfile(ctx, user._id, {
        ...computed,
        publicProfileEnabled: args.publicProfileEnabled,
      });
    }

    await ctx.db.patch(existing._id, {
      publicProfileEnabled: args.publicProfileEnabled,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(existing._id);
  },
});

export const getMyWeightProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("userWeightProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (profile) {
      return profile;
    }

    return {
      _id: null,
      userId: user._id,
      globalWeight: user.reputation ?? 1,
      globalCredibilityScore: 50,
      publicProfileEnabled: false,
    };
  },
});

export const getWeightProfileByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const requester = await requireUser(ctx);
    const profile = await ctx.db
      .query("userWeightProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      const user = await ctx.db.get(args.userId);
      return {
        userId: args.userId,
        globalWeight: user?.reputation ?? 1,
        globalCredibilityScore: 50,
        publicProfileEnabled: requester._id === args.userId,
      };
    }

    const canView = profile.publicProfileEnabled || requester._id === args.userId;
    if (!canView) {
      return null;
    }
    return profile;
  },
});

export const listPublicWeightProfiles = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("userWeightProfiles")
      .withIndex("by_publicProfileEnabled", (q) =>
        q.eq("publicProfileEnabled", true)
      )
      .collect();

    const limit = args.limit ?? 50;
    return rows
      .sort((a, b) => b.globalWeight - a.globalWeight)
      .slice(0, limit);
  },
});

export const setRoomWeightOverride = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    projectWeight: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOwnerPermission(ctx, args.roomId, user._id);

    const normalizedWeight = round2(clamp(args.projectWeight, 0.5, 2.5));
    const existing = await ctx.db
      .query("roomWeightOverrides")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        projectWeight: normalizedWeight,
        reason: args.reason,
        createdBy: user._id,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("roomWeightOverrides", {
      roomId: args.roomId,
      userId: args.userId,
      projectWeight: normalizedWeight,
      reason: args.reason,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listRoomWeightOverrides = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireRoomMember(ctx, args.roomId, user._id);

    return await ctx.db
      .query("roomWeightOverrides")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
  },
});

export const getEffectiveWeight = query({
  args: {
    roomId: v.id("rooms"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const requester = await requireUser(ctx);
    await requireRoomMember(ctx, args.roomId, requester._id);

    const targetUserId = args.userId ?? requester._id;
    const roomMemberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const inRoom = roomMemberships.some((m) => m.userId === targetUserId);
    if (!inRoom) {
      throw new Error("Target user is not a member of this room");
    }

    const override = await ctx.db
      .query("roomWeightOverrides")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", targetUserId)
      )
      .first();

    const profile = await ctx.db
      .query("userWeightProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
      .first();

    const globalWeight = profile?.globalWeight ?? 1;
    const effectiveWeight = override?.projectWeight ?? globalWeight;

    return {
      userId: targetUserId,
      roomId: args.roomId,
      globalWeight,
      effectiveWeight,
      overrideWeight: override?.projectWeight ?? null,
      publicProfileEnabled: profile?.publicProfileEnabled ?? false,
    };
  },
});
