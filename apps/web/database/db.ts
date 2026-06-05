import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "./schema";

// Load environment variables from .env
config({ path: ".env", opsOff: true } as any);

const CI_FALLBACK_DATABASE_URL =
  "postgresql://ci:ci@127.0.0.1:5432/ci?sslmode=disable";

const databaseUrl =
  process.env.DATABASE_URL ??
  (process.env.CI === "true" ? CI_FALLBACK_DATABASE_URL : undefined);

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(databaseUrl);
export const db = drizzle({ client: sql, schema });

// Export schema for convenience
export * from "./schema";
