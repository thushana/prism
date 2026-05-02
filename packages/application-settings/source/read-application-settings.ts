import "server-only";

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  applicationSettingsSchema,
  type ApplicationSettings,
} from "./application-settings-schema";

const DEFAULT_FILE_NAME = "app.json";

/**
 * Read and validate `app.json` at the given directory (repository or app root).
 * Call from server code only (`server-only`).
 */
export function readApplicationSettingsFromDirectory(
  rootDirectory: string,
  fileName: string = DEFAULT_FILE_NAME
): ApplicationSettings {
  const filePath = join(rootDirectory, fileName);
  if (!existsSync(filePath)) {
    throw new Error(
      `application-settings: missing ${fileName} at ${filePath}. Add app.json with displayName, description, and optional icon.`
    );
  }
  const raw = readFileSync(filePath, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (cause) {
    throw new Error(`application-settings: ${filePath} is not valid JSON.`, {
      cause,
    });
  }
  const result = applicationSettingsSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `application-settings: invalid ${fileName}:\n${result.error.message}`
    );
  }
  return result.data;
}

let cachedApplicationSettings: ApplicationSettings | undefined;

/**
 * Reads `app.json` from `process.cwd()` (Next.js server: project root in dev/build).
 * Result is cached at module level — the file never changes at runtime.
 */
export function readApplicationSettings(): ApplicationSettings {
  if (!cachedApplicationSettings) {
    cachedApplicationSettings = readApplicationSettingsFromDirectory(
      process.cwd()
    );
  }
  return cachedApplicationSettings;
}
