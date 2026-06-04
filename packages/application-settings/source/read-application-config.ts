import "server-only";

import { readFileSync } from "node:fs";
import {
  APP_CONFIG_FILE_CANDIDATES,
  APP_CONFIG_FILE_NAME,
} from "./config-file-names";
import {
  applicationConfigBaseSchema,
  type ApplicationConfigBase,
} from "./application-config-schema";
import { requireExistingConfigFile } from "./resolve-config-file";

/**
 * Read client app config from `config.app.json` (or legacy `app.config.json`).
 * Host apps should validate with their own Zod schema. This helper only checks JSON syntax.
 */
export function readApplicationConfigFromDirectory(
  rootDirectory: string
): unknown {
  const filePath = requireExistingConfigFile(
    rootDirectory,
    APP_CONFIG_FILE_CANDIDATES,
    `Add ${APP_CONFIG_FILE_NAME} (see prism/docs/APP-CONFIG-Prism.md).`
  );
  const raw = readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw) as unknown;
  } catch (cause) {
    throw new Error(`application-settings: ${filePath} is not valid JSON.`, {
      cause,
    });
  }
}

let cachedApplicationConfig: ApplicationConfigBase | undefined;

/**
 * Read client app config from `process.cwd()` (server-only).
 * Validates only the shared base schema; extend in the host app for domain fields.
 */
export function readApplicationConfigBase(): ApplicationConfigBase {
  if (!cachedApplicationConfig) {
    const parsed = readApplicationConfigFromDirectory(process.cwd());
    const result = applicationConfigBaseSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `application-settings: invalid ${APP_CONFIG_FILE_NAME} base fields:\n${result.error.message}`
      );
    }
    cachedApplicationConfig = result.data;
  }
  return cachedApplicationConfig;
}
