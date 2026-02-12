/**
 * Flags discovery endpoint for Vercel Flags Explorer
 * Requires FLAGS_SECRET in env. See prism/docs/FEATUREFLAGS-Prism.md
 */

import { createFlagsDiscoveryEndpoint, getProviderData } from "feature-flags";
import * as flags from "@/app/flags";

export const GET = createFlagsDiscoveryEndpoint(async () => {
  return getProviderData({
    isDebug: flags.isDebug,
    isLocal: flags.isLocal,
    isStaging: flags.isStaging,
    isProduction: flags.isProduction,
    isAdmin: flags.isAdmin,
    isAuthenticated: flags.isAuthenticated,
    isVerboseLogging: flags.isVerboseLogging,
  });
});
