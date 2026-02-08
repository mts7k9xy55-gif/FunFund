function getConvexHttpBase(): string {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return convexUrl.replace(/\.cloud$/, ".cloud/api");
}

export async function postConvexPayout<T extends Record<string, unknown>>(
  path: "/payouts/registerAccount" | "/payouts/request" | "/payouts/settle",
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${getConvexHttpBase()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : `Convex payout request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}
