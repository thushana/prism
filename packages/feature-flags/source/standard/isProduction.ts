/**
 * Standard flag: isProduction – running in production
 */

import { createFlag } from "../flag";
import { parseFlagOption } from "../helpers";
import type { FeatureFlagContext } from "../types";

export function createIsProductionFlag(
  identify: (args: {
    headers: Headers;
    cookies: { get: (name: string) => { value: string } | undefined };
  }) => Promise<FeatureFlagContext> | FeatureFlagContext
) {
  return createFlag<boolean>({
    key: "isProduction",
    description: "Running in production",
    defaultValue: false,
    identify,
    decide: (context: FeatureFlagContext) => {
      if (context.urlOverrides?.isProduction !== undefined) {
        return parseFlagOption(context.urlOverrides.isProduction) ?? false;
      }
      if (context.envFlags?.isProduction !== undefined) {
        return parseFlagOption(context.envFlags.isProduction) ?? false;
      }
      return context.env === "production";
    },
  });
}
