import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ヘルパー: 認証済みユーザーを取得
async function getAuthenticatedUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: ログインが必要です");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
    .first();

  if (!user) {
    throw new Error("User not found: ユーザーが見つかりません");
  }

  return user;
}

// つながりリクエストを送信
export const sendRequest = mutation({
  args: {
    toUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // 自分自身には送れない
    if (user._id === args.toUserId) {
      throw new Error("自分自身にはリクエストを送れません");
    }

    // 既存のつながりを確認
    const existingConnections = await ctx.db
      .query("connections")
      .withIndex("by_from", (q) => q.eq("fromUserId", user._id))
      .collect();

    const existing = existingConnections.find(
      (c) => c.toUserId === args.toUserId
    );

    if (existing) {
      if (existing.status === "accepted") {
        throw new Error("既につながっています");
      }
      if (existing.status === "pending") {
        throw new Error("既にリクエストを送信済みです");
      }
      if (existing.status === "blocked") {
        throw new Error("このユーザーはブロックされています");
      }
    }

    // 逆方向のリクエストがあるか確認
    const reverseConnections = await ctx.db
      .query("connections")
      .withIndex("by_from", (q) => q.eq("fromUserId", args.toUserId))
      .collect();

    const reverseRequest = reverseConnections.find(
      (c) => c.toUserId === user._id && c.status === "pending"
    );

    // 相手からのリクエストがあれば、自動的に承認
    if (reverseRequest) {
      await ctx.db.patch(reverseRequest._id, {
        status: "accepted",
        updatedAt: Date.now(),
      });
      return { status: "accepted", message: "つながりが成立しました" };
    }

    // 新規リクエストを作成
    await ctx.db.insert("connections", {
      fromUserId: user._id,
      toUserId: args.toUserId,
      status: "pending",
      createdAt: Date.now(),
    });

    return { status: "pending", message: "リクエストを送信しました" };
  },
});

// つながりリクエストを承認
export const acceptRequest = mutation({
  args: {
    connectionId: v.id("connections"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("リクエストが見つかりません");
    }

    // 自分宛てのリクエストのみ承認可能
    if (connection.toUserId !== user._id) {
      throw new Error("このリクエストを承認する権限がありません");
    }

    if (connection.status !== "pending") {
      throw new Error("このリクエストは既に処理されています");
    }

    await ctx.db.patch(args.connectionId, {
      status: "accepted",
      updatedAt: Date.now(),
    });

    return { status: "accepted", message: "つながりが成立しました" };
  },
});

// つながりリクエストを拒否
export const rejectRequest = mutation({
  args: {
    connectionId: v.id("connections"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("リクエストが見つかりません");
    }

    // 自分宛てのリクエストのみ拒否可能
    if (connection.toUserId !== user._id) {
      throw new Error("このリクエストを拒否する権限がありません");
    }

    // リクエストを削除
    await ctx.db.delete(args.connectionId);

    return { message: "リクエストを拒否しました" };
  },
});

// つながりを解除
export const disconnect = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // 両方向のつながりを検索
    const allConnections = await ctx.db.query("connections").collect();

    const connection = allConnections.find(
      (c) =>
        c.status === "accepted" &&
        ((c.fromUserId === user._id && c.toUserId === args.userId) ||
          (c.fromUserId === args.userId && c.toUserId === user._id))
    );

    if (!connection) {
      throw new Error("つながりが見つかりません");
    }

    await ctx.db.delete(connection._id);

    return { message: "つながりを解除しました" };
  },
});

// 受信したリクエスト一覧を取得
export const listPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const requests = await ctx.db
      .query("connections")
      .withIndex("by_to", (q) => q.eq("toUserId", user._id))
      .collect();

    const pendingRequests = requests.filter((r) => r.status === "pending");

    // リクエスト送信者の情報を取得
    const requestsWithUsers = await Promise.all(
      pendingRequests.map(async (r) => {
        const fromUser = await ctx.db.get(r.fromUserId);
        return {
          ...r,
          fromUser,
        };
      })
    );

    return requestsWithUsers;
  },
});

// つながっているユーザー一覧を取得
export const listConnections = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const allConnections = await ctx.db.query("connections").collect();

    // 自分が関わっている accepted なつながり
    const myConnections = allConnections.filter(
      (c) =>
        c.status === "accepted" &&
        (c.fromUserId === user._id || c.toUserId === user._id)
    );

    // 相手ユーザーの情報を取得
    const connectionsWithUsers = await Promise.all(
      myConnections.map(async (c) => {
        const otherUserId =
          c.fromUserId === user._id ? c.toUserId : c.fromUserId;
        const otherUser = await ctx.db.get(otherUserId);
        return {
          connectionId: c._id,
          user: otherUser,
          connectedAt: c.updatedAt ?? c.createdAt,
        };
      })
    );

    return connectionsWithUsers;
  },
});

// 特定ユーザーとのつながり状態を取得
export const getConnectionStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { status: "none" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();

    if (!user) {
      return { status: "none" };
    }

    const allConnections = await ctx.db.query("connections").collect();

    // 自分からのリクエスト
    const sentRequest = allConnections.find(
      (c) => c.fromUserId === user._id && c.toUserId === args.userId
    );

    if (sentRequest) {
      return { status: sentRequest.status, direction: "sent" };
    }

    // 相手からのリクエスト
    const receivedRequest = allConnections.find(
      (c) => c.fromUserId === args.userId && c.toUserId === user._id
    );

    if (receivedRequest) {
      return {
        status: receivedRequest.status,
        direction: "received",
        connectionId: receivedRequest._id,
      };
    }

    return { status: "none" };
  },
});
