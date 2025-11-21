import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("./data/database/sqlite.db");
export const database = drizzle(sqlite, { schema });
