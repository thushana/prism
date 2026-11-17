/**
 * Webpack/Turbopack shim: older @better-auth/kysely-adapter builds expected
 * DEFAULT_MIGRATION_* on the kysely package root. Next aliases `kysely$` → this
 * file; re-export the real package via `kysely-original` so we do not loop.
 */
export * from "kysely-original";
export const DEFAULT_MIGRATION_TABLE = "kysely_migration";
export const DEFAULT_MIGRATION_LOCK_TABLE = "kysely_migration_lock";
