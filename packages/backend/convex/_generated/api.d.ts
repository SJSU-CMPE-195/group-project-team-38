/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as authz from "../authz.js";
import type * as healthCheck from "../healthCheck.js";
import type * as http from "../http.js";
import type * as medications from "../medications.js";
import type * as patients from "../patients.js";
import type * as privateData from "../privateData.js";
import type * as scanLogExplanationGeneration from "../scanLogExplanationGeneration.js";
import type * as scanLogExplanations from "../scanLogExplanations.js";
import type * as scanLogs from "../scanLogs.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as verification from "../verification.js";
import type * as wristbands from "../wristbands.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  auth: typeof auth;
  authz: typeof authz;
  healthCheck: typeof healthCheck;
  http: typeof http;
  medications: typeof medications;
  patients: typeof patients;
  privateData: typeof privateData;
  scanLogExplanationGeneration: typeof scanLogExplanationGeneration;
  scanLogExplanations: typeof scanLogExplanations;
  scanLogs: typeof scanLogs;
  seed: typeof seed;
  users: typeof users;
  verification: typeof verification;
  wristbands: typeof wristbands;
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

export declare const components: {
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
};
