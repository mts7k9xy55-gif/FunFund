import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireRoomMember,
  requireUser,
  requireWritePermission,
  requireReason,
} from "./_guards";

type DecisionVisibility = "private" | "shared_to_target" | "public";

function clampDecisionScore(score: number): number {
  if (!Number.isFinite(score) || score < 1 || score > 10) {
    throw new Error("Decision score must be between 1 and 10");
  }
  return Math.round(score);
}

function mapStanceToScore(stance: "yes" | "no" | "hold"): number {
  if (stance === "yes") return 8;
  if (stance === "hold") return 5;
  return 2;
}

function mapScoreToStance(score: number): "yes" | "no" | "hold" {
  if (score >= 7) return "yes";
  if (score <= 3) return "no";
  return "hold";
}

function resolveVisibility(
  requested: DecisionVisibility,
  publishConsentByEvaluator: boolean,
  publishConsentByTarget: boolean
): DecisionVisibility {
  if (requested !== "public") {
    return requested;
  }
  if (publishConsentByEvaluator && publishConsentByTarget) {
    return "public";
  }
  return "shared_to_target";
}

function canViewDecision(
  viewerUserId: string,
  decision: {
    createdBy: string;
    targetUserId?: string;
    visibility?: DecisionVisibility;
  }
): boolean {
  if (decision.createdBy === viewerUserId) {
    return true;
  }

  const visibility = decision.visibility ?? "private";
  if (visibility === "public") {
    return true;
  }

  if (visibility === "shared_to_target" && decision.targetUserId === viewerUserId) {
    return true;
  }

  return false;
}

export const decide = mutation({
  args: {
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    score: v.optional(v.number()),
    stance: v.optional(
      v.union(v.literal("yes"), v.literal("no"), v.literal("hold"))
    ),
    reasonBody: v.string(),
    visibility: v.optional(
      v.union(
        v.literal("private"),
        v.literal("shared_to_target"),
        v.literal("public")
      )
    ),
    targetUserId: v.optional(v.id("users")),
    publishConsentByEvaluator: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await requireWritePermission(ctx, args.roomId, user._id);
    requireReason(args.reasonBody, "Decision");

    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.roomId !== args.roomId) {
      throw new Error("Thread not found or does not belong to this room");
    }

    const score = clampDecisionScore(
      args.score ??
        (args.stance ? mapStanceToScore(args.stance) : mapStanceToScore("hold"))
    );
    const stance = args.stance ?? mapScoreToStance(score);

    const targetUserId = args.targetUserId ?? thread.createdBy;
    const requestedVisibility = args.visibility ?? "private";
    const publishConsentByEvaluator = args.publishConsentByEvaluator ?? false;

    const existingDecision = await ctx.db
      .query("decisions")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("createdBy"), user._id))
      .first();

    if (existingDecision) {
      const reasonMessage = await ctx.db.get(existingDecision.reasonMessageId);
      if (reasonMessage) {
        await ctx.db.patch(reasonMessage._id, {
          body: args.reasonBody.trim(),
        });
      }

      const publishConsentByTarget = existingDecision.publishConsentByTarget ?? false;
      const resolvedVisibility = resolveVisibility(
        requestedVisibility,
        publishConsentByEvaluator,
        publishConsentByTarget
      );

      await ctx.db.patch(existingDecision._id, {
        score,
        stance,
        visibility: resolvedVisibility,
        targetUserId,
        publishConsentByEvaluator,
        publishConsentByTarget,
      });

      return existingDecision._id;
    }

    const reasonMessageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      threadId: args.threadId,
      kind: "reason",
      body: args.reasonBody.trim(),
      createdBy: user._id,
      createdAt: Date.now(),
    });

    const publishConsentByTarget = false;
    const resolvedVisibility = resolveVisibility(
      requestedVisibility,
      publishConsentByEvaluator,
      publishConsentByTarget
    );

    const decisionId = await ctx.db.insert("decisions", {
      roomId: args.roomId,
      threadId: args.threadId,
      score,
      stance,
      visibility: resolvedVisibility,
      targetUserId,
      publishConsentByEvaluator,
      publishConsentByTarget,
      reasonMessageId,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return decisionId;
  },
});

