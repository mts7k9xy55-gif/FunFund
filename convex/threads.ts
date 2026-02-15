// convex/threads.ts
// Thread作成: 書き込みガード + 理由必須チェック

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getUserOrNull,
  requireOwnerPermission,
  requireReason,
  requireRoomMember,
  requireUser,
  requireWritePermission,
} from "./_guards";

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeOptions(options: string[] | undefined): string[] | undefined {
  if (!options) {
    return undefined;
  }
  const normalized = options.map((row) => row.trim()).filter((row) => row.length > 0);
  return normalized.length > 0 ? normalized : undefined;
}

function safeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function compactUndefined<T extends Record<string, unknown>>(row: T): T {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined) {
      next[key] = value;
    }
  }
  return next as T;
}

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
    decisionOwnerId: v.optional(v.id("users")),
    dueAt: v.optional(v.number()),
    meetingUrl: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    commitmentGoalAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // 書き込みガード: active room + member/owner
    await requireWritePermission(ctx, args.roomId, user._id);

    // proposal/projectの場合は理由必須
    if (args.type === "proposal" || args.type === "project") {
      requireReason(args.reason, `${args.type} creation`);
    }
    if (args.decisionOwnerId) {
      await requireRoomMember(ctx, args.roomId, args.decisionOwnerId);
    }
    if (args.dueAt !== undefined && (!Number.isFinite(args.dueAt) || args.dueAt <= 0)) {
      throw new Error("Invalid dueAt");
    }
    if (
      args.commitmentGoalAmount !== undefined &&
      (!Number.isFinite(args.commitmentGoalAmount) || args.commitmentGoalAmount <= 0)
    ) {
      throw new Error("Invalid commitment goal amount");
    }

    // Thread作成
    const threadId = await ctx.db.insert("threads", {
      roomId: args.roomId,
      type: args.type,
      title: normalizeOptionalText(args.title),
      decisionOwnerId: args.decisionOwnerId,
      dueAt: args.dueAt,
      meetingUrl: normalizeOptionalText(args.meetingUrl),
      options: normalizeOptions(args.options),
      commitmentGoalAmount:
        args.commitmentGoalAmount !== undefined
          ? Math.round(args.commitmentGoalAmount)
          : undefined,
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
 * Threadをアーカイブ/解除（ownerのみ）
 */
export const setThreadArchived = mutation({
  args: {
    threadId: v.id("threads"),
    archived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    await requireOwnerPermission(ctx, thread.roomId, user._id);

    await ctx.db.patch(args.threadId, {
      archivedAt: args.archived ? Date.now() : undefined,
      archivedBy: args.archived ? user._id : undefined,
    });

    return args.threadId;
  },
});

/**
 * Threadを削除（ownerのみ）
 */
export const deleteThread = mutation({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    await requireOwnerPermission(ctx, thread.roomId, user._id);

    const [messages, decisions, executions, layerInputs, evaluations, proposals, commitments] =
      await Promise.all([
        ctx.db
          .query("messages")
          .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
          .collect(),
        ctx.db
          .query("decisions")
          .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
          .collect(),
        ctx.db
          .query("executions")
          .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
          .collect(),
        ctx.db
          .query("layerInputs")
          .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
          .collect(),
        ctx.db
          .query("evaluations")
          .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
          .collect(),
        ctx.db
          .query("distributionProposals")
          .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
          .collect(),
        ctx.db
          .query("commitments")
          .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
          .collect(),
      ]);

    for (const proposal of proposals) {
      const payoutRows = await ctx.db
        .query("payoutLedger")
        .withIndex("by_distributionProposalId", (q) =>
          q.eq("distributionProposalId", proposal._id)
        )
        .collect();
      await Promise.all(
        payoutRows.map((row) =>
          ctx.db.patch(row._id, {
            distributionProposalId: undefined,
            updatedAt: Date.now(),
          })
        )
      );
    }

    await Promise.all([
      ...messages.map((row) => ctx.db.delete(row._id)),
      ...decisions.map((row) => ctx.db.delete(row._id)),
      ...executions.map((row) => ctx.db.delete(row._id)),
      ...layerInputs.map((row) => ctx.db.delete(row._id)),
      ...evaluations.map((row) => ctx.db.delete(row._id)),
      ...proposals.map((row) => ctx.db.delete(row._id)),
      ...commitments.map((row) => ctx.db.delete(row._id)),
    ]);

    await ctx.db.delete(args.threadId);
    return args.threadId;
  },
});

/**
 * Room内のThread一覧を取得
 */
export const listThreads = query({
  args: {
    roomId: v.string(),
  },
  handler: async (ctx, args) => {
    let normalizedRoomId = null;
    try {
      normalizedRoomId = ctx.db.normalizeId("rooms", args.roomId);
    } catch {
      return [];
    }
    if (!normalizedRoomId) {
      return [];
    }
    const user = await getUserOrNull(ctx);
    if (!user) {
      return [];
    }

    // メンバーかチェック
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", normalizedRoomId))
      .collect();
    
    const membership = memberships.find((m) => m.userId === user._id);

    if (!membership) {
      return [];
    }

    const threads = await ctx.db
      .query("threads")
      .withIndex("by_room", (q) => q.eq("roomId", normalizedRoomId))
      .collect();

    return await Promise.all(
      threads.map(async (thread) => {
        const commitments = await ctx.db
          .query("commitments")
          .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
          .collect();
        const commitmentTotal = commitments.reduce((sum, row) => {
          const amount = safeNumber(row.amount) ?? 0;
          return sum + amount;
        }, 0);
        return {
          ...compactUndefined({
            _id: thread._id,
            _creationTime: thread._creationTime,
            roomId: thread.roomId,
            type: thread.type,
            title: typeof thread.title === "string" ? thread.title : undefined,
            decisionOwnerId: thread.decisionOwnerId,
            dueAt: safeNumber(thread.dueAt),
            meetingUrl: typeof thread.meetingUrl === "string" ? thread.meetingUrl : undefined,
            options: Array.isArray(thread.options)
              ? thread.options.filter((row): row is string => typeof row === "string")
              : undefined,
            commitmentGoalAmount: safeNumber(thread.commitmentGoalAmount),
            createdBy: thread.createdBy,
            createdAt: safeNumber(thread.createdAt) ?? Date.now(),
            archivedAt: safeNumber(thread.archivedAt),
            archivedBy: thread.archivedBy,
          }),
          commitmentTotal: Math.round(commitmentTotal),
          commitmentCount: commitments.length,
        };
      })
    );
  },
});

/**
 * Threadの詳細を取得（メッセージ、判断、実行ログを含む）
 */
export const getThread = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    let normalizedThreadId = null;
    try {
      normalizedThreadId = ctx.db.normalizeId("threads", args.threadId);
    } catch {
      return null;
    }
    if (!normalizedThreadId) {
      return null;
    }
    try {
      const user = await getUserOrNull(ctx);
      if (!user) {
        return null;
      }
      const thread = await ctx.db.get(normalizedThreadId);

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
        return null;
      }

      // データ不整合があってもスレッド画面を落とさない
      let decisionsRaw: any[] = [];
      try {
        decisionsRaw = await ctx.db
          .query("decisions")
          .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
          .collect();
      } catch {
        decisionsRaw = [];
      }

      const legacyDecisionReasonIds = new Set(
        decisionsRaw.map((decision) => decision.reasonMessageId)
      );

      let messagesRaw: any[] = [];
      try {
        messagesRaw = await ctx.db
          .query("messages")
          .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
          .collect();
      } catch {
        messagesRaw = [];
      }
      const messages = messagesRaw.filter((message) => {
        if (
          message.kind === "reason" &&
          legacyDecisionReasonIds.has(message._id)
        ) {
          return false;
        }

        if (!message.hiddenAt) {
          return true;
        }
        return membership.role === "owner" || message.createdBy === user._id;
      });

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

      let executions: any[] = [];
      try {
        executions = await ctx.db
          .query("executions")
          .withIndex("by_thread", (q) => q.eq("threadId", normalizedThreadId))
          .collect();
      } catch {
        executions = [];
      }

      return {
        thread,
        messages,
        decisions,
        executions,
      };
    } catch {
      return null;
    }
  },
});
