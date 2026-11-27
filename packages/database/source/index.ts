import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import {
  PRISM_BUILD_DATABASE_URL_FALLBACK,
  allowBuildEnvFallback,
} from "application-settings/build-env-fallback";
import * as schema from "./schema";

// Load environment variables from .env
config({ path: ".env", opsOff: true } as Parameters<typeof config>[0]);

function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL?.trim();
  if (configured) return configured;

  if (allowBuildEnvFallback()) {
    return PRISM_BUILD_DATABASE_URL_FALLBACK;
  }

  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(resolveDatabaseUrl());
export const database = drizzle({ client: sql, schema });

// Export db as an alias for backward compatibility and consistency
export const db = database;

// Export schema for convenience
export * from "./schema";

// Shared pgvector helpers (apps enable the extension in their own migrations)
export {
  DEFAULT_HALFVEC_DIMENSIONS,
  halfvec,
  vector,
} from "./vector";
