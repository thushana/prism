/**
 * FeatureFlags – createFlag wraps Flags SDK and adapts to FeatureFlagContext
 */

import { flag as flagsSDKFlag } from "flags/next";
import type { FeatureFlagContext, CreateFlagConfig } from "./types";

const defaultContext: FeatureFlagContext = {
  env: process.env.NODE_ENV ?? "development",
};

export function createFlag<T>(config: CreateFlagConfig<T>) {
  return flagsSDKFlag<T, FeatureFlagContext>({
    key: config.key,
    description: config.description,
    defaultValue: config.defaultValue,
    ...(config.options !== undefined && {
      options: config.options as Parameters<typeof flagsSDKFlag<T, FeatureFlagContext>>[0]["options"],
    }),
    origin: config.origin,
    identify: config.identify,
    decide: ({ entities }) => config.decide(entities ?? defaultContext),
  });
}
