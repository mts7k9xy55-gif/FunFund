import { NextRequest } from "next/server";
import { processStripeWebhook } from "@v2/server/billing/webhookService";
import { isV2BillingEnabled } from "@/lib/featureFlags";

export async function POST(req: NextRequest) {
  if (!isV2BillingEnabled()) {
    return new Response("v2 billing is disabled", { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  const result = await processStripeWebhook({
    signature,
    rawBody,
  });

  return new Response(result.body, { status: result.status });
}
