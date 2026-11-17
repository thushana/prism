/**
 * Fail Vercel builds when critical runtime secrets are missing.
 * No-op outside Vercel so local/`CI` builds can still use placeholders.
 */

export const PRISM_REQUIRED_VERCEL_ENV_KEYS = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
] as const;

export type AssertRequiredVercelEnvOptions = {
  /** Extra consumer keys required on Vercel (e.g. `GOOGLE_MAPS_API_KEY`). */
  additionalKeys?: readonly string[];
  env?: NodeJS.ProcessEnv;
};

export function collectRequiredVercelEnvProblems(
  options: AssertRequiredVercelEnvOptions = {}
): string[] {
  const env = options.env ?? process.env;
  if (!env.VERCEL) {
    return [];
  }

  const required = [
    ...PRISM_REQUIRED_VERCEL_ENV_KEYS,
    ...(options.additionalKeys ?? []),
  ];
  const missing = [...new Set(required)].filter((key) => !env[key]?.trim());
  const secret = env.BETTER_AUTH_SECRET?.trim() ?? "";
  const authUrl = env.BETTER_AUTH_URL?.trim() ?? "";
  const problems: string[] = [];

  if (missing.length > 0) {
    problems.push(`missing: ${missing.join(", ")}`);
  }
  if (secret && secret.length < 32) {
    problems.push("BETTER_AUTH_SECRET must be at least 32 characters");
  }
  if (authUrl) {
    try {
      const parsed = new URL(authUrl);
      const host = parsed.hostname;
      if (
        env.VERCEL_ENV === "production" &&
        (host === "localhost" ||
          host === "127.0.0.1" ||
          host.endsWith(".localhost"))
      ) {
        problems.push(
          "BETTER_AUTH_URL must be the public production URL (not localhost)"
        );
      }
    } catch {
      problems.push("BETTER_AUTH_URL must be a valid URL");
    }
  }

  return problems;
}

/** Throws when Vercel env is incomplete. Safe to call from `next.config` / build scripts. */
export function assertRequiredVercelEnv(
  options: AssertRequiredVercelEnvOptions = {}
): void {
  const problems = collectRequiredVercelEnvProblems(options);
  if (problems.length === 0) {
    return;
  }
  const env = options.env ?? process.env;
  throw new Error(
    `[assert-required-env] Refusing Vercel build (${env.VERCEL_ENV ?? "unknown"}): ${problems.join("; ")}`
  );
}
