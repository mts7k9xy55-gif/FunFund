// convex/http.ts
// HTTP Actionのルーティング

import { httpRouter } from "convex/server";
import { updateRoomStatusHttp, setRoomStripeInfoHttp } from "./stripe";

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

export default http;
