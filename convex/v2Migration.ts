import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./_guards";

export const getBackfillState = query({
  args: {
    tableName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    return await ctx.db
      .query("migrationBackfillState")
      .withIndex("by_tableName", (q) => q.eq("tableName", args.tableName))
      .first();
  },
});

export const upsertBackfillState = mutation({
  args: {
    tableName: v.string(),
    lastCursor: v.optional(v.string()),
    processedCount: v.number(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const existing = await ctx.db
      .query("migrationBackfillState")
      .withIndex("by_tableName", (q) => q.eq("tableName", args.tableName))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastCursor: args.lastCursor,
        processedCount: args.processedCount,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("migrationBackfillState", {
      tableName: args.tableName,
      lastCursor: args.lastCursor,
      processedCount: args.processedCount,
      updatedAt: Date.now(),
    });
  },
});

export const recordDualWriteFailure = mutation({
  args: {
    domain: v.string(),
    operation: v.string(),
    payload: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    return await ctx.db.insert("dualWriteFailures", {
      domain: args.domain,
      operation: args.operation,
      payload: args.payload,
      error: args.error,
      retryCount: 0,
      lastTriedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const listDualWriteFailures = query({
  args: {
    domain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const rows = args.domain
      ? await ctx.db
          .query("dualWriteFailures")
          .withIndex("by_domain", (q) => q.eq("domain", args.domain!))
          .collect()
      : await ctx.db.query("dualWriteFailures").collect();

    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const markDualWriteRetried = mutation({
  args: {
    failureId: v.id("dualWriteFailures"),
    resolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const failure = await ctx.db.get(args.failureId);
    if (!failure) {
      throw new Error("Dual write failure not found");
    }

    if (args.resolved) {
      await ctx.db.delete(args.failureId);
      return { resolved: true };
    }

    await ctx.db.patch(args.failureId, {
      retryCount: failure.retryCount + 1,
      lastTriedAt: Date.now(),
    });

    return { resolved: false };
  },
});

export const registerStripeWebhookEvent = mutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeWebhookEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();

    if (existing) {
      return { duplicate: true };
    }

    await ctx.db.insert("stripeWebhookEvents", {
      eventId: args.eventId,
      eventType: args.eventType,
      processedAt: Date.now(),
    });

    return { duplicate: false };
  },
});

export const snapshotMigrationCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);

    const [users, rooms, threads, evaluations, publicProjects] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("rooms").collect(),
      ctx.db.query("threads").collect(),
      ctx.db.query("evaluations").collect(),
      ctx.db.query("publicProjectsV2").collect(),
    ]);

    return {
      users: users.length,
      rooms: rooms.length,
      threads: threads.length,
      evaluations: evaluations.length,
      publicProjectsV2: publicProjects.length,
      capturedAt: Date.now(),
    };
  },
});
