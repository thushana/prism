/**
 * Standard flag: isAdmin – feature visible only to admins
 */

import { createFlag } from "../flag";
import { parseFlagOption } from "../helpers";
import type { FeatureFlagContext } from "../types";

export function createIsAdminFlag(
  identify: (args: {
    headers: Headers;
    cookies: { get: (name: string) => { value: string } | undefined };
  }) => Promise<FeatureFlagContext> | FeatureFlagContext
) {
  return createFlag<boolean>({
    key: "isAdmin",
    description: "Feature visible only to admins",
    defaultValue: false,
    identify,
    decide: (context: FeatureFlagContext) => {
      if (context.urlOverrides?.isAdmin !== undefined) {
        return parseFlagOption(context.urlOverrides.isAdmin) ?? false;
      }
      if (context.envFlags?.isAdmin !== undefined) {
        return parseFlagOption(context.envFlags.isAdmin) ?? false;
      }
      return (
        (context.user?.authenticated === true &&
          context.user?.type === "admin") ??
        false
      );
    },
  });
}
