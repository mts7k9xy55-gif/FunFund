/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _guards from "../_guards.js";
import type * as commitments from "../commitments.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as payouts from "../payouts.js";
import type * as profiles from "../profiles.js";
import type * as rooms from "../rooms.js";
import type * as stripe from "../stripe.js";
import type * as stripeEvents from "../stripeEvents.js";
import type * as threads from "../threads.js";
import type * as uploads from "../uploads.js";
import type * as users from "../users.js";
import type * as v2Public from "../v2Public.js";
import type * as v2Room from "../v2Room.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _guards: typeof _guards;
  commitments: typeof commitments;
  http: typeof http;
  messages: typeof messages;
  payouts: typeof payouts;
  profiles: typeof profiles;
  rooms: typeof rooms;
  stripe: typeof stripe;
  stripeEvents: typeof stripeEvents;
  threads: typeof threads;
  uploads: typeof uploads;
  users: typeof users;
  v2Public: typeof v2Public;
  v2Room: typeof v2Room;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
