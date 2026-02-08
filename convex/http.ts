// convex/http.ts
// HTTP Actionのルーティング

import { httpRouter } from "convex/server";
import { updateRoomStatusHttp, setRoomStripeInfoHttp, registerStripeEventHttp } from "./stripe";
import {
  createPayoutRequestHttp,
  registerPayoutAccountHttp,
  settlePayoutLedgerHttp,
} from "./payouts";

const http = httpRouter();

// Stripe Webhook用のHTTP Actions
http.route({
  path: "/stripe/updateRoomStatus",
  method: "POST",
  handler: updateRoomStatusHttp,
});

http.route({
  path: "/stripe/setRoomStripeInfo",
  method: "POST",
  handler: setRoomStripeInfoHttp,
});

http.route({
  path: "/stripe/registerEvent",
  method: "POST",
  handler: registerStripeEventHttp,
});

http.route({
  path: "/payouts/registerAccount",
  method: "POST",
  handler: registerPayoutAccountHttp,
});

http.route({
  path: "/payouts/request",
  method: "POST",
  handler: createPayoutRequestHttp,
});

http.route({
  path: "/payouts/settle",
  method: "POST",
  handler: settlePayoutLedgerHttp,
});

export default http;
