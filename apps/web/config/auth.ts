import { z } from "zod";
import {
  PRISM_BUILD_AUTH_ENV_FALLBACK,
  allowBuildEnvFallback,
} from "application-settings/build-env-fallback";

const AuthEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
});

export function loadAuthEnv() {
  const result = AuthEnvSchema.safeParse({
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  });

  if (result.success) {
    return result.data;
  }

  if (allowBuildEnvFallback()) {
    return PRISM_BUILD_AUTH_ENV_FALLBACK;
  }

  throw new Error(
    `Invalid auth environment: ${result.error.issues.map((i) => i.message).join(", ")}`
  );
}

export const authEnv = loadAuthEnv();