export const setDecisionVisibility = mutation({
  args: {
    decisionId: v.id("decisions"),
    visibility: v.union(
      v.literal("private"),
      v.literal("shared_to_target"),
      v.literal("public")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Decision not found");
    }
    if (decision.createdBy !== user._id) {
      throw new Error("Only evaluator can change visibility");
    }

    const targetConsent = decision.publishConsentByTarget ?? false;
    const evaluatorConsent = decision.publishConsentByEvaluator ?? false;
    if (args.visibility === "public" && !(targetConsent && evaluatorConsent)) {
      throw new Error("Both evaluator and target consent are required to make decision public");
    }

    await ctx.db.patch(args.decisionId, {
      visibility: args.visibility,
    });

    return args.decisionId;
  },
});

export const setEvaluatorPublishConsent = mutation({
  args: {
    decisionId: v.id("decisions"),
    consent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Decision not found");
    }
    if (decision.createdBy !== user._id) {
      throw new Error("Only evaluator can update evaluator consent");
    }

    const visibility = resolveVisibility(
      decision.visibility ?? "private",
      args.consent,
      decision.publishConsentByTarget ?? false
    );

    await ctx.db.patch(args.decisionId, {
      publishConsentByEvaluator: args.consent,
      visibility,
    });

    return args.decisionId;
  },
});

export const setTargetPublishConsent = mutation({
  args: {
    decisionId: v.id("decisions"),
    consent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Decision not found");
    }
    if (decision.targetUserId !== user._id) {
      throw new Error("Only target user can update target consent");
    }

    const visibility = resolveVisibility(
      decision.visibility ?? "private",
      decision.publishConsentByEvaluator ?? false,
      args.consent
    );

    await ctx.db.patch(args.decisionId, {
      publishConsentByTarget: args.consent,
      visibility,
    });

    return args.decisionId;
  },
});

export const listDecisions = query({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      return [];
    }

    await requireRoomMember(ctx, thread.roomId, user._id);

    const decisions = await ctx.db
      .query("decisions")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    const visibleDecisions = decisions.filter((decision) =>
      canViewDecision(user._id, {
        createdBy: decision.createdBy,
        targetUserId: decision.targetUserId,
        visibility: decision.visibility,
      })
    );

    return await Promise.all(
      visibleDecisions.map(async (decision) => {
        const reasonMessage = await ctx.db.get(decision.reasonMessageId);
        const evaluator = await ctx.db.get(decision.createdBy);
        const targetUser = decision.targetUserId
          ? await ctx.db.get(decision.targetUserId)
          : null;

        return {
          ...decision,
          score: decision.score ?? mapStanceToScore(decision.stance ?? "hold"),
          stance: decision.stance ?? mapScoreToStance(decision.score ?? 5),
          visibility: decision.visibility ?? "private",
          reason: reasonMessage?.body ?? "",
          evaluatorName: evaluator?.name ?? "Unknown",
          targetUserName: targetUser?.name ?? null,
          canCurrentUserSetEvaluatorConsent: decision.createdBy === user._id,
          canCurrentUserSetTargetConsent: decision.targetUserId === user._id,
        };
      })
    );
  },
});

export const migrateDecisionScores = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    void user;

    const dryRun = args.dryRun ?? true;
    const decisions = await ctx.db.query("decisions").collect();
    let updated = 0;

    for (const decision of decisions) {
      const patch: Record<string, unknown> = {};
      if (decision.score === undefined) {
        patch.score = mapStanceToScore(decision.stance ?? "hold");
      }
      if (decision.visibility === undefined) {
        patch.visibility = "private";
      }
      if (decision.publishConsentByEvaluator === undefined) {
        patch.publishConsentByEvaluator = false;
      }
      if (decision.publishConsentByTarget === undefined) {
        patch.publishConsentByTarget = false;
      }
      if (decision.targetUserId === undefined) {
        const thread = await ctx.db.get(decision.threadId);
        patch.targetUserId = thread?.createdBy;
      }

      if (Object.keys(patch).length > 0) {
        updated += 1;
        if (!dryRun) {
          await ctx.db.patch(decision._id, patch);
        }
      }
    }

    return {
      total: decisions.length,
      updated,
      dryRun,
    };
  },
});
