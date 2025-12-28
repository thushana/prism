import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load environment variables from .env
config({ path: ".env" });

// Use unpooled connection for drizzle-kit operations (migrations, push, etc.)
// The pooled connection is for runtime queries in the app
const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "DATABASE_URL or DATABASE_URL_UNPOOLED environment variable is required"
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/database/source/schema.ts",
  out: "./packages/database/migrations",
  dbCredentials: {
    url: dbUrl,
  },
});
