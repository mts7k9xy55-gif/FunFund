import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const registerWebhookEvent = mutation({
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
      return { accepted: false, duplicate: true };
    }

    await ctx.db.insert("stripeWebhookEvents", {
      eventId: args.eventId,
      eventType: args.eventType,
      processedAt: Date.now(),
    });

    return { accepted: true, duplicate: false };
  },
});
