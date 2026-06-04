import "server-only";

import { readFileSync } from "node:fs";
import {
  PRISM_CONFIG_FILE_CANDIDATES,
  PRISM_CONFIG_FILE_NAME,
} from "./config-file-names";
import {
  prismConfigBaseSchema,
  type PrismConfigBase,
} from "./prism-config-schema";
import { requireExistingConfigFile } from "./resolve-config-file";

export function readPrismConfigFromDirectory(
  rootDirectory: string
): unknown {
  const filePath = requireExistingConfigFile(
    rootDirectory,
    PRISM_CONFIG_FILE_CANDIDATES,
    `Add ${PRISM_CONFIG_FILE_NAME} (see prism/docs/APP-CONFIG-Prism.md).`
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

let cachedPrismConfig: PrismConfigBase | undefined;

export function readPrismConfigBase(): PrismConfigBase {
  if (!cachedPrismConfig) {
    const parsed = readPrismConfigFromDirectory(process.cwd());
    const result = prismConfigBaseSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `application-settings: invalid ${PRISM_CONFIG_FILE_NAME}:\n${result.error.message}`
      );
    }
    cachedPrismConfig = result.data;
  }
  return cachedPrismConfig;
}
