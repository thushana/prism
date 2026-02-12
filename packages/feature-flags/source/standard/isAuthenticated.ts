/**
 * Standard flag: isAuthenticated – user is logged in; URL override can simulate for demos
 */

import { createFlag } from "../flag";
import { parseFlagOption } from "../helpers";
import type { FeatureFlagContext } from "../types";

export function createIsAuthenticatedFlag(
  identify: (args: {
    headers: Headers;
    cookies: { get: (name: string) => { value: string } | undefined };
  }) => Promise<FeatureFlagContext> | FeatureFlagContext
) {
  return createFlag<boolean>({
    key: "isAuthenticated",
    description:
      "User is logged in (from auth); URL override can simulate for demos",
    defaultValue: false,
    identify,
    decide: (context: FeatureFlagContext) => {
      if (context.urlOverrides?.isAuthenticated !== undefined) {
        return (
          parseFlagOption(context.urlOverrides.isAuthenticated) ?? false
        );
      }
      return context.user?.authenticated ?? false;
    },
  });
}
