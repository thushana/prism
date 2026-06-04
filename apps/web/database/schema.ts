import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export * from "./schema/auth";

// Example app table — replace with your domain schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
