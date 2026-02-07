import Stripe from "stripe";

export interface RoomStripeInfoPayload {
  roomId: string;
  stripeCustomerId: string | Stripe.Customer | Stripe.DeletedCustomer | null;
  stripeSubscriptionId: string;
  status: "active" | "past_due" | "canceled";
}

export interface RoomStatusPayload {
  stripeSubscriptionId: string;
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
  await post("/stripe/setRoomStripeInfo", {
    roomId: payload.roomId,
    stripeCustomerId: typeof payload.stripeCustomerId === "string" ? payload.stripeCustomerId : null,
    stripeSubscriptionId: payload.stripeSubscriptionId,
    status: payload.status,
  });
}

export async function updateRoomStatus(payload: RoomStatusPayload): Promise<void> {
  await post("/stripe/updateRoomStatus", {
    stripeSubscriptionId: payload.stripeSubscriptionId,
    status: payload.status,
  });
}

export async function registerStripeEvent(
  payload: StripeEventRegisterPayload
): Promise<{ duplicate: boolean }> {
  return await postJson<{ duplicate: boolean }>("/stripe/registerEvent", {
    eventId: payload.eventId,
    eventType: payload.eventType,
  });
}
