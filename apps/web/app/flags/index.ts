/**
 * Feature flags – shared identify and standard flags
 * Server-side only. Use in Server Components and API routes.
 * Add authCheck to createIdentify when using the authentication package.
 */

import "server-only";
import {
  createIdentify,
  createIsDebugFlag,
  createIsLocalFlag,
  createIsStagingFlag,
  createIsProductionFlag,
  createIsAdminFlag,
  createIsAuthenticatedFlag,
  createIsVerboseLoggingFlag,
} from "feature-flags";

export const identify = createIdentify({
  envFlagPrefix: "FEATURE_",
});

export const isDebug = createIsDebugFlag(identify);
export const isLocal = createIsLocalFlag(identify);
export const isStaging = createIsStagingFlag(identify);
export const isProduction = createIsProductionFlag(identify);
export const isAdmin = createIsAdminFlag(identify);
export const isAuthenticated = createIsAuthenticatedFlag(identify);
export const isVerboseLogging = createIsVerboseLoggingFlag(identify);
