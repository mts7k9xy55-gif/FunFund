// convex/stripe.ts
// Stripe Webhook用のactions（外部APIから呼び出し可能）

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Webhook用action: Room statusを更新
 * Next.js API routeから呼び出される
 */
export const updateRoomStatus = action({
  args: {
    roomId: v.id("rooms"),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled")
    ),
  },
  handler: async (ctx, args) => {
    // internal mutationを呼び出す
    await ctx.runMutation(internal.rooms.updateRoomStatusFromWebhook, {
      roomId: args.roomId,
      status: args.status,
    });
  },
});

/**
 * Webhook用action: RoomにStripe情報を保存
 */
export const setRoomStripeInfoAction = action({
  args: {
    roomId: v.id("rooms"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.rooms.setRoomStripeInfo, {
      roomId: args.roomId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
    });
  },
});
