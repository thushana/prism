/**
 * FeatureFlags – Prism feature-flag layer (wrapper around Flags SDK)
 *
 * Server-side only. Use createIdentify, createFlag, getMiddleware, and standard flags.
 */

export type {
  FeatureFlagContext,
  CreateIdentifyOptions,
  CreateFlagConfig,
  MiddlewareConfig,
} from "./types";
export { createIdentify } from "./identify";
export { createFlag } from "./flag";
export { getMiddleware } from "./middleware";
export { parseFlagOption, parseUrlOverrides, getEnvFlags } from "./helpers";
export {
  createFlagsDiscoveryEndpoint,
  getProviderData,
} from "./discovery";
export {
  createIsDebugFlag,
  createIsLocalFlag,
  createIsStagingFlag,
  createIsProductionFlag,
  createIsAdminFlag,
  createIsAuthenticatedFlag,
  createIsVerboseLoggingFlag,
} from "./standard";
