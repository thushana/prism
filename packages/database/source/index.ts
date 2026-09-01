import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "./schema";

// Load environment variables from .env
config({ path: ".env", opsOff: true } as Parameters<typeof config>[0]);

/** Placeholder only during `next build` when env vars are not injected at compile time. */
const BUILD_DATABASE_URL =
  "postgresql://build:build@127.0.0.1:5432/build?sslmode=disable";

function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL?.trim();
  if (configured) return configured;

  // Never treat VERCEL=1 as a build signal — it is also set at runtime.
  const allowBuildFallback =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.CI === "true" ||
    process.env.CI === "1";

  if (allowBuildFallback) {
    return BUILD_DATABASE_URL;
  }

  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(resolveDatabaseUrl());
export const database = drizzle({ client: sql, schema });

// Export db as an alias for backward compatibility and consistency
export const db = database;

// Export schema for convenience
export * from "./schema";
