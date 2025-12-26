import Database from "better-sqlite3";
import { databasePath } from "./db";
import * as fs from "fs";

async function seed() {
  try {
    console.log(`cwd: ${process.cwd()}`);
    console.log(`Using database at: ${databasePath}`);
    console.log(`DB exists: ${fs.existsSync(databasePath)}`);

    const sqlite = new Database(databasePath);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      );
      DELETE FROM users;
      INSERT INTO users (name, email, created_at) VALUES
        ('Alice', 'alice@example.com', strftime('%s','now')),
        ('Bob', 'bob@example.com', strftime('%s','now'));
    `);
    sqlite.close();

    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    process.exit(1);
  }
}

seed();
