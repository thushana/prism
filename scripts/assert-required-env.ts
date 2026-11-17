#!/usr/bin/env tsx
/**
 * Fail Vercel builds when critical runtime secrets are missing.
 *
 * Usage (consumer or Prism web):
 *   tsx prism/scripts/assert-required-env.ts
 *   tsx prism/scripts/assert-required-env.ts --extra=GOOGLE_MAPS_API_KEY
 *
 * Or set PRISM_ASSERT_ADDITIONAL_ENV_KEYS=KEY_A,KEY_B
 */

import { assertRequiredVercelEnv } from "../packages/application-settings/source/assert-required-vercel-env";

function parseAdditionalKeys(argv: string[]): string[] {
  const fromArgs = argv
    .filter((arg) => arg.startsWith("--extra="))
    .flatMap((arg) =>
      arg
        .slice("--extra=".length)
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean)
    );
  const fromEnv = (process.env.PRISM_ASSERT_ADDITIONAL_ENV_KEYS ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
  return [...new Set([...fromEnv, ...fromArgs])];
}

try {
  assertRequiredVercelEnv({
    additionalKeys: parseAdditionalKeys(process.argv.slice(2)),
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
