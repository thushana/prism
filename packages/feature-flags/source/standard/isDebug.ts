/**
 * Standard flag: isDebug – extra debug UI, logs, or dev tools
 */

import { createFlag } from "../flag";
import { parseFlagOption } from "../helpers";
import type { FeatureFlagContext } from "../types";

export function createIsDebugFlag(
  identify: (args: {
    headers: Headers;
    cookies: { get: (name: string) => { value: string } | undefined };
  }) => Promise<FeatureFlagContext> | FeatureFlagContext
) {
  return createFlag<boolean>({
    key: "isDebug",
    description: "Enable debug UI, logs, and dev tools",
    defaultValue: false,
    identify,
    decide: (context: FeatureFlagContext) => {
      if (context.urlOverrides?.isDebug !== undefined) {
        return parseFlagOption(context.urlOverrides.isDebug) ?? false;
      }
      if (context.envFlags?.isDebug !== undefined) {
        return parseFlagOption(context.envFlags.isDebug) ?? false;
      }
      if (context.env === "development" || context.env === "preview") {
        return true;
      }
      if (context.user?.type === "admin") {
        return true;
      }
      return false;
    },
  });
}
