// convex/rooms.ts
// Room管理: 作成、メンバー追加、一覧取得

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireUser, requireOwnerPermission } from "./_guards";
import { Id } from "./_generated/dataModel";

/**
 * Roomを作成
 */
export const createRoom = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      ownerId: user._id,
      status: "draft", // 作成時はdraft
      createdAt: Date.now(),
    });

    // 作成者をownerとして追加
    await ctx.db.insert("roomMembers", {
      roomId,
      userId: user._id,
      role: "owner",
      joinedAt: Date.now(),
    });

    return roomId;
  },
});

/**
 * Roomをアクティブ化（ownerのみ）
 */
export const activateRoom = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOwnerPermission(ctx, args.roomId, user._id);

    await ctx.db.patch(args.roomId, {
      status: "active",
    });

    return args.roomId;
  },
});

/**
 * Roomにメンバーを追加（ownerのみ）
 */
export const addMember = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    role: v.union(v.literal("member"), v.literal("viewer")), // ownerは追加不可
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOwnerPermission(ctx, args.roomId, user._id);

    // 既存のメンバーシップをチェック
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    const existing = memberships.find((m) => m.userId === args.userId);

    if (existing) {
      throw new Error("User is already a member of this room");
    }

    await ctx.db.insert("roomMembers", {
      roomId: args.roomId,
      userId: args.userId,
      role: args.role,
      joinedAt: Date.now(),
    });

    return args.roomId;
  },
});

/**
 * 自分のRoom一覧を取得
 */
export const listRoomsForMe = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const rooms = await Promise.all(
      memberships.map(async (m) => {
        const room = await ctx.db.get(m.roomId);
        if (!room) return null;
        return {
          ...room,
          myRole: m.role,
        };
      })
    );

    return rooms.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

/**
 * Roomの詳細を取得
 */
export const getRoom = query({
  args: {
    roomId: v.id("rooms"),
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

    return {
      ...room,
      myRole: membership.role,
    };
  },
});

/**
 * Webhook用: Roomのstatusを更新（internal mutation）
 * Stripe webhookから呼び出される
 */
export const updateRoomStatusFromWebhook = internalMutation({
  args: {
    roomId: v.id("rooms"),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled")
    ),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error(`Room not found: ${args.roomId}`);
    }

    await ctx.db.patch(args.roomId, {
      status: args.status,
    });

    return args.roomId;
  },
});

/**
 * Webhook用: Stripe customer IDでRoomを検索してstatusを更新
 */
export const updateRoomStatusByStripeCustomer = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled")
    ),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_stripeCustomer", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (!room) {
      throw new Error(`Room not found for Stripe customer: ${args.stripeCustomerId}`);
    }

    await ctx.db.patch(room._id, {
      status: args.status,
    });

    return room._id;
  },
});

/**
 * RoomにStripe情報を保存（Checkout完了時）
 */
export const setRoomStripeInfo = internalMutation({
  args: {
    roomId: v.id("rooms"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error(`Room not found: ${args.roomId}`);
    }

    await ctx.db.patch(args.roomId, {
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
    });

    return args.roomId;
  },
});
