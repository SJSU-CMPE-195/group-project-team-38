/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _safetyEngine from "../_safetyEngine.js";
import type * as aiGateway from "../aiGateway.js";
import type * as auth from "../auth.js";
import type * as patients from "../patients.js";
import type * as scan from "../scan.js";
import type * as scanLogs from "../scanLogs.js";
import type * as seed from "../seed.js";
import type * as wristbands from "../wristbands.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  _safetyEngine: typeof _safetyEngine;
  aiGateway: typeof aiGateway;
  auth: typeof auth;
  patients: typeof patients;
  scan: typeof scan;
  scanLogs: typeof scanLogs;
  seed: typeof seed;
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

export declare const components: {};
