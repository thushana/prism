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

function isMonorepoRootDirectory(directory: string): boolean {
  try {
    const raw = readFileSync(path.join(directory, "package.json"), "utf8");
    const parsed = JSON.parse(raw) as { workspaces?: unknown };
    if (parsed.workspaces) {
      return true;
    }
  } catch {
    // missing package.json — still allow pnpm-workspace.yaml below
  }

  try {
    readFileSync(path.join(directory, "pnpm-workspace.yaml"), "utf8");
    return true;
  } catch {
    return false;
  }
}

/**
 * Absolute checkout root: nearest ancestor that is a monorepo root
 * (`package.json` `workspaces` or `pnpm-workspace.yaml`), else the resolved app root.
 */
export function resolveCheckoutRoot(appRoot: string): string {
  let directory = path.resolve(appRoot);

  while (directory !== path.dirname(directory)) {
    if (isMonorepoRootDirectory(directory)) {
      return directory;
    }
    directory = path.dirname(directory);
  }

  return path.resolve(appRoot);
}

/** Walk up from the app root to find the monorepo root `package.json` name. */
export function resolveMonorepoPackageName(
  appRoot: string
): string | undefined {
  const appPackageName = readPackageName(appRoot);
  let directory = path.resolve(appRoot);

  while (directory !== path.dirname(directory)) {
    if (isMonorepoRootDirectory(directory)) {
      return readPackageName(directory) ?? appPackageName;
    }
    directory = path.dirname(directory);
  }

  return appPackageName;
}

export function loadDevDeploymentFromDirectory(
  appRoot: string,
  portFallback = 3000
): DevDeployment {
  const resolvedAppRoot = path.resolve(appRoot);
  const config = loadPrismConfigFromDirectory(resolvedAppRoot);
  const context: DevDeploymentContext = {
    appPackageName: readPackageName(resolvedAppRoot),
    monorepoPackageName: resolveMonorepoPackageName(resolvedAppRoot),
    checkoutRoot: resolveCheckoutRoot(resolvedAppRoot),
    appRoot: resolvedAppRoot,
  };
  return resolveDevDeployment(config, context, portFallback);
}
