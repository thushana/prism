/**
 * Build-time env placeholders for local/`CI` only.
 *
 * Never fall back when `VERCEL` is set. A READY Vercel deploy with missing
 * secrets otherwise ships and 500s at runtime (build used dummies; runtime did not).
 */

export const PRISM_BUILD_AUTH_ENV_FALLBACK = {
  BETTER_AUTH_SECRET: "ci_dummy_better_auth_secret_32_chars!!",
  BETTER_AUTH_URL: "http://localhost:3000",
} as const;

export const PRISM_BUILD_DATABASE_URL_FALLBACK =
  "postgresql://build:build@127.0.0.1:5432/build?sslmode=disable";

/**
 * Whether module loaders may substitute dummy DATABASE_URL / BETTER_AUTH_* values.
 */
export function allowBuildEnvFallback(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (env.VERCEL) {
    return false;
  }
  return (
    env.NEXT_PHASE === "phase-production-build" ||
    env.CI === "true" ||
    env.CI === "1"
  );
}
