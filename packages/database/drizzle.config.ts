import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./packages/database/source/schema.ts",
  out: "./packages/database/migrations",
  dbCredentials: {
    url: "./data/database/sqlite.db",
  },
});
