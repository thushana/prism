import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import * as path from "path";
import * as fs from "fs";

const dbPath = path.resolve(
  process.cwd(),
  process.env.DATABASE_URL || "./data/database/sqlite.db"
);
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  )
`);
// @ts-expect-error - Beta version type definitions don't match runtime API yet
export const db = drizzle(sqlite, { schema });
export const databasePath = dbPath;

// Export schema for convenience
export * from "./schema";

