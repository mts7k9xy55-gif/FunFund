import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles
  profiles: defineTable({
    userId: v.string(), // Clerk or other auth provider user ID
    username: v.optional(v.string()),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    bio: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"]),

  // Funding proposals
  proposals: defineTable({
    authorId: v.id("profiles"),
    title: v.string(),
    description: v.string(),
    goalAmount: v.number(),
    currentAmount: v.number(),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_authorId", ["authorId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"]),

  // Evaluations for proposals (ratings/reviews)
  evaluations: defineTable({
    proposalId: v.id("proposals"),
    evaluatorId: v.id("profiles"),
    // Individual scores (1-5 scale)
    innovationScore: v.number(), // 革新性
    feasibilityScore: v.number(), // 実現可能性
    impactScore: v.number(), // 社会的インパクト
    teamScore: v.number(), // チーム力
    presentationScore: v.number(), // プレゼンテーション
    // Weights for each criterion (should sum to 1.0)
    innovationWeight: v.number(),
    feasibilityWeight: v.number(),
    impactWeight: v.number(),
    teamWeight: v.number(),
    presentationWeight: v.number(),
    // Calculated weighted average score
    weightedScore: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_proposalId", ["proposalId"])
    .index("by_evaluatorId", ["evaluatorId"])
    .index("by_proposalId_evaluatorId", ["proposalId", "evaluatorId"]),
});
