import { readFileSync } from "node:fs";
import path from "node:path";
import {
  PRISM_CONFIG_FILE_CANDIDATES,
  PRISM_CONFIG_FILE_NAME,
} from "./config-file-names";
import {
  prismConfigBaseSchema,
  type PrismConfigBase,
} from "./prism-config-schema";
import { resolveExistingConfigFile } from "./resolve-config-file";
import {
  type DevDeployment,
  type DevDeploymentContext,
  resolveDevDeployment,
} from "./dev-deployment";

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}

export function loadPrismConfigFromDirectory(
  rootDirectory: string
): PrismConfigBase {
  const filePath = resolveExistingConfigFile(
    rootDirectory,
    PRISM_CONFIG_FILE_CANDIDATES
  );
  if (!filePath) {
    throw new Error(
      `application-settings: missing ${PRISM_CONFIG_FILE_NAME} under ${rootDirectory}. See prism/docs/APP-CONFIG-Prism.md.`
    );
  }

  const parsed = readJsonFile(filePath);
  const result = prismConfigBaseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `application-settings: invalid ${PRISM_CONFIG_FILE_NAME}:\n${result.error.message}`
    );
  }
  return result.data;
}

function readPackageName(directory: string): string | undefined {
  const packageJsonPath = path.join(directory, "package.json");
  try {
    const raw = readFileSync(packageJsonPath, "utf8");
    const parsed = JSON.parse(raw) as { name?: string };
    return typeof parsed.name === "string" ? parsed.name : undefined;
  } catch {
    return undefined;
  }
}

/** Walk up from the app root to find the monorepo root `package.json` name. */
export function resolveMonorepoPackageName(
  appRoot: string
): string | undefined {
  let directory = appRoot;
  const appPackageName = readPackageName(appRoot);

  while (directory !== path.dirname(directory)) {
    const packageJsonPath = path.join(directory, "package.json");
    try {
      const raw = readFileSync(packageJsonPath, "utf8");
      const parsed = JSON.parse(raw) as {
        name?: string;
        workspaces?: unknown;
      };
      if (parsed.workspaces) {
        return typeof parsed.name === "string" ? parsed.name : undefined;
      }
    } catch {
      // continue
    }
    directory = path.dirname(directory);
  }

  return appPackageName;
}

export function loadDevDeploymentFromDirectory(
  appRoot: string,
  portFallback = 3000
): DevDeployment {
  const config = loadPrismConfigFromDirectory(appRoot);
  const context: DevDeploymentContext = {
    appPackageName: readPackageName(appRoot),
    monorepoPackageName: resolveMonorepoPackageName(appRoot),
  };
  return resolveDevDeployment(config, context, portFallback);
}
