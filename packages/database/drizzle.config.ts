import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./data/database/schema.ts",
  out: "./data/database/migrations",
  dbCredentials: {
    url: "./data/database/sqlite.db",
  },
});
