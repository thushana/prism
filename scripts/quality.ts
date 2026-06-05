#!/usr/bin/env tsx
/**
 * Run quality checks (format → lint → typecheck → [knip if configured] → test) in current project and related project.
 * Single source of truth: edit here; apps using prism run this via "tsx prism/scripts/quality.ts".
 * Works from both:
 * - Inside prism repo: runs quality in parent (if exists), then prism
 * - From child app: runs quality in current app, then prism (if exists)
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const scriptDir = __dirname;
const currentDir = path.join(scriptDir, "..");
const isInPrism =
  path.basename(path.dirname(scriptDir)) === "prism" ||
  path.basename(scriptDir) === "prism";

let PRISM_DIR: string;
let PARENT_OR_APP_DIR: string;

if (isInPrism) {
  // Running from inside prism - check for parent project
  PRISM_DIR = currentDir;
  PARENT_OR_APP_DIR = path.join(PRISM_DIR, "..");
} else {
  // Running from child app - check for prism submodule
  PARENT_OR_APP_DIR = currentDir;
  PRISM_DIR = path.join(PARENT_OR_APP_DIR, "prism");
}

const BASE_QUALITY_CMD =
  "pnpm run format && pnpm run lint && pnpm run typecheck";

/** Embedder apps hoist prism/packages/*; a separate prism/node_modules duplicates types. */
const PRISM_STANDALONE_NODE_MODULES_DIR = ".prism-node-modules-stash";

function isPrismEmbedderApp(appRoot: string): boolean {
  return (
    fs.existsSync(path.join(appRoot, "config.prism.json")) &&
    fs.existsSync(path.join(PRISM_DIR, "package.json"))
  );
}

function prismStandaloneNodeModulesStashPath(appRoot: string): string {
  return path.join(appRoot, PRISM_STANDALONE_NODE_MODULES_DIR);
}

function hidePrismStandaloneNodeModules(appRoot: string): void {
  if (!isPrismEmbedderApp(appRoot)) {
    return;
  }

  const nodeModules = path.join(PRISM_DIR, "node_modules");
  const hidden = prismStandaloneNodeModulesStashPath(appRoot);
  const legacyHidden = path.join(PRISM_DIR, "node_modules.prism-standalone");

  if (fs.existsSync(legacyHidden) && !fs.existsSync(nodeModules)) {
    fs.renameSync(legacyHidden, nodeModules);
  }

  if (fs.existsSync(nodeModules) && fs.existsSync(hidden)) {
    fs.rmSync(nodeModules, { recursive: true, force: true });
    console.log(
      "ℹ️  Removed duplicate prism/node_modules (using existing stash for app typecheck)\n"
    );
  } else if (fs.existsSync(nodeModules) && !fs.existsSync(hidden)) {
    fs.renameSync(nodeModules, hidden);
    console.log(
      "ℹ️  Stashed prism/node_modules during app typecheck (avoid duplicate Next/Better Auth types)\n"
    );
  }
}

function ensurePrismStandaloneNodeModules(appRoot: string): void {
  const nodeModules = path.join(PRISM_DIR, "node_modules");
  const hidden = prismStandaloneNodeModulesStashPath(appRoot);

  if (fs.existsSync(hidden) && fs.existsSync(nodeModules)) {
    fs.rmSync(nodeModules, { recursive: true, force: true });
  }

  if (fs.existsSync(hidden)) {
    fs.renameSync(hidden, nodeModules);
    return;
  }

  if (!fs.existsSync(nodeModules)) {
    console.log(
      "ℹ️  Installing prism/node_modules for prism quality checks…\n"
    );
    execSync("pnpm install", { cwd: PRISM_DIR, stdio: "inherit" });
  }
}

function qualityCmd(cwd: string): string {
  const packageJsonPath = path.join(cwd, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return `${BASE_QUALITY_CMD} && pnpm run test:run`;
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  const knipStep = pkg.scripts?.knip ? " && pnpm run knip" : "";

  return `${BASE_QUALITY_CMD}${knipStep} && pnpm run test:run`;
}

function runAppLibraryLayoutCheck(cwd: string): void {
  const assertScript = path.join(
    PRISM_DIR,
    "scripts/assert-app-library-layout.ts"
  );
  if (!fs.existsSync(assertScript)) {
    return;
  }

  execSync(`tsx "${assertScript}" "${cwd}"`, {
    cwd,
    stdio: "inherit",
  });
}

function runQualityChecks(cwd: string, _projectName: string): void {
  try {
    runAppLibraryLayoutCheck(cwd);
    execSync(qualityCmd(cwd), {
      cwd,
      stdio: "inherit",
    });
  } catch (error) {
    process.exitCode = 1;
    throw error;
  }
}

function runQuality(): void {
  console.log("🔍 Running quality checks...\n");

  // Determine which project to run first
  const parentPackageJson = path.join(PARENT_OR_APP_DIR, "package.json");
  const prismPackageJson = path.join(PRISM_DIR, "package.json");
  const currentPackageJson = path.join(currentDir, "package.json");

  // If we're in prism, check for parent first
  if (isInPrism && fs.existsSync(parentPackageJson)) {
    try {
      console.log(
        `📦 Running quality in parent project: ${PARENT_OR_APP_DIR}\n`
      );
      hidePrismStandaloneNodeModules(PARENT_OR_APP_DIR);
      runQualityChecks(PARENT_OR_APP_DIR, "parent project");
      console.log("\n✅ Parent project quality checks passed\n");
    } catch (error) {
      console.error("\n❌ Parent project quality checks failed\n");
      process.exitCode = 1;
      return;
    }
  }
  // If we're in a child app, run current app first
  else if (!isInPrism && fs.existsSync(currentPackageJson)) {
    try {
      console.log(`📦 Running quality in current project: ${currentDir}\n`);
      hidePrismStandaloneNodeModules(currentDir);
      runQualityChecks(currentDir, "current project");
      console.log("\n✅ Current project quality checks passed\n");
    } catch (error) {
      console.error("\n❌ Current project quality checks failed\n");
      process.exitCode = 1;
      return;
    }
  }

  // Run quality in current project if we're in prism (and haven't run it yet)
  // or run prism quality if we're in a child app and prism exists
  if (isInPrism && fs.existsSync(currentPackageJson)) {
    // We're in prism, run quality here
    try {
      console.log(`🔷 Running quality in prism: ${currentDir}\n`);
      ensurePrismStandaloneNodeModules(currentDir);
      runQualityChecks(currentDir, "prism");
      console.log("\n✅ Prism quality checks passed\n");
    } catch (error) {
      console.error("\n❌ Prism quality checks failed\n");
      process.exitCode = 1;
      return;
    }
  } else if (!isInPrism && fs.existsSync(prismPackageJson)) {
    // We're in a child app, run prism quality if it exists
    try {
      console.log(`🔷 Running quality in prism: ${PRISM_DIR}\n`);
      ensurePrismStandaloneNodeModules(PARENT_OR_APP_DIR);
      runQualityChecks(PRISM_DIR, "prism");
      console.log("\n✅ Prism quality checks passed\n");
    } catch (error) {
      console.error("\n❌ Prism quality checks failed\n");
      process.exitCode = 1;
      return;
    }
  } else if (!isInPrism) {
    // Only log this if we're not in prism (it's expected when running from prism)
    console.log(`ℹ️  No prism directory found at: ${PRISM_DIR}`);
    console.log(`   Skipping prism quality checks\n`);
  }

  if (process.exitCode === 0 || process.exitCode === undefined) {
    console.log("✨ All quality checks passed!");
  }
}

runQuality();
