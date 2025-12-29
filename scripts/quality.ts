#!/usr/bin/env tsx
/**
 * Run quality checks (typecheck, lint, format, test) in current project and related project
 * Works from both:
 * - Inside prism repo: runs quality in parent (if exists), then prism
 * - From child app: runs quality in current app, then prism (if exists)
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const scriptDir = __dirname;
const currentDir = path.join(scriptDir, "..");
const isInPrism = path.basename(path.dirname(scriptDir)) === "prism" || 
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

function runQualityChecks(cwd: string, projectName: string): void {
  try {
    execSync("npm run typecheck && npm run lint && npm run format && npm run test:run", {
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
      console.log(`📦 Running quality in parent project: ${PARENT_OR_APP_DIR}\n`);
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
