/**
 * FeatureFlags – Prism feature-flag layer (wrapper around Flags SDK)
 *
 * Server-side only. Use createIdentify, createFlag, getProxy, and standard flags.
 */

export type {
  FeatureFlagContext,
  CreateIdentifyOptions,
  CreateFlagConfig,
  ProxyConfig,
} from "./types";
export { createIdentify } from "./identify";
export { createFlag } from "./flag";
export { getProxy } from "./proxy";
export { parseFlagOption, parseUrlOverrides, getEnvFlags } from "./helpers";
export { createFlagsDiscoveryEndpoint, getProviderData } from "./discovery";
export {
  createIsDebugFlag,
  createIsLocalFlag,
  createIsStagingFlag,
  createIsProductionFlag,
  createIsAdminFlag,
  createIsAuthenticatedFlag,
  createIsVerboseLoggingFlag,
} from "./standard";
