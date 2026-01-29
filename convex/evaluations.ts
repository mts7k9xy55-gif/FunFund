import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper function to calculate weighted average score
function calculateWeightedScore(
  innovationScore: number,
  feasibilityScore: number,
  impactScore: number,
  teamScore: number,
  presentationScore: number,
  innovationWeight: number,
  feasibilityWeight: number,
  impactWeight: number,
  teamWeight: number,
  presentationWeight: number
): number {
  const weightedScore =
    innovationScore * innovationWeight +
    feasibilityScore * feasibilityWeight +
    impactScore * impactWeight +
    teamScore * teamWeight +
    presentationScore * presentationWeight;
  
  // Round to 2 decimal places
  return Math.round(weightedScore * 100) / 100;
}

// Create a new evaluation
export const create = mutation({
  args: {
    proposalId: v.id("proposals"),
    evaluatorId: v.id("profiles"),
    innovationScore: v.number(),
    feasibilityScore: v.number(),
    impactScore: v.number(),
    teamScore: v.number(),
    presentationScore: v.number(),
    innovationWeight: v.number(),
    feasibilityWeight: v.number(),
    impactWeight: v.number(),
    teamWeight: v.number(),
    presentationWeight: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate scores are between 1 and 5
    const scores = [
      args.innovationScore,
      args.feasibilityScore,
      args.impactScore,
      args.teamScore,
      args.presentationScore,
    ];
    for (const score of scores) {
      if (score < 1 || score > 5) {
        throw new Error("Scores must be between 1 and 5");
      }
    }

    // Validate weights sum to 1.0 (with small tolerance for floating point)
    const totalWeight =
      args.innovationWeight +
      args.feasibilityWeight +
      args.impactWeight +
      args.teamWeight +
      args.presentationWeight;
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new Error("Weights must sum to 1.0");
    }

    // Check if evaluation already exists for this proposal by this evaluator
    const existing = await ctx.db
      .query("evaluations")
      .withIndex("by_proposalId_evaluatorId", (q) =>
        q.eq("proposalId", args.proposalId).eq("evaluatorId", args.evaluatorId)
      )
      .first();
    if (existing) {
      throw new Error("You have already evaluated this proposal");
    }

    const weightedScore = calculateWeightedScore(
      args.innovationScore,
      args.feasibilityScore,
      args.impactScore,
      args.teamScore,
      args.presentationScore,
      args.innovationWeight,
      args.feasibilityWeight,
      args.impactWeight,
      args.teamWeight,
      args.presentationWeight
    );

    const now = Date.now();
    const evaluationId = await ctx.db.insert("evaluations", {
      ...args,
      weightedScore,
      createdAt: now,
      updatedAt: now,
    });

    return evaluationId;
  },
});

