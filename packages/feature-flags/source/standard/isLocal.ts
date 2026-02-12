/**
 * Standard flag: isLocal – running locally (e.g. dev server, not Vercel)
 */

import { createFlag } from "../flag";
import { parseFlagOption } from "../helpers";
import type { FeatureFlagContext } from "../types";

export function createIsLocalFlag(
  identify: (args: {
    headers: Headers;
    cookies: { get: (name: string) => { value: string } | undefined };
  }) => Promise<FeatureFlagContext> | FeatureFlagContext
) {
  return createFlag<boolean>({
    key: "isLocal",
    description: "Running locally (e.g. dev server, not Vercel)",
    defaultValue: false,
    identify,
    decide: (context: FeatureFlagContext) => {
      if (context.urlOverrides?.isLocal !== undefined) {
        return parseFlagOption(context.urlOverrides.isLocal) ?? false;
      }
      if (context.envFlags?.isLocal !== undefined) {
        return parseFlagOption(context.envFlags.isLocal) ?? false;
      }
      return context.env === "development";
    },
  });
}
