import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load environment variables from .env
config({ path: ".env", opsOff: true } as any);

const PLACEHOLDER_URL = "postgresql://127.0.0.1/drizzle-config-placeholder";

// Use unpooled connection for drizzle-kit operations (migrations, push, etc.).
// The pooled connection is for runtime queries in the app.
// Placeholder lets static analysis (knip) import this module; drizzle-kit CLI
// still requires a real DATABASE_URL / DATABASE_URL_UNPOOLED.
const dbUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  PLACEHOLDER_URL;

if (
  dbUrl === PLACEHOLDER_URL &&
  process.argv.some((arg) => arg.includes("drizzle-kit"))
) {
  throw new Error(
    "DATABASE_URL or DATABASE_URL_UNPOOLED environment variable is required"
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./database/schema.ts",
  out: "./database/migrations",
  dbCredentials: {
    url: dbUrl,
  },
});
