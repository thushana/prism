/**
 * FeatureFlags – createIdentify builds the shared evaluation context
 */

import { dedupe } from "flags/next";
import type { FeatureFlagContext, CreateIdentifyOptions } from "./types";
import { parseUrlOverrides, getEnvFlags } from "./helpers";

export function createIdentify(options: CreateIdentifyOptions = {}) {
  const identifyFn = async (args: {
    headers: Headers;
    cookies: { get: (name: string) => { value: string } | undefined };
  }): Promise<FeatureFlagContext> => {
    const context: FeatureFlagContext = {
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    };

    if (options.envFlagPrefix ?? options.envFlagKeys?.length) {
      context.envFlags = getEnvFlags({
        envFlagPrefix: options.envFlagPrefix,
        envFlagKeys: options.envFlagKeys,
      });
    }

    const overridesHeader = args.headers.get("x-prism-flag-overrides");
    if (overridesHeader) {
      context.urlOverrides = parseUrlOverrides(overridesHeader);
    }

    if (options.authCheck) {
      context.user = await options.authCheck(args.cookies);
    }

    return context;
  };

  return dedupe(identifyFn);
}
