import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import * as path from "path";
import * as fs from "fs";

// Find project root by looking for package.json with workspaces
function findProjectRoot(startDir: string): string {
  let currentDir = startDir;

  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, "package.json");

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8")
        );
        // Check if this is the root package (has workspaces)
        if (packageJson.workspaces) {
          return currentDir;
        }
      } catch {
        // Continue searching
      }
    }

    currentDir = path.dirname(currentDir);
  }

  // Fallback to cwd if not found
  return process.cwd();
}

// Resolve database path relative to project root
// Can be overridden with DB_PATH environment variable
const projectRoot = findProjectRoot(__dirname);
const dbPath =
  process.env.DB_PATH || path.join(projectRoot, "data/database/sqlite.db");
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const database = drizzle(sqlite, { schema });

// Export schema for convenience
export * from "./schema";
