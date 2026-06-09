#!/usr/bin/env tsx
/**
 * Aligns selected dependency ranges in the parent app package.json with
 * prism/apps/web (canonical Next.js app in the monorepo).
 *
 * Default: dry-run (report drift only). Pass --update to write the parent app manifest
 * (`apps/web/package.json` when present, else repo root `package.json`).
 */

import fs from "fs";
import path from "path";
import { discoverPrismAppRoots } from "./assert-app-library-layout";
import {
  filterDependencyNamesForBuildOutput,
  SERVER_ONLY_DEV_PACKAGES,
  SERVER_ONLY_RUNTIME_PACKAGES,
} from "./sync-dependency-allowlist";
import { readBuildOutputFromAppRoot } from "./read-consumer-build-output";

const scriptDirectoryPath = __dirname;
const isRunningFromInsidePrismRepository =
  path.basename(path.dirname(scriptDirectoryPath)) === "prism" ||
  path.basename(scriptDirectoryPath) === "prism";

let parentProjectRootDirectoryPath: string;
let prismRepositoryRootDirectoryPath: string;

if (isRunningFromInsidePrismRepository) {
  prismRepositoryRootDirectoryPath = path.join(scriptDirectoryPath, "..");
  parentProjectRootDirectoryPath = path.join(
    prismRepositoryRootDirectoryPath,
    ".."
  );
} else {
  parentProjectRootDirectoryPath = path.join(scriptDirectoryPath, "..");
  prismRepositoryRootDirectoryPath = path.join(
    parentProjectRootDirectoryPath,
    "prism"
  );
}

const referenceWebApplicationPackageJsonPath = path.join(
  prismRepositoryRootDirectoryPath,
  "apps/web/package.json"
);
function resolveParentApplicationPackageJsonPath(
  parentProjectRootDirectoryPath: string
): string {
  const appWebPackageJsonPath = path.join(
    parentProjectRootDirectoryPath,
    "apps/web/package.json"
  );
  if (fs.existsSync(appWebPackageJsonPath)) {
    return appWebPackageJsonPath;
  }
  return path.join(parentProjectRootDirectoryPath, "package.json");
}

const parentApplicationPackageJsonPath =
  resolveParentApplicationPackageJsonPath(parentProjectRootDirectoryPath);

/** Package names: web `dependencies` mirrored to parent `dependencies`. */
const REFERENCE_WEB_APPLICATION_RUNTIME_DEPENDENCY_PACKAGE_NAMES = [
  "next",
  "react",
  "react-dom",
  "@radix-ui/react-slot",
  "dotenv",
  "drizzle-orm",
  "flags",
  "zod",
] as const;

/** Package names: web `devDependencies` mirrored to parent `devDependencies`. */
const REFERENCE_WEB_APPLICATION_DEVELOPMENT_DEPENDENCY_PACKAGE_NAMES = [
  "@tailwindcss/postcss",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "commander",
  "drizzle-kit",
  "eslint",
  "eslint-config-next",
  "lightningcss",
  "postcss-import",
  "prettier",
  "tailwindcss",
  "tsx",
  "tw-animate-css",
  "typescript",
  "vitest",
  "@vitest/ui",
] as const;

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

function readPackageJsonFile(filePath: string): PackageJson {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as PackageJson;
}

