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
import type * as connections from "../connections.js";
import type * as decisions from "../decisions.js";
import type * as distributions from "../distributions.js";
import type * as evaluations from "../evaluations.js";
import type * as executions from "../executions.js";
import type * as finalDecisions from "../finalDecisions.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as intents from "../intents.js";
import type * as invites from "../invites.js";
import type * as items from "../items.js";
import type * as layerInputs from "../layerInputs.js";
import type * as messages from "../messages.js";
import type * as payouts from "../payouts.js";
import type * as profiles from "../profiles.js";
import type * as publicPreviews from "../publicPreviews.js";
import type * as rooms from "../rooms.js";
import type * as stripe from "../stripe.js";
import type * as threads from "../threads.js";
import type * as users from "../users.js";
import type * as v2Migration from "../v2Migration.js";
import type * as v2Public from "../v2Public.js";
import type * as v2Room from "../v2Room.js";
import type * as weights from "../weights.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _guards: typeof _guards;
  connections: typeof connections;
  decisions: typeof decisions;
  distributions: typeof distributions;
  evaluations: typeof evaluations;
  executions: typeof executions;
  finalDecisions: typeof finalDecisions;
  groups: typeof groups;
  http: typeof http;
  intents: typeof intents;
  invites: typeof invites;
  items: typeof items;
  layerInputs: typeof layerInputs;
  messages: typeof messages;
  payouts: typeof payouts;
  profiles: typeof profiles;
  publicPreviews: typeof publicPreviews;
  rooms: typeof rooms;
  stripe: typeof stripe;
  threads: typeof threads;
  users: typeof users;
  v2Migration: typeof v2Migration;
  v2Public: typeof v2Public;
  v2Room: typeof v2Room;
  weights: typeof weights;
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
