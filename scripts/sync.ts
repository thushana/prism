#!/usr/bin/env tsx
/**
 * Orchestrates the full Prism sync pipeline for a child application:
 * 1. Submodule (sync-git)
 * 2. Package scripts from Prism workspace into parent (sync-scripts)
 * 3. Cursor commands (sync-commands)
 * 4. Parent package.json dependency ranges vs apps/web (sync-dependencies --update)
 * 5. pnpm install in parent, then in prism/
 *
 * See docs/SYNC-Prism.md for overview; this file is the source of truth for step order.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const scriptDir = __dirname;
const isInPrism =
  path.basename(path.dirname(scriptDir)) === "prism" ||
  path.basename(scriptDir) === "prism";

// Determine paths for app root and prism root
let APP_ROOT: string;
let PRISM_ROOT: string;

if (isInPrism) {
  // Running from inside prism - parent is app root
  PRISM_ROOT = path.join(scriptDir, "..");
  APP_ROOT = path.join(PRISM_ROOT, "..");
} else {
  // Running from parent project - current dir is app root
  APP_ROOT = path.join(scriptDir, "..");
  PRISM_ROOT = path.join(APP_ROOT, "prism");
}

function sync(): void {
  console.log("🔄 Syncing prism (git + scripts + commands)...\n");

  try {
    // First sync git
    console.log("Step 1: Syncing git repository...\n");
    const syncGitPath = path.join(scriptDir, "sync-git.ts");
    execSync(`tsx ${syncGitPath}`, { stdio: "inherit" });

    console.log("\n");

    // Then sync scripts
    console.log("Step 2: Syncing scripts...\n");
    const syncScriptsPath = path.join(scriptDir, "sync-scripts.ts");
    execSync(`tsx ${syncScriptsPath}`, { stdio: "inherit" });

    console.log("\n");

    // Finally sync commands
    console.log("Step 3: Syncing cursor commands...\n");
    const syncCommandsPath = path.join(scriptDir, "sync-commands.ts");
    execSync(`tsx ${syncCommandsPath}`, { stdio: "inherit" });

    console.log("\n");

    // Align root dependency ranges with prism/apps/web
    console.log("Step 4: Syncing dependency versions to app root...\n");
    const synchronizeDependenciesScriptPath = path.join(
      scriptDir,
      "sync-dependencies.ts"
    );
    execSync(`tsx ${synchronizeDependenciesScriptPath} --update`, {
      stdio: "inherit",
    });

    console.log("\n");

    // Install dependencies in app root
    console.log("Step 5: Installing dependencies in app...\n");
    if (fs.existsSync(path.join(APP_ROOT, "package.json"))) {
      execSync("pnpm install", {
        cwd: APP_ROOT,
        stdio: "inherit",
      });
    } else {
      console.log("   ⚠️  No package.json found in app root, skipping...");
    }

    console.log("\n");

    // Install dependencies in prism root
    console.log("Step 6: Installing dependencies in prism...\n");
    if (fs.existsSync(path.join(PRISM_ROOT, "package.json"))) {
      execSync("pnpm install", {
        cwd: PRISM_ROOT,
        stdio: "inherit",
      });
    } else {
      console.log("   ⚠️  No package.json found in prism root, skipping...");
    }

    console.log("\n✅ Prism sync complete!");
  } catch (error) {
    console.error("❌ Sync failed");
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  sync();
}
