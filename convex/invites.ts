import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ランダムな招待コードを生成
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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

// 招待リンクを作成
export const createInvite = mutation({
  args: {
    expiresInDays: v.optional(v.number()), // 何日後に期限切れ（デフォルト: 7日）
  },
  handler: async (ctx, args) => {
    try {
      const user = await getAuthenticatedUser(ctx);

      const code = generateInviteCode();
      const expiresInDays = args.expiresInDays ?? 7;
      const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;

      await ctx.db.insert("invites", {
        code,
        createdBy: user._id,
        expiresAt,
        createdAt: Date.now(),
      });

      return { code };
    } catch (error: any) {
      console.error("createInvite error:", error);
      throw new Error(`Failed to create invite: ${error.message}`);
    }
  },
});

// 招待コードを使用してつながりを作成
export const useInvite = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // 招待コードを検索
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!invite) {
      throw new Error("招待コードが見つかりません");
    }

    // 既に使用済み
    if (invite.usedBy) {
      throw new Error("この招待コードは既に使用されています");
    }

    // 期限切れ
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      throw new Error("この招待コードは期限切れです");
    }

    // 自分の招待コードは使えない
    if (invite.createdBy === user._id) {
      throw new Error("自分の招待コードは使用できません");
    }

    // 既につながっているか確認
    const allConnections = await ctx.db.query("connections").collect();
    const existingConnection = allConnections.find(
      (c) =>
        c.status === "accepted" &&
        ((c.fromUserId === user._id && c.toUserId === invite.createdBy) ||
          (c.fromUserId === invite.createdBy && c.toUserId === user._id))
    );

    if (existingConnection) {
      throw new Error("既につながっています");
    }

    // 招待コードを使用済みにマーク
    await ctx.db.patch(invite._id, {
      usedBy: user._id,
      usedAt: Date.now(),
    });

    // つながりを作成（即座に accepted）
    await ctx.db.insert("connections", {
      fromUserId: invite.createdBy,
      toUserId: user._id,
      status: "accepted",
      createdAt: Date.now(),
    });

    // 招待者の情報を取得
    const inviter = await ctx.db.get(invite.createdBy);

    return {
      success: true,
      inviterName: inviter?.name ?? "Unknown",
    };
  },
});

// 自分の招待リンク一覧を取得
export const listMyInvites = query({
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

    const invites = await ctx.db
      .query("invites")
      .withIndex("by_createdBy", (q) => q.eq("createdBy", user._id))
      .collect();

    // 使用者の情報を取得
    const invitesWithUsers = await Promise.all(
      invites.map(async (invite) => {
        let usedByUser = null;
        if (invite.usedBy) {
          usedByUser = await ctx.db.get(invite.usedBy);
        }
        return {
          ...invite,
          usedByUser,
          isExpired: invite.expiresAt ? invite.expiresAt < Date.now() : false,
        };
      })
    );

    return invitesWithUsers;
  },
});

// 招待コードの情報を取得（使用前の確認用）
export const getInviteInfo = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!invite) {
      return { valid: false, error: "招待コードが見つかりません" };
    }

    if (invite.usedBy) {
      return { valid: false, error: "この招待コードは既に使用されています" };
    }

    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      return { valid: false, error: "この招待コードは期限切れです" };
    }

    const inviter = await ctx.db.get(invite.createdBy);

    return {
      valid: true,
      inviterName: inviter?.name ?? "Unknown",
      expiresAt: invite.expiresAt,
    };
  },
});
