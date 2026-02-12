/**
 * Standard flag: isStaging – running in staging/preview (e.g. Vercel preview)
 */

import { createFlag } from "../flag";
import { parseFlagOption } from "../helpers";
import type { FeatureFlagContext } from "../types";

export function createIsStagingFlag(
  identify: (args: {
    headers: Headers;
    cookies: { get: (name: string) => { value: string } | undefined };
  }) => Promise<FeatureFlagContext> | FeatureFlagContext
) {
  return createFlag<boolean>({
    key: "isStaging",
    description: "Running in staging/preview (e.g. Vercel preview)",
    defaultValue: false,
    identify,
    decide: (context: FeatureFlagContext) => {
      if (context.urlOverrides?.isStaging !== undefined) {
        return parseFlagOption(context.urlOverrides.isStaging) ?? false;
      }
      if (context.envFlags?.isStaging !== undefined) {
        return parseFlagOption(context.envFlags.isStaging) ?? false;
      }
      return context.env === "preview";
    },
  });
}
