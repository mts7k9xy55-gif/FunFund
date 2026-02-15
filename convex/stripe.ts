// convex/stripe.ts
// Stripe Webhook用のHTTP Actions（Next.js API routeからfetchで呼び出される）

import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * HTTP Action: Room statusを更新
 * POST /stripe/updateRoomStatus
 */
export const updateRoomStatusHttp = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.json();
  const { roomId, stripeCustomerId, status } = body as {
    roomId?: string;
    stripeCustomerId?: string;
    status?: "active" | "past_due" | "canceled";
  };

  if (!status) {
    return new Response("Missing status", { status: 400 });
  }

  if (roomId) {
    await ctx.runMutation(internal.rooms.updateRoomStatusFromWebhook, {
      roomId: roomId as Id<"rooms">,
      status,
    });
  } else if (stripeCustomerId) {
    await ctx.runMutation(internal.rooms.updateRoomStatusByStripeCustomer, {
      stripeCustomerId,
      status,
    });
  } else {
    return new Response("Missing roomId or stripeCustomerId", { status: 400 });
  }

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
  const { roomId, stripeCustomerId, stripeSubscriptionId } = body as {
    roomId?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };

  if (!roomId || !stripeSubscriptionId) {
    return new Response("Missing roomId or stripeSubscriptionId", { status: 400 });
  }

  if (stripeCustomerId) {
    await ctx.runMutation(internal.rooms.setRoomStripeInfo, {
      roomId: roomId as Id<"rooms">,
      stripeCustomerId,
      stripeSubscriptionId,
    });
  } else {
    await ctx.runMutation(internal.rooms.updateRoomStatusFromWebhook, {
      roomId: roomId as Id<"rooms">,
      status: "active",
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * HTTP Action: Stripe webhook eventの重複登録を防止
 * POST /stripe/registerEvent
 */
export const registerStripeEventHttp = httpAction(async (ctx, request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.json();
  const { eventId, eventType } = body as {
    eventId?: string;
    eventType?: string;
  };

  if (!eventId || !eventType) {
    return new Response("Missing eventId or eventType", { status: 400 });
  }

  const result = await ctx.runMutation(api.stripeEvents.registerWebhookEvent, {
    eventId,
    eventType,
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
