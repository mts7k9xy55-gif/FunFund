// convex/threads.ts
// Thread作成: 書き込みガード + 理由必須チェック

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireWritePermission, requireReason } from "./_guards";
import { Id } from "./_generated/dataModel";

/**
 * Threadを作成
 * - proposal/project の場合は reason 必須
 * - 書き込みガード適用（active room + member/owner）
 */
export const createThread = mutation({
  args: {
    roomId: v.id("rooms"),
    type: v.union(
      v.literal("comment"),
      v.literal("proposal"),
      v.literal("project")
    ),
    title: v.optional(v.string()),
    initialBody: v.string(),
    reason: v.optional(v.string()), // proposal/projectの場合は必須
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // 書き込みガード: active room + member/owner
    await requireWritePermission(ctx, args.roomId, user._id);

    // proposal/projectの場合は理由必須
    if (args.type === "proposal" || args.type === "project") {
      requireReason(args.reason, `${args.type} creation`);
    }

    // Thread作成
    const threadId = await ctx.db.insert("threads", {
      roomId: args.roomId,
      type: args.type,
      title: args.title,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    // 最初のメッセージ（comment）を作成
    await ctx.db.insert("messages", {
      roomId: args.roomId,
      threadId,
      kind: "comment",
      body: args.initialBody,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    // proposal/projectの場合は理由メッセージも作成
    if (args.reason && (args.type === "proposal" || args.type === "project")) {
      await ctx.db.insert("messages", {
        roomId: args.roomId,
        threadId,
        kind: "reason",
        body: args.reason,
        createdBy: user._id,
        createdAt: Date.now(),
      });
    }

    return threadId;
  },
});

/**
 * Room内のThread一覧を取得
 */
export const listThreads = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // メンバーかチェック
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    
    const membership = memberships.find((m) => m.userId === user._id);

    if (!membership) {
      throw new Error("You are not a member of this room");
    }

    const threads = await ctx.db
      .query("threads")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return threads;
  },
});

/**
 * Threadの詳細を取得（メッセージ、判断、実行ログを含む）
 */
export const getThread = query({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);

    if (!thread) {
      return null;
    }

    // メンバーかチェック
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", thread.roomId))
      .collect();
    
    const membership = memberships.find((m) => m.userId === user._id);

    if (!membership) {
      throw new Error("You are not a member of this room");
    }

    // メッセージ一覧（非表示返信は owner/送信者のみ閲覧可能）
    const messagesRaw = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
    const messages = messagesRaw.filter((message) => {
      if (!message.hiddenAt) {
        return true;
      }
      return membership.role === "owner" || message.createdBy === user._id;
    });

    // 判断一覧
    const decisionsRaw = await ctx.db
      .query("decisions")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    const decisions = decisionsRaw.filter((decision) => {
      const visibility = decision.visibility ?? "private";
      if (decision.createdBy === user._id) {
        return true;
      }
      if (visibility === "public") {
        return true;
      }
      if (visibility === "shared_to_target" && decision.targetUserId === user._id) {
        return true;
      }
      return false;
    });

    // 実行ログ一覧
    const executions = await ctx.db
      .query("executions")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    return {
      thread,
      messages,
      decisions,
      executions,
    };
  },
});
