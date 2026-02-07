import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireReason, requireUser, requireWritePermission } from "./_guards";

export const getRoomWorkspace = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return null;
    }

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

    const evaluations = await Promise.all(
      threads.map(async (thread) => {
        const rows = await ctx.db
          .query("evaluations")
          .withIndex("by_threadId", (q) => q.eq("threadId", thread._id))
          .collect();

        const averageScore = rows.length
          ? rows.reduce((sum, row) => sum + row.weightedScore, 0) / rows.length
          : 0;

        return {
          threadId: thread._id,
          count: rows.length,
          averageScore: Math.round(averageScore * 100) / 100,
        };
      })
    );

    return {
      room: {
        ...room,
        myRole: membership.role,
      },
      metrics: {
        memberCount: memberships.length,
        threadCount: threads.length,
        evaluationCount: evaluations.reduce((sum, item) => sum + item.count, 0),
      },
      threads,
      evaluations,
    };
  },
});

export const createThreadV2 = mutation({
  args: {
    roomId: v.id("rooms"),
    type: v.union(v.literal("comment"), v.literal("proposal"), v.literal("project")),
    title: v.string(),
    initialBody: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    await requireWritePermission(ctx, args.roomId, user._id);

    if (args.type === "proposal" || args.type === "project") {
      requireReason(args.reason, `${args.type} creation`);
    }

    const now = Date.now();
    const threadId = await ctx.db.insert("threads", {
      roomId: args.roomId,
      type: args.type,
      title: args.title,
      createdBy: user._id,
      createdAt: now,
    });

    await ctx.db.insert("messages", {
      roomId: args.roomId,
      threadId,
      kind: "comment",
      body: args.initialBody,
      createdBy: user._id,
      createdAt: now,
    });

    if (args.reason) {
      await ctx.db.insert("messages", {
        roomId: args.roomId,
        threadId,
        kind: "reason",
        body: args.reason,
        createdBy: user._id,
        createdAt: now,
      });
    }

    return threadId;
  },
});
