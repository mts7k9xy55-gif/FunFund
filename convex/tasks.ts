import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    proposalId: v.id("proposals"),
    creatorId: v.id("profiles"),
    title: v.string(),
    description: v.string(),
    budget: v.number(),
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "active") {
      throw new Error("Proposal is not active");
    }

    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      proposalId: args.proposalId,
      creatorId: args.creatorId,
      title: args.title,
      description: args.description,
      budget: args.budget,
      status: "open",
      deadline: args.deadline,
      createdAt: now,
      updatedAt: now,
    });

    return taskId;
  },
});

export const getByProposal = query({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_proposalId", (q) => q.eq("proposalId", args.proposalId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getOpenTasks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
  },
});

export const getByAssignee = query({
  args: { assigneeId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_assigneeId", (q) => q.eq("assigneeId", args.assigneeId))
      .collect();
  },
});

export const assignTask = mutation({
  args: {
    taskId: v.id("tasks"),
    assigneeId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.status !== "open") {
      throw new Error("Task is not open for assignment");
    }

    const assignee = await ctx.db.get(args.assigneeId);
    if (!assignee) {
      throw new Error("Assignee profile not found");
    }

    await ctx.db.patch(args.taskId, {
      assigneeId: args.assigneeId,
      status: "assigned",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const startTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.status !== "assigned") {
      throw new Error("Task must be assigned before starting");
    }

    await ctx.db.patch(args.taskId, {
      status: "in_progress",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const submitCompletion = mutation({
  args: {
    taskId: v.id("tasks"),
    executorId: v.id("profiles"),
    description: v.string(),
    proofUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.status !== "in_progress") {
      throw new Error("Task must be in progress to submit completion");
    }

    if (task.assigneeId !== args.executorId) {
      throw new Error("Only the assigned executor can submit completion");
    }

    const now = Date.now();

    const submissionId = await ctx.db.insert("task_submissions", {
      taskId: args.taskId,
      executorId: args.executorId,
      description: args.description,
      proofUrl: args.proofUrl,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.taskId, {
      status: "submitted",
      updatedAt: now,
    });

    return submissionId;
  },
});

export const getSubmissionsByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("task_submissions")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

export const getSubmissionById = query({
  args: { id: v.id("task_submissions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const approveSubmission = mutation({
  args: {
    submissionId: v.id("task_submissions"),
    approverId: v.id("profiles"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new Error("Submission is not pending approval");
    }

    const task = await ctx.db.get(submission.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const proposal = await ctx.db.get(task.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    const executor = await ctx.db.get(submission.executorId);
    if (!executor) {
      throw new Error("Executor profile not found");
    }

    const now = Date.now();

    await ctx.db.insert("task_approvals", {
      submissionId: args.submissionId,
      approverId: args.approverId,
      approved: true,
      rating: args.rating,
      comment: args.comment,
      createdAt: now,
    });

    await ctx.db.patch(args.submissionId, {
      status: "approved",
      updatedAt: now,
    });

    await ctx.db.patch(task._id, {
      status: "approved",
      updatedAt: now,
    });

    const executorBalanceBefore = executor.balance;
    const executorBalanceAfter = executorBalanceBefore + task.budget;

    await ctx.db.patch(executor._id, {
      balance: executorBalanceAfter,
      credibilityScore: executor.credibilityScore + args.rating,
      completedTasksCount: executor.completedTasksCount + 1,
      totalEarnings: executor.totalEarnings + task.budget,
      updatedAt: now,
    });

    await ctx.db.insert("transactions", {
      profileId: executor._id,
      proposalId: task.proposalId,
      taskId: task._id,
      type: "task_reward",
      amount: task.budget,
      balanceBefore: executorBalanceBefore,
      balanceAfter: executorBalanceAfter,
      description: `Task reward: ${task.title}`,
      createdAt: now,
    });

    await ctx.db.insert("execution_records", {
      executorId: executor._id,
      taskId: task._id,
      submissionId: args.submissionId,
      rating: args.rating,
      rewardAmount: task.budget,
      completedAt: now,
    });

    return {
      success: true,
      newBalance: executorBalanceAfter,
      newCredibilityScore: executor.credibilityScore + args.rating,
    };
  },
});

export const rejectSubmission = mutation({
  args: {
    submissionId: v.id("task_submissions"),
    approverId: v.id("profiles"),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status !== "pending") {
      throw new Error("Submission is not pending approval");
    }

    const task = await ctx.db.get(submission.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const now = Date.now();

    await ctx.db.insert("task_approvals", {
      submissionId: args.submissionId,
      approverId: args.approverId,
      approved: false,
      comment: args.comment,
      createdAt: now,
    });

    await ctx.db.patch(args.submissionId, {
      status: "rejected",
      updatedAt: now,
    });

    await ctx.db.patch(task._id, {
      status: "in_progress",
      updatedAt: now,
    });

    return { success: true };
  },
});

export const getApprovalsBySubmission = query({
  args: { submissionId: v.id("task_submissions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("task_approvals")
      .withIndex("by_submissionId", (q) => q.eq("submissionId", args.submissionId))
      .collect();
  },
});

export const getExecutionRecordsByExecutor = query({
  args: { executorId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("execution_records")
      .withIndex("by_executorId", (q) => q.eq("executorId", args.executorId))
      .collect();
  },
});

export const getCredibilityScore = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const records = await ctx.db
      .query("execution_records")
      .withIndex("by_executorId", (q) => q.eq("executorId", args.profileId))
      .collect();

    if (records.length === 0) {
      return {
        credibilityScore: profile.credibilityScore,
        completedTasksCount: profile.completedTasksCount,
        totalEarnings: profile.totalEarnings,
        averageRating: 0,
      };
    }

    const totalRating = records.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / records.length;

    return {
      credibilityScore: profile.credibilityScore,
      completedTasksCount: profile.completedTasksCount,
      totalEarnings: profile.totalEarnings,
      averageRating,
    };
  },
});

export const cancelTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.status === "approved" || task.status === "cancelled") {
      throw new Error("Cannot cancel a completed or already cancelled task");
    }

    await ctx.db.patch(args.taskId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
