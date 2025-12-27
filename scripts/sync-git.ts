#!/usr/bin/env tsx
/**
 * Pull latest changes from prism git repository
 * Can be run from parent project to update the prism submodule/subtree
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Detect if we're running from prism or parent project
const scriptDir = __dirname;
const isInPrism = path.basename(path.dirname(scriptDir)) === "prism" || 
                  path.basename(scriptDir) === "prism";

let PRISM_DIR: string;

if (isInPrism) {
  // Running from inside prism - just pull
  PRISM_DIR = path.join(scriptDir, "..");
} else {
  // Running from parent project - update prism submodule
  PRISM_DIR = path.join(scriptDir, "../prism");
}

function syncGit(): void {
  if (!fs.existsSync(PRISM_DIR)) {
    console.error(`❌ Prism directory not found at: ${PRISM_DIR}`);
    process.exit(1);
  }

  const gitDir = path.join(PRISM_DIR, ".git");
  const isSubmodule = fs.existsSync(gitDir) && fs.statSync(gitDir).isFile();

  try {
    if (isInPrism) {
      // Running from inside prism - just pull
      console.log("📥 Pulling latest changes from prism repository...");
      execSync("git pull", { 
        cwd: PRISM_DIR, 
        stdio: "inherit" 
      });
      console.log("✅ Prism repository updated");
    } else {
      // Running from parent - update submodule
      console.log("📥 Updating prism submodule...");
      
      // Check if it's a git submodule
      if (isSubmodule) {
        execSync("git submodule update --remote --merge prism", {
          cwd: path.dirname(PRISM_DIR),
          stdio: "inherit"
        });
      } else {
        // Regular git repo, just pull
        execSync("git pull", {
          cwd: PRISM_DIR,
          stdio: "inherit"
        });
      }
      console.log("✅ Prism submodule updated");
    }
  } catch (error) {
    console.error("❌ Failed to sync prism git repository");
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  syncGit();
}
