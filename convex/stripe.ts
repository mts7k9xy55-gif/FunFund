// convex/stripe.ts
// Stripe Webhook用のHTTP Actions（Next.js API routeからfetchで呼び出される）

import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * HTTP Action: Room statusを更新
 * POST /stripe/updateRoomStatus
 */
export const updateRoomStatusHttp = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.json();
  const { roomId, status } = body;

  if (!roomId || !status) {
    return new Response("Missing roomId or status", { status: 400 });
  }

  // internal mutationを呼び出す
  await ctx.runMutation(internal.rooms.updateRoomStatusFromWebhook, {
    roomId: roomId as Id<"rooms">,
    status: status as "active" | "past_due" | "canceled",
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * HTTP Action: RoomにStripe情報を保存
 * POST /stripe/setRoomStripeInfo
 */
export const setRoomStripeInfoHttp = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.json();
  const { roomId, stripeCustomerId, stripeSubscriptionId } = body;

  if (!roomId || !stripeCustomerId || !stripeSubscriptionId) {
    return new Response("Missing required fields", { status: 400 });
  }

  await ctx.runMutation(internal.rooms.setRoomStripeInfo, {
    roomId: roomId as Id<"rooms">,
    stripeCustomerId,
    stripeSubscriptionId,
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
