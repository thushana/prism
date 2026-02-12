#!/usr/bin/env tsx
/**
 * Sync scripts from prism/package.json into the parent project's package.json
 * This allows projects using prism to inherit scripts while maintaining local overrides
 * 
 * Can be run from:
 * - Inside prism repo: syncs to ../package.json (parent project)
 * - From parent project: syncs from ./prism/package.json
 */

import fs from "fs";
import path from "path";

// Detect if we're running from prism or parent project
const scriptDir = __dirname;
const isInPrism = path.basename(path.dirname(scriptDir)) === "prism" || 
                  path.basename(scriptDir) === "prism";

let PRISM_PACKAGE_JSON: string;
let MAIN_PACKAGE_JSON: string;

if (isInPrism) {
  // Running from inside prism - sync to parent
  PRISM_PACKAGE_JSON = path.join(scriptDir, "../package.json");
  MAIN_PACKAGE_JSON = path.join(scriptDir, "../../package.json");
} else {
  // Running from parent project - sync from prism
  PRISM_PACKAGE_JSON = path.join(scriptDir, "../prism/package.json");
  MAIN_PACKAGE_JSON = path.join(scriptDir, "../package.json");
}

interface PackageJson {
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

function syncScripts(): void {
  // Check if files exist
  if (!fs.existsSync(PRISM_PACKAGE_JSON)) {
    console.error(`❌ Prism package.json not found at: ${PRISM_PACKAGE_JSON}`);
    process.exit(1);
  }

  if (!fs.existsSync(MAIN_PACKAGE_JSON)) {
    // If running from inside prism and no parent project exists, skip gracefully
    if (isInPrism) {
      console.log(`ℹ️  No parent project found at: ${MAIN_PACKAGE_JSON}`);
      console.log(`   Skipping script sync (prism is standalone)`);
      return;
    }
    console.error(`❌ Main package.json not found at: ${MAIN_PACKAGE_JSON}`);
    process.exit(1);
  }

  // Read both package.json files
  const prismPackage: PackageJson = JSON.parse(
    fs.readFileSync(PRISM_PACKAGE_JSON, "utf-8")
  );
  const mainPackage: PackageJson = JSON.parse(
    fs.readFileSync(MAIN_PACKAGE_JSON, "utf-8")
  );

  // Get scripts from both
  const prismScripts = prismPackage.scripts || {};
  const mainScripts = mainPackage.scripts || {};

  // Merge scripts: main project scripts take precedence (local overrides)
  // But we'll add any new scripts from prism that don't exist in main
  const mergedScripts: Record<string, string> = { ...mainScripts };
  const addedScripts: string[] = [];
  const skippedScripts: string[] = [];
  const removedScripts: string[] = [];

  // Determine the main project root for path checks
  const mainProjectRoot = path.dirname(MAIN_PACKAGE_JSON);

  // Remove scripts that shouldn't be in the main project
  // (workspace-specific or duplicates that were added previously)
  for (const key of Object.keys(mergedScripts)) {
    const value = mergedScripts[key];
    if (
      key === "prism" ||
      key === "tools" ||
      (key.startsWith("database:") && mergedScripts[`db:${key.replace("database:", "")}`]) ||
      (value.includes("-w tools") || value.includes("-w apps/")) ||
      ((key === "test" || key === "test:run") && value.includes("--workspaces")) ||
      (key === "clean" && value.includes("apps/")) ||
      (key === "dev:setup" && !fs.existsSync(path.join(mainProjectRoot, "scripts/setup-hosts.sh")))
    ) {
      delete mergedScripts[key];
      removedScripts.push(key);
    }
  }

  // Add scripts from prism that don't exist in main
  for (const [key, value] of Object.entries(prismScripts)) {
    if (!(key in mergedScripts)) {
      // Adapt prism scripts to work in the main project context
      let adaptedValue = value;

      // Skip database:* scripts if db:* versions already exist
      if (key.startsWith("database:") && mainScripts[`db:${key.replace("database:", "")}`]) {
        skippedScripts.push(key);
        continue;
      }

      // Skip scripts that reference files that don't exist in main project
      if (key === "clean:directories" && !fs.existsSync(path.join(mainProjectRoot, "scripts/clean-directories.ts"))) {
        skippedScripts.push(key);
        continue;
      }
      if (key === "dev:setup" && !fs.existsSync(path.join(mainProjectRoot, "scripts/setup-hosts.sh"))) {
        skippedScripts.push(key);
        continue;
      }

      // Skip test scripts that use workspaces (no tests configured in main project)
      if ((key === "test" || key === "test:run" || key === "test:ui" || key === "test:coverage") && value.includes("--workspaces")) {
        skippedScripts.push(key);
        continue;
      }

      // Skip scripts that can't be adapted (workspace-specific)
      if (
        (value.includes("-w apps/") || value.includes("apps/web") || value.includes("-w tools")) &&
        key !== "lint:fix" && // lint:fix can be adapted
        !key.startsWith("quality") && // quality scripts can be adapted
        key !== "clean" // clean script can be adapted
      ) {
        skippedScripts.push(key);
        continue;
      }

      if (key === "prism" || key === "tools") {
        skippedScripts.push(key);
        continue;
      }

      // Adapt database scripts to use the correct config path
      if (key.startsWith("database:")) {
        adaptedValue = value.replace(
          "packages/database/drizzle.config.ts",
          "database/drizzle.config.ts"
        );
      }

      // Adapt format/lint scripts to use correct paths
      if (key === "format" || key === "format:check") {
        adaptedValue = value
          .replace('"apps/**/*.{ts,tsx,json}"', '"app/**/*.{ts,tsx}"')
          .replace('"packages/**/*.{ts,tsx,json}"', "")
          .replace('"docs/**/*.md"', "")
          .replace(/\s+/g, " ")
          .trim();
      }

      // Adapt lint:fix to work without workspaces
      if (key === "lint:fix") {
        adaptedValue = "eslint app --ext .ts,.tsx --fix";
      }

      // Apps defer quality to prism so one script defines format → lint → typecheck → test
      if (key === "quality") {
        adaptedValue = "tsx prism/scripts/quality.ts";
      }
      if (key === "quality:quick") {
        adaptedValue = "npm run format && npm run lint && npm run typecheck";
      }

      // quality script is smart and handles both app and prism automatically

      // Adapt clean script to work in main project
      if (key === "clean") {
        adaptedValue = "rm -rf .next node_modules/.cache *.tsbuildinfo";
      }

      // Adapt clean:directories to use correct path
      if (key === "clean:directories") {
        adaptedValue = "tsx scripts/clean-directories.ts";
      }

      // Adapt generate:colors to use correct path
      if (key === "generate:colors") {
        adaptedValue = "cd prism/packages/ui && npm run generate:colors";
      }

      // Adapt vercel:build to work in main project
      if (key === "vercel:build") {
        adaptedValue = "vercel build";
      }

      mergedScripts[key] = adaptedValue;
      addedScripts.push(key);
    }
  }

  // Apps defer to prism for quality (single source of truth: prism/scripts/quality.ts)
  const isTargetingApp = path.resolve(MAIN_PACKAGE_JSON) !== path.resolve(PRISM_PACKAGE_JSON);
  if (isTargetingApp && mergedScripts) {
    mergedScripts.quality = "tsx prism/scripts/quality.ts";
    mergedScripts["quality:quick"] = "npm run format && npm run lint && npm run typecheck";
  }

  // Sort scripts alphabetically
  const sortedScripts: Record<string, string> = {};
  const sortedKeys = Object.keys(mergedScripts).sort();
  for (const key of sortedKeys) {
    sortedScripts[key] = mergedScripts[key];
  }

  // Update the main package.json
  mainPackage.scripts = sortedScripts;

  // Write back to file
  fs.writeFileSync(
    MAIN_PACKAGE_JSON,
    JSON.stringify(mainPackage, null, 2) + "\n",
    "utf-8"
  );

  console.log("✅ Synced scripts from prism/package.json");
  if (addedScripts.length > 0) {
    console.log(`   Added ${addedScripts.length} new script(s):`);
    addedScripts.forEach((script) => {
      console.log(`     - ${script}`);
    });
  } else {
    console.log("   No new scripts to add (all scripts already exist)");
  }
  if (skippedScripts.length > 0) {
    console.log(`   Skipped ${skippedScripts.length} workspace-specific script(s)`);
  }
  if (removedScripts.length > 0) {
    console.log(`   Removed ${removedScripts.length} incompatible script(s):`);
    removedScripts.forEach((script) => {
      console.log(`     - ${script}`);
    });
  }
}

if (require.main === module) {
  syncScripts();
}
