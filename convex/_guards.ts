// convex/_guards.ts
// 書き込みガード: 軽いSNS化を防ぐための共通関数

import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";

/**
 * 認証IDに紐づくユーザーを取得（存在しない場合はnull）
 */
export async function getUserOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .first();

  return user ?? null;
}

/**
 * 認証済みユーザーを取得（全mutation/queryで使用）
 * QueryCtxの場合はユーザーが存在しないとエラー
 * MutationCtxの場合はユーザーが存在しないと作成を試みる
 */
export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: ログインが必要です");
  }

  const user = await getUserOrNull(ctx);

  if (!user) {
    // MutationCtxの場合のみユーザー作成を試みる
    if ("insert" in ctx.db) {
      try {
        const newUser = await ctx.db.insert("users", {
          userId: identity.subject,
          name: identity.name ?? identity.email ?? "Unknown",
          role: "human",
          reputation: 1.0,
          createdAt: Date.now(),
        });
        const createdUser = await ctx.db.get(newUser);
        if (!createdUser) {
          throw new Error("Failed to create user");
        }
        return createdUser;
      } catch (insertError: any) {
        // 重複エラーの場合は既存のユーザーを再取得
        if (insertError.message?.includes("duplicate") || insertError.message?.includes("unique")) {
          const existingUser = await ctx.db
            .query("users")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .first();
          if (existingUser) {
            return existingUser;
          }
        }
        throw new Error(`User not found and creation failed: ${insertError.message}`);
      }
    } else {
      // QueryCtxの場合はユーザーが見つからないとエラー
      throw new Error("User not found: ユーザーが見つかりません");
    }
  }

  return user;
}

/**
 * Roomがアクティブかチェック（書き込み不可ならthrow）
 * 最重要ガード: status !== "active" のRoomには一切書き込みできない
 */
export async function requireActiveRoom(
  ctx: QueryCtx | MutationCtx,
  roomId: Id<"rooms">
) {
  const room = await ctx.db.get(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  if (room.status !== "active") {
    throw new Error(
      `Room is not active (status: ${room.status}). Only active rooms allow writing.`
    );
  }

  return room;
}

/**
 * ユーザーがRoomのメンバーかチェックし、roleを返す
 */
export async function requireRoomMember(
  ctx: QueryCtx | MutationCtx,
  roomId: Id<"rooms">,
  userId: Id<"users">
) {
  const memberships = await ctx.db
    .query("roomMembers")
    .withIndex("by_room", (q) => q.eq("roomId", roomId))
    .collect();

  const membership = memberships.find((m) => m.userId === userId);

  if (!membership) {
    throw new Error("You are not a member of this room");
  }

  return membership;
}

/**
 * 書き込み権限をチェック（viewerは書き込み不可）
 * owner/memberのみ書き込み可能
 */
export async function requireWritePermission(
  ctx: QueryCtx | MutationCtx,
  roomId: Id<"rooms">,
  userId: Id<"users">
) {
  // まずRoomがアクティブかチェック
  await requireActiveRoom(ctx, roomId);

  // メンバーシップとroleを取得
  const membership = await requireRoomMember(ctx, roomId, userId);

  // viewerは書き込み不可
  if (membership.role === "viewer") {
    throw new Error("Viewers cannot write. Only owners and members can write.");
  }

  return membership;
}

/**
 * owner権限をチェック（メンバー追加などownerのみの操作）
 */
export async function requireOwnerPermission(
  ctx: QueryCtx | MutationCtx,
  roomId: Id<"rooms">,
  userId: Id<"users">
) {
  const membership = await requireRoomMember(ctx, roomId, userId);

  if (membership.role !== "owner") {
    throw new Error("Only room owners can perform this action");
  }

  return membership;
}

/**
 * 理由（reason）が必須かチェック
 * proposal/project/decisionでは理由が必須
 */
export function requireReason(reason: string | undefined | null, context: string) {
  if (!reason || reason.trim().length === 0) {
    throw new Error(`${context} requires a reason. Empty reasons are not allowed.`);
  }
}
