import Stripe from "stripe";

export interface RoomStripeInfoPayload {
  roomId: string;
  stripeCustomerId: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  stripeSubscriptionId: string;
  status: "active" | "past_due" | "canceled";
}

export interface RoomStatusPayload {
  roomId?: string;
  stripeCustomerId?: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  status: "active" | "past_due" | "canceled";
}

export interface StripeEventRegisterPayload {
  eventId: string;
  eventType: string;
}

function getConvexHttpBase(): string {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return convexUrl.replace(/\.cloud$/, ".cloud/api");
}

async function post(path: string, body: Record<string, unknown>): Promise<void> {
  const endpoint = `${getConvexHttpBase()}${path}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Convex HTTP action failed (${path}): ${response.status} ${text}`);
  }
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const endpoint = `${getConvexHttpBase()}${path}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Convex HTTP action failed (${path}): ${response.status} ${text}`);
  }

  return (await response.json()) as T;
}

export async function setRoomStripeInfo(payload: RoomStripeInfoPayload): Promise<void> {
  const body: Record<string, unknown> = {
    roomId: payload.roomId,
    stripeSubscriptionId: payload.stripeSubscriptionId,
  };
  if (typeof payload.stripeCustomerId === "string" && payload.stripeCustomerId.length > 0) {
    body.stripeCustomerId = payload.stripeCustomerId;
  }
  await post("/stripe/setRoomStripeInfo", body);
}

export async function updateRoomStatus(payload: RoomStatusPayload): Promise<void> {
  const body: Record<string, unknown> = { status: payload.status };
  if (payload.roomId) {
    body.roomId = payload.roomId;
  }
  if (typeof payload.stripeCustomerId === "string" && payload.stripeCustomerId.length > 0) {
    body.stripeCustomerId = payload.stripeCustomerId;
  }
  await post("/stripe/updateRoomStatus", body);
}

export async function registerStripeEvent(
  payload: StripeEventRegisterPayload
): Promise<{ duplicate: boolean }> {
  return await postJson<{ duplicate: boolean }>("/stripe/registerEvent", {
    eventId: payload.eventId,
    eventType: payload.eventType,
  });
}
