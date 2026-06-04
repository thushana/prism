import "server-only";

import { readFileSync } from "node:fs";
import {
  APP_CONFIG_FILE_CANDIDATES,
  LEGACY_APP_JSON_FILE_NAME,
  PRISM_CONFIG_FILE_CANDIDATES,
  PRISM_CONFIG_FILE_NAME,
} from "./config-file-names";
import {
  prismAppConfigSchema,
  type PrismAppConfig,
} from "./prism-config-schema";
import { resolveExistingConfigFile } from "./resolve-config-file";

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}

function readPrismConfigJson(rootDirectory: string): unknown {
  const prismPath = resolveExistingConfigFile(
    rootDirectory,
    PRISM_CONFIG_FILE_CANDIDATES
  );
  if (prismPath) {
    return readJsonFile(prismPath);
  }

  const legacyAppConfigPath = resolveExistingConfigFile(
    rootDirectory,
    APP_CONFIG_FILE_CANDIDATES
  );
  if (legacyAppConfigPath) {
    return readJsonFile(legacyAppConfigPath);
  }

  const legacyJsonPath = resolveExistingConfigFile(rootDirectory, [
    LEGACY_APP_JSON_FILE_NAME,
  ]);
  if (legacyJsonPath) {
    return readJsonFile(legacyJsonPath);
  }

  throw new Error(
    `application-settings: missing ${PRISM_CONFIG_FILE_NAME} (or legacy prism.config.json / app.config.json / app.json) under ${rootDirectory}. See prism/docs/APP-CONFIG-Prism.md.`
  );
}

function extractAppConfig(parsed: unknown): PrismAppConfig {
  if (parsed && typeof parsed === "object" && "app" in parsed) {
    const result = prismAppConfigSchema.safeParse(
      (parsed as { app: unknown }).app
    );
    if (result.success) return result.data;
    throw new Error(
      `application-settings: invalid ${PRISM_CONFIG_FILE_NAME} app section:\n${result.error.message}`
    );
  }

  const result = prismAppConfigSchema.safeParse(parsed);
  if (result.success) return result.data;

  throw new Error(
    `application-settings: expected ${PRISM_CONFIG_FILE_NAME} with an app section (displayName, description, icon).`
  );
}

/**
 * Read standard app chrome from `config.prism.json` → `app`.
 * Falls back to legacy prism.config.json, flat app.config.json, or app.json.
 */
export function readApplicationSettingsFromDirectory(
  rootDirectory: string
): PrismAppConfig {
  return extractAppConfig(readPrismConfigJson(rootDirectory));
}

let cachedApplicationSettings: PrismAppConfig | undefined;

export function readApplicationSettings(): PrismAppConfig {
  if (!cachedApplicationSettings) {
    cachedApplicationSettings = readApplicationSettingsFromDirectory(
      process.cwd()
    );
  }
  return cachedApplicationSettings;
}
