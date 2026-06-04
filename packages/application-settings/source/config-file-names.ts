/** Current Prism-standard manifest at the Next.js app root. */
export const PRISM_CONFIG_FILE_NAME = "config.prism.json";

/** Current client-specific manifest at the Next.js app root. */
export const APP_CONFIG_FILE_NAME = "config.app.json";

/** @deprecated Renamed to `config.prism.json`. Still read if the new file is absent. */
export const LEGACY_PRISM_CONFIG_FILE_NAME = "prism.config.json";

/** @deprecated Renamed to `config.app.json`. Still read if the new file is absent. */
export const LEGACY_APP_CONFIG_FILE_NAME = "app.config.json";

/** @deprecated Pre-manifest chrome-only file. Still read for app chrome when no prism config exists. */
export const LEGACY_APP_JSON_FILE_NAME = "app.json";

/** Prefer `config.prism.json`, then `prism.config.json`. */
export const PRISM_CONFIG_FILE_CANDIDATES = [
  PRISM_CONFIG_FILE_NAME,
  LEGACY_PRISM_CONFIG_FILE_NAME,
] as const;

/** Prefer `config.app.json`, then `app.config.json`. */
export const APP_CONFIG_FILE_CANDIDATES = [
  APP_CONFIG_FILE_NAME,
  LEGACY_APP_CONFIG_FILE_NAME,
] as const;
