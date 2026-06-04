/**
 * Feature flags – shared identify and standard flags
 * Server-side only. Use in Server Components and API routes.
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
import { checkSession } from "@/lib/auth-gates";
import { isAdminUser } from "authentication/better-auth/session";

export const identify = createIdentify({
  envFlagPrefix: "FEATURE_",
  authCheck: async () => {
    const result = await checkSession();
    if (!result?.session) {
      return { authenticated: false };
    }
    return {
      authenticated: true,
      type: isAdminUser(result.user) ? "admin" : "viewer",
    };
  },
});

export const isDebug = createIsDebugFlag(identify);
export const isLocal = createIsLocalFlag(identify);
export const isStaging = createIsStagingFlag(identify);
export const isProduction = createIsProductionFlag(identify);
export const isAdmin = createIsAdminFlag(identify);
export const isAuthenticated = createIsAuthenticatedFlag(identify);
export const isVerboseLogging = createIsVerboseLoggingFlag(identify);
