function getConvexHttpBase(): string {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  const normalized = convexUrl.replace(/\/+$/, "");
  if (normalized.endsWith("/api")) {
    return normalized;
  }
  if (normalized.endsWith(".cloud") || normalized.endsWith(".site")) {
    return `${normalized}/api`;
  }
  try {
    const url = new URL(normalized);
    if (!url.pathname || url.pathname === "/") {
      url.pathname = "/api";
    } else if (!url.pathname.endsWith("/api")) {
      url.pathname = `${url.pathname.replace(/\/+$/, "")}/api`;
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return `${normalized}/api`;
  }
}

export async function postConvexPayout<T extends Record<string, unknown>>(
  path:
    | "/payouts/registerAccount"
    | "/payouts/request"
    | "/payouts/settle"
    | "/payouts/reportTransfer",
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
