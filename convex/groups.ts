import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ヘルパー: 認証済みユーザーを取得
async function getAuthenticatedUser(ctx: any) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: ログインが必要です");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();

    if (!user) {
      // ユーザーが存在しない場合は作成を試みる
      try {
        const newUser = await ctx.db.insert("users", {
          userId: identity.subject,
          name: identity.name ?? identity.email ?? "Unknown",
          role: "human",
          reputation: 1.0,
          createdAt: Date.now(),
        });
        return await ctx.db.get(newUser);
      } catch (insertError: any) {
        // 重複エラーの場合は既存のユーザーを再取得
        if (insertError.message?.includes("duplicate") || insertError.message?.includes("unique")) {
          const existingUser = await ctx.db
            .query("users")
            .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
            .first();
          if (existingUser) {
            return existingUser;
          }
        }
        throw new Error(`User not found and creation failed: ${insertError.message}`);
      }
    }

    return user;
  } catch (error: any) {
    console.error("getAuthenticatedUser error:", error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// グループを作成
export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("dm"), v.literal("project"), v.literal("public")),
    memberIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    try {
      const user = await getAuthenticatedUser(ctx);

      // メンバーリストに自分を含める
      const memberIds = args.memberIds ?? [];
      if (!memberIds.includes(user._id)) {
        memberIds.push(user._id);
      }

      return await ctx.db.insert("groups", {
        name: args.name,
        description: args.description,
        type: args.type,
        memberIds,
        createdBy: user._id,
        createdAt: Date.now(),
      });
    } catch (error: any) {
      console.error("createGroup error:", error);
      throw new Error(`Failed to create group: ${error.message}`);
    }
  },
});

// DM グループを作成（1対1）
export const createDM = mutation({
  args: {
    recipientId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // 既存の DM があるか確認
    const allGroups = await ctx.db
      .query("groups")
      .withIndex("by_type", (q) => q.eq("type", "dm"))
      .collect();

    const existingDM = allGroups.find(
      (g) =>
        g.memberIds.length === 2 &&
        g.memberIds.includes(user._id) &&
        g.memberIds.includes(args.recipientId)
    );

    if (existingDM) {
      return existingDM._id;
    }

    // 新規 DM グループ作成
    return await ctx.db.insert("groups", {
      name: "DM",
      type: "dm",
      memberIds: [user._id, args.recipientId],
      createdBy: user._id,
      createdAt: Date.now(),
    });
  },
});

// 自分が参加しているグループ一覧を取得
export const listMyGroups = query({
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

    const allGroups = await ctx.db.query("groups").collect();

    // 自分がメンバーのグループのみ返す（DMを除く）
    return allGroups.filter((g) => g.memberIds.includes(user._id) && g.type !== "dm");
  },
});

// 自分のDM一覧を取得
export const listMyDMs = query({
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

    const allGroups = await ctx.db
      .query("groups")
      .withIndex("by_type", (q) => q.eq("type", "dm"))
      .collect();

    // 自分がメンバーのDMのみ
    const myDMs = allGroups.filter((g) => g.memberIds.includes(user._id));

    // 相手のユーザー名を取得
    const dmsWithOtherUser = await Promise.all(
      myDMs.map(async (dm) => {
        const otherUserId = dm.memberIds.find((id) => id !== user._id);
        const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;
        return {
          ...dm,
          otherUserName: otherUser?.name ?? "Unknown",
          otherUserId,
        };
      })
    );

    return dmsWithOtherUser;
  },
});

// グループにメンバーを追加
export const addMember = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // 自分がメンバーでないとメンバーを追加できない
    if (!group.memberIds.includes(user._id)) {
      throw new Error("Forbidden: このグループにメンバーを追加する権限がありません");
    }

    // DM は 2 人まで
    if (group.type === "dm" && group.memberIds.length >= 2) {
      throw new Error("DM は 2 人までです");
    }

    // 既にメンバーなら何もしない
    if (group.memberIds.includes(args.userId)) {
      return group._id;
    }

    await ctx.db.patch(args.groupId, {
      memberIds: [...group.memberIds, args.userId],
    });

    return group._id;
  },
});

// グループからメンバーを削除
export const removeMember = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // 作成者のみがメンバーを削除可能（または自分自身を削除）
    if (group.createdBy !== user._id && args.userId !== user._id) {
      throw new Error("Forbidden: このグループからメンバーを削除する権限がありません");
    }

    const newMemberIds = group.memberIds.filter((id) => id !== args.userId);

    await ctx.db.patch(args.groupId, {
      memberIds: newMemberIds,
    });

    return group._id;
  },
});

// グループの詳細を取得
export const getGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) {
      return null;
    }

    // メンバーでないと見られない（public 以外）
    if (group.type !== "public" && !group.memberIds.includes(user._id)) {
      return null;
    }

    return group;
  },
});
