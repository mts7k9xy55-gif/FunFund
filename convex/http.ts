// convex/http.ts
// HTTP Actionのルーティング

import { httpRouter } from "convex/server";
import { updateRoomStatusHttp, setRoomStripeInfoHttp, registerStripeEventHttp } from "./stripe";

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

export default http;