// Get evaluation by ID
export const getById = query({
  args: { id: v.id("evaluations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all evaluations for a proposal
export const listByProposal = query({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evaluations")
      .withIndex("by_proposalId", (q) => q.eq("proposalId", args.proposalId))
      .collect();
  },
});

// Get all evaluations by an evaluator
export const listByEvaluator = query({
  args: { evaluatorId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evaluations")
      .withIndex("by_evaluatorId", (q) => q.eq("evaluatorId", args.evaluatorId))
      .collect();
  },
});

// Calculate average weighted score for a proposal
export const getProposalAverageScore = query({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    const evaluations = await ctx.db
      .query("evaluations")
      .withIndex("by_proposalId", (q) => q.eq("proposalId", args.proposalId))
      .collect();

    if (evaluations.length === 0) {
      return {
        averageScore: null,
        evaluationCount: 0,
        breakdown: null,
      };
    }

    // Calculate average for each criterion
    const totals = evaluations.reduce(
      (acc, evaluation) => ({
        innovation: acc.innovation + evaluation.innovationScore,
        feasibility: acc.feasibility + evaluation.feasibilityScore,
        impact: acc.impact + evaluation.impactScore,
        team: acc.team + evaluation.teamScore,
        presentation: acc.presentation + evaluation.presentationScore,
        weighted: acc.weighted + evaluation.weightedScore,
      }),
      {
        innovation: 0,
        feasibility: 0,
        impact: 0,
        team: 0,
        presentation: 0,
        weighted: 0,
      }
    );

    const count = evaluations.length;
    const averageScore = Math.round((totals.weighted / count) * 100) / 100;

    return {
      averageScore,
      evaluationCount: count,
      breakdown: {
        innovation: Math.round((totals.innovation / count) * 100) / 100,
        feasibility: Math.round((totals.feasibility / count) * 100) / 100,
        impact: Math.round((totals.impact / count) * 100) / 100,
        team: Math.round((totals.team / count) * 100) / 100,
        presentation: Math.round((totals.presentation / count) * 100) / 100,
      },
    };
  },
});

// Get proposals ranked by average weighted score
export const getProposalsRankedByScore = query({
  args: {},
  handler: async (ctx) => {
    // Get all active proposals
    const proposals = await ctx.db
      .query("proposals")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Calculate average score for each proposal
    const proposalsWithScores = await Promise.all(
      proposals.map(async (proposal) => {
        const evaluations = await ctx.db
          .query("evaluations")
          .withIndex("by_proposalId", (q) => q.eq("proposalId", proposal._id))
          .collect();

        if (evaluations.length === 0) {
          return {
            ...proposal,
            averageScore: null,
            evaluationCount: 0,
          };
        }

        const totalWeightedScore = evaluations.reduce(
          (sum, e) => sum + e.weightedScore,
          0
        );
        const averageScore =
          Math.round((totalWeightedScore / evaluations.length) * 100) / 100;

        return {
          ...proposal,
          averageScore,
          evaluationCount: evaluations.length,
        };
      })
    );

    // Sort by average score (descending), proposals without scores at the end
    return proposalsWithScores.sort((a, b) => {
      if (a.averageScore === null && b.averageScore === null) return 0;
      if (a.averageScore === null) return 1;
      if (b.averageScore === null) return -1;
      return b.averageScore - a.averageScore;
    });
  },
});

// Update an evaluation
export const update = mutation({
  args: {
    id: v.id("evaluations"),
    innovationScore: v.optional(v.number()),
    feasibilityScore: v.optional(v.number()),
    impactScore: v.optional(v.number()),
    teamScore: v.optional(v.number()),
    presentationScore: v.optional(v.number()),
    innovationWeight: v.optional(v.number()),
    feasibilityWeight: v.optional(v.number()),
    impactWeight: v.optional(v.number()),
    teamWeight: v.optional(v.number()),
    presentationWeight: v.optional(v.number()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Evaluation not found");

    // Merge existing values with updates
    const newValues = {
      innovationScore: updates.innovationScore ?? existing.innovationScore,
      feasibilityScore: updates.feasibilityScore ?? existing.feasibilityScore,
      impactScore: updates.impactScore ?? existing.impactScore,
      teamScore: updates.teamScore ?? existing.teamScore,
      presentationScore: updates.presentationScore ?? existing.presentationScore,
      innovationWeight: updates.innovationWeight ?? existing.innovationWeight,
      feasibilityWeight: updates.feasibilityWeight ?? existing.feasibilityWeight,
      impactWeight: updates.impactWeight ?? existing.impactWeight,
      teamWeight: updates.teamWeight ?? existing.teamWeight,
      presentationWeight: updates.presentationWeight ?? existing.presentationWeight,
    };

    // Validate scores
    const scores = [
      newValues.innovationScore,
      newValues.feasibilityScore,
      newValues.impactScore,
      newValues.teamScore,
      newValues.presentationScore,
    ];
    for (const score of scores) {
      if (score < 1 || score > 5) {
        throw new Error("Scores must be between 1 and 5");
      }
    }

    // Validate weights
    const totalWeight =
      newValues.innovationWeight +
      newValues.feasibilityWeight +
      newValues.impactWeight +
      newValues.teamWeight +
      newValues.presentationWeight;
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new Error("Weights must sum to 1.0");
    }

    // Recalculate weighted score
    const weightedScore = calculateWeightedScore(
      newValues.innovationScore,
      newValues.feasibilityScore,
      newValues.impactScore,
      newValues.teamScore,
      newValues.presentationScore,
      newValues.innovationWeight,
      newValues.feasibilityWeight,
      newValues.impactWeight,
      newValues.teamWeight,
      newValues.presentationWeight
    );

    await ctx.db.patch(id, {
      ...updates,
      weightedScore,
      updatedAt: Date.now(),
    });
  },
});

// Delete an evaluation
export const remove = mutation({
  args: { id: v.id("evaluations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