function writePackageJsonFile(filePath: string, data: PackageJson): void {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function resolveConsumerAppRoot(
  parentProjectRootDirectoryPath: string
): string {
  const appRoots = discoverPrismAppRoots(parentProjectRootDirectoryPath);
  const appsWeb = path.join(parentProjectRootDirectoryPath, "apps", "web");
  if (appRoots.includes(path.resolve(appsWeb))) {
    return appsWeb;
  }
  return appRoots[0] ?? parentProjectRootDirectoryPath;
}

function reportStaleServerPackages(
  parentPackageJson: PackageJson,
  buildOutput: "static" | "server"
): void {
  if (buildOutput !== "static") {
    return;
  }

  const stale: string[] = [];
  const allDeps = {
    ...(parentPackageJson.dependencies ?? {}),
    ...(parentPackageJson.devDependencies ?? {}),
  };

  for (const packageName of [
    ...SERVER_ONLY_RUNTIME_PACKAGES,
    ...SERVER_ONLY_DEV_PACKAGES,
  ]) {
    if (allDeps[packageName]) {
      stale.push(packageName);
    }
  }

  if (stale.length > 0) {
    console.log(
      "ℹ️  Static build: server-only packages still in manifest (not removed automatically):\n"
    );
    for (const name of stale) {
      console.log(`   - ${name}`);
    }
    console.log("");
  }
}

function synchronizeDependencyVersions(
  shouldWriteUpdatesToParentPackageJson: boolean
): void {
  if (!fs.existsSync(referenceWebApplicationPackageJsonPath)) {
    console.error(
      `❌ Web package.json not found: ${referenceWebApplicationPackageJsonPath}`
    );
    process.exit(1);
  }
  if (!fs.existsSync(parentApplicationPackageJsonPath)) {
    console.error(
      `❌ Parent package.json not found: ${parentApplicationPackageJsonPath}`
    );
    process.exit(1);
  }

  const referencePackageJson = readPackageJsonFile(
    referenceWebApplicationPackageJsonPath
  );
  const parentPackageJson = readPackageJsonFile(
    parentApplicationPackageJsonPath
  );

  const consumerAppRoot = resolveConsumerAppRoot(
    parentProjectRootDirectoryPath
  );
  const buildOutput = readBuildOutputFromAppRoot(consumerAppRoot);
  reportStaleServerPackages(parentPackageJson, buildOutput);

  const runtimePackageNames = filterDependencyNamesForBuildOutput(
    REFERENCE_WEB_APPLICATION_RUNTIME_DEPENDENCY_PACKAGE_NAMES,
    buildOutput
  );
  const devPackageNames = filterDependencyNamesForBuildOutput(
    REFERENCE_WEB_APPLICATION_DEVELOPMENT_DEPENDENCY_PACKAGE_NAMES,
    buildOutput
  );

  const referenceRuntimeDependencies = referencePackageJson.dependencies ?? {};
  const referenceDevelopmentDependencies =
    referencePackageJson.devDependencies ?? {};
  const parentRuntimeDependencies = {
    ...(parentPackageJson.dependencies ?? {}),
  };
  const parentDevelopmentDependencies = {
    ...(parentPackageJson.devDependencies ?? {}),
  };

  const versionDriftDescriptionLines: string[] = [];
  const skippedSynchronizationDescriptionLines: string[] = [];

  for (const packageName of runtimePackageNames) {
    const referenceVersionRange = referenceRuntimeDependencies[packageName];
    if (referenceVersionRange === undefined) {
      skippedSynchronizationDescriptionLines.push(
        `${packageName} (not in web dependencies — skipped)`
      );
      continue;
    }
    const parentVersionRange = parentRuntimeDependencies[packageName];
    if (parentVersionRange !== referenceVersionRange) {
      versionDriftDescriptionLines.push(
        `dependencies.${packageName}: parent "${parentVersionRange ?? "(missing)"}" → reference web "${referenceVersionRange}"`
      );
      if (shouldWriteUpdatesToParentPackageJson) {
        parentRuntimeDependencies[packageName] = referenceVersionRange;
      }
    }
  }

  for (const packageName of devPackageNames) {
    const referenceVersionRange = referenceDevelopmentDependencies[packageName];
    if (referenceVersionRange === undefined) {
      skippedSynchronizationDescriptionLines.push(
        `${packageName} (not in web devDependencies — skipped)`
      );
      continue;
    }
    const parentVersionRange = parentDevelopmentDependencies[packageName];
    if (parentVersionRange !== referenceVersionRange) {
      versionDriftDescriptionLines.push(
        `devDependencies.${packageName}: parent "${parentVersionRange ?? "(missing)"}" → reference web "${referenceVersionRange}"`
      );
      if (shouldWriteUpdatesToParentPackageJson) {
        parentDevelopmentDependencies[packageName] = referenceVersionRange;
      }
    }
  }

  if (skippedSynchronizationDescriptionLines.length > 0) {
    console.log(
      "ℹ️  Allowlisted packages not present in web (left unchanged):\n"
    );
    for (const line of skippedSynchronizationDescriptionLines) {
      console.log(`   - ${line}`);
    }
    console.log("");
  }

  if (versionDriftDescriptionLines.length === 0) {
    console.log(
      `✅ Dependency ranges already match prism/apps/web (${path.relative(parentProjectRootDirectoryPath, parentApplicationPackageJsonPath)}).`
    );
    return;
  }

  console.log(
    shouldWriteUpdatesToParentPackageJson
      ? "📝 Applying updates from prism/apps/web:\n"
      : "⚠️  Drift vs prism/apps/web (run with --update to apply):\n"
  );
  for (const line of versionDriftDescriptionLines) {
    console.log(`   - ${line}`);
  }
  console.log("");

  if (shouldWriteUpdatesToParentPackageJson) {
    parentPackageJson.dependencies = parentRuntimeDependencies;
    parentPackageJson.devDependencies = parentDevelopmentDependencies;
    writePackageJsonFile(parentApplicationPackageJsonPath, parentPackageJson);
    console.log(`✅ Updated ${parentApplicationPackageJsonPath}`);
  }
}

const shouldWriteUpdatesToParentPackageJson = process.argv.includes("--update");

synchronizeDependencyVersions(shouldWriteUpdatesToParentPackageJson);
