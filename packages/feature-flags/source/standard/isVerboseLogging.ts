/**
 * Standard flag: isVerboseLogging – more verbose feature-flag or request logging
 */

import { createFlag } from "../flag";
import { parseFlagOption } from "../helpers";
import type { FeatureFlagContext } from "../types";

export function createIsVerboseLoggingFlag(
  identify: (args: {
    headers: Headers;
    cookies: { get: (name: string) => { value: string } | undefined };
  }) => Promise<FeatureFlagContext> | FeatureFlagContext
) {
  return createFlag<boolean>({
    key: "isVerboseLogging",
    description: "More verbose feature-flag or request logging",
    defaultValue: false,
    identify,
    decide: (context: FeatureFlagContext) => {
      if (context.urlOverrides?.isVerboseLogging !== undefined) {
        return parseFlagOption(context.urlOverrides.isVerboseLogging) ?? false;
      }
      if (context.envFlags?.isVerboseLogging !== undefined) {
        return parseFlagOption(context.envFlags.isVerboseLogging) ?? false;
      }
      return false;
    },
  });
}
