import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("human"), v.literal("ai")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerkUserId", ["clerkUserId"]),

  rooms: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("past_due"), v.literal("canceled")),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    inviteCode: v.optional(v.string()),
    evaluationMode: v.union(v.literal("open"), v.literal("closed")),
    virtualFundBalance: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"]),

  roomMembers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member"), v.literal("viewer")),
    joinedAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_userId", ["userId"])
    .index("by_roomId_userId", ["roomId", "userId"]),

  threads: defineTable({
    roomId: v.id("rooms"),
    type: v.union(v.literal("comment"), v.literal("proposal"), v.literal("project")),
    title: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_createdBy", ["createdBy"]),

  threadMessages: defineTable({
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    kind: v.union(v.literal("comment"), v.literal("reason"), v.literal("execution")),
    body: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_threadId", ["threadId"])
    .index("by_roomId", ["roomId"]),

  evaluations: defineTable({
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    evaluatorId: v.id("users"),
    mode: v.union(v.literal("open"), v.literal("closed")),
    score1: v.number(),
    score2: v.number(),
    score3: v.number(),
    score4: v.number(),
    score5: v.number(),
    weight1: v.number(),
    weight2: v.number(),
    weight3: v.number(),
    weight4: v.number(),
    weight5: v.number(),
    weightedScore: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_threadId", ["threadId"])
    .index("by_roomId", ["roomId"])
    .index("by_threadId_evaluatorId", ["threadId", "evaluatorId"]),

  distributionProposals: defineTable({
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    proposedBy: v.id("users"),
    contributions: v.array(
      v.object({
        userId: v.id("users"),
        percentage: v.number(),
      })
    ),
    totalAmount: v.number(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_threadId", ["threadId"]),

  publicProjects: defineTable({
    sourceItemId: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    thumbnailUrl: v.optional(v.string()),
    decisions: v.array(v.string()),
    suitableFor: v.optional(v.string()),
    notSuitableFor: v.optional(v.string()),
    visibility: v.union(v.literal("public"), v.literal("private")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_visibility", ["visibility"])
    .index("by_createdAt", ["createdAt"]),

  // Legacy compatibility domain (Phase1 required)
  groups: defineTable({
    name: v.string(),
    type: v.union(v.literal("dm"), v.literal("project"), v.literal("public")),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_type", ["type"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_userId", ["userId"]),

  connections: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("blocked")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_fromUserId", ["fromUserId"])
    .index("by_toUserId", ["toUserId"])
    .index("by_status", ["status"]),

  legacyItems: defineTable({
    parentId: v.optional(v.id("legacyItems")),
    rootId: v.optional(v.id("legacyItems")),
    type: v.string(),
    content: v.optional(v.string()),
    authorId: v.optional(v.id("users")),
    score: v.optional(v.number()),
    reason: v.optional(v.string()),
    groupId: v.optional(v.id("groups")),
    visibility: v.optional(v.union(v.literal("public"), v.literal("group"), v.literal("dm"))),
    createdAt: v.number(),
  })
    .index("by_parentId", ["parentId"])
    .index("by_groupId", ["groupId"])
    .index("by_visibility", ["visibility"]),

  stripeEvents: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    processedAt: v.number(),
  }).index("by_eventId", ["eventId"]),

  migrationBackfillState: defineTable({
    tableName: v.string(),
    lastCursor: v.optional(v.string()),
    processedCount: v.number(),
    updatedAt: v.number(),
  }).index("by_tableName", ["tableName"]),
});
