/** Webpack shim: @better-auth/kysely-adapter imports migration constants from the kysely root. */
export * from "kysely";
export const DEFAULT_MIGRATION_TABLE = "kysely_migration";
export const DEFAULT_MIGRATION_LOCK_TABLE = "kysely_migration_lock";
