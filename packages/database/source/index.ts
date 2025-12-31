import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "./schema";

// Load environment variables from .env
config({ path: ".env", opsOff: true } as any);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
export const database = drizzle({ client: sql, schema });

// Export db as an alias for backward compatibility and consistency
export const db = database;

// Export schema for convenience
export * from "./schema";
