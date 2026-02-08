// convex/rooms.ts
// Room管理: 作成、メンバー追加、一覧取得

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireUser, requireOwnerPermission } from "./_guards";
import { Id } from "./_generated/dataModel";

/**
 * ランダムな招待コードを生成
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 0, I, O を除外
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Roomを作成
 */
export const createRoom = mutation({
  args: {
    name: v.string(),
    isPrivate: v.optional(v.boolean()),
    evaluationMode: v.optional(v.union(v.literal("open"), v.literal("closed"))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const isPrivate = args.isPrivate ?? false;
    const inviteCode = isPrivate ? generateInviteCode() : undefined;

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      ownerId: user._id,
      status: "draft", // 作成時はdraft
      isPrivate,
      inviteCode,
      evaluationMode: args.evaluationMode ?? "open",
      virtualFundBalance: 0,
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
 * 招待コードでRoomに参加
 */
export const joinRoomByInviteCode = mutation({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .first();

    if (!room) {
      throw new Error("Invalid invite code");
    }

    if (!room.isPrivate) {
      throw new Error("This room is not private");
    }

    // 既にメンバーかチェック
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    const existing = memberships.find((m) => m.userId === user._id);
    if (existing) {
      return room._id; // 既にメンバーならそのまま返す
    }

    // メンバーとして追加
    await ctx.db.insert("roomMembers", {
      roomId: room._id,
      userId: user._id,
      role: "member",
      joinedAt: Date.now(),
    });

    return room._id;
  },
});

/**
 * Roomの招待コードを再生成（ownerのみ）
 */
export const regenerateInviteCode = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOwnerPermission(ctx, args.roomId, user._id);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (!room.isPrivate) {
      throw new Error("This room is not private");
    }

    const newInviteCode = generateInviteCode();

    await ctx.db.patch(args.roomId, {
      inviteCode: newInviteCode,
    });

    return newInviteCode;
  },
});

/**
 * Roomのプライベート設定を変更（ownerのみ）
 */
export const updateRoomPrivacy = mutation({
  args: {
    roomId: v.id("rooms"),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOwnerPermission(ctx, args.roomId, user._id);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const inviteCode = args.isPrivate
      ? room.inviteCode ?? generateInviteCode()
      : undefined;

    await ctx.db.patch(args.roomId, {
      isPrivate: args.isPrivate,
      inviteCode,
    });

    return args.roomId;
  },
});

/**
 * Roomの評価モードを変更（ownerのみ）
 */
export const updateRoomEvaluationMode = mutation({
  args: {
    roomId: v.id("rooms"),
    evaluationMode: v.union(v.literal("open"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireOwnerPermission(ctx, args.roomId, user._id);

    await ctx.db.patch(args.roomId, {
      evaluationMode: args.evaluationMode,
    });

    return args.roomId;
  },
});

/**
 * Roomの仮想Fund残高を取得
 */
export const getRoomVirtualFundBalance = query({
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

    // 評価から仮想Fund残高を計算
    // 各Threadの平均評価スコアに基づいて仮想的なFundを計算
    const threads = await ctx.db
      .query("threads")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    let totalFund = 0;

    for (const thread of threads) {
      const evaluations = await ctx.db
        .query("evaluations")
        .withIndex("by_threadId", (q) => q.eq("threadId", thread._id))
        .collect();

      if (evaluations.length > 0) {
        const avgScore =
          evaluations.reduce((sum, e) => sum + e.weightedScore, 0) /
          evaluations.length;
        // スコア（1-5）を仮想Fund（0-1000）に変換
        const fundValue = (avgScore / 5) * 1000;
        totalFund += fundValue;
      }
    }

    // Roomの仮想Fund残高を更新（非同期で更新する場合は別途mutationが必要）
    return {
      balance: Math.round(totalFund),
      threadCount: threads.length,
    };
  },
});

/**
 * Roomの仮想Fund残高を更新（内部用）
 */
export const updateRoomVirtualFundBalance = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
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

    // 評価から仮想Fund残高を計算
    const threads = await ctx.db
      .query("threads")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    let totalFund = 0;

    for (const thread of threads) {
      const evaluations = await ctx.db
        .query("evaluations")
        .withIndex("by_threadId", (q) => q.eq("threadId", thread._id))
        .collect();

      if (evaluations.length > 0) {
        const avgScore =
          evaluations.reduce((sum, e) => sum + e.weightedScore, 0) /
          evaluations.length;
        const fundValue = (avgScore / 5) * 1000;
        totalFund += fundValue;
      }
    }

    await ctx.db.patch(args.roomId, {
      virtualFundBalance: Math.round(totalFund),
    });

    return Math.round(totalFund);
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
