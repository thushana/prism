#!/usr/bin/env tsx
/**
 * Create symlink from parent project's .cursor/commands/ to prism/.cursor/commands/
 * This allows the parent project to use cursor commands defined in prism
 */

import fs from "fs";
import path from "path";

// Detect if we're running from prism or parent project
const scriptDir = __dirname;
const isInPrism = path.basename(path.dirname(scriptDir)) === "prism" || 
                  path.basename(scriptDir) === "prism";

let PRISM_DIR: string;
let PARENT_DIR: string;
let PRISM_COMMANDS_DIR: string;
let PARENT_COMMANDS_DIR: string;

if (isInPrism) {
  // Running from inside prism - link to parent
  PRISM_DIR = path.join(scriptDir, "..");
  PARENT_DIR = path.join(PRISM_DIR, "..");
  PRISM_COMMANDS_DIR = path.join(PRISM_DIR, ".cursor", "commands");
  PARENT_COMMANDS_DIR = path.join(PARENT_DIR, ".cursor", "commands");
} else {
  // Running from parent project - link from prism
  PRISM_DIR = path.join(scriptDir, "../prism");
  PARENT_DIR = path.join(scriptDir, "..");
  PRISM_COMMANDS_DIR = path.join(PRISM_DIR, ".cursor", "commands");
  PARENT_COMMANDS_DIR = path.join(PARENT_DIR, ".cursor", "commands");
}

function syncCommands(): void {
  // Check if prism directory exists
  if (!fs.existsSync(PRISM_DIR)) {
    console.error(`❌ Prism directory not found at: ${PRISM_DIR}`);
    process.exit(1);
  }

  // Check if prism commands directory exists
  if (!fs.existsSync(PRISM_COMMANDS_DIR)) {
    console.log(`ℹ️  Prism commands directory not found at: ${PRISM_COMMANDS_DIR}`);
    console.log(`   Creating directory...`);
    fs.mkdirSync(PRISM_COMMANDS_DIR, { recursive: true });
    console.log(`✅ Created prism commands directory`);
  }

  // Ensure parent .cursor directory exists
  const parentCursorDir = path.dirname(PARENT_COMMANDS_DIR);
  if (!fs.existsSync(parentCursorDir)) {
    console.log(`ℹ️  Creating .cursor directory in parent project...`);
    fs.mkdirSync(parentCursorDir, { recursive: true });
  }

  // Check if symlink already exists
  if (fs.existsSync(PARENT_COMMANDS_DIR)) {
    try {
      const stats = fs.lstatSync(PARENT_COMMANDS_DIR);
      if (stats.isSymbolicLink()) {
        const target = fs.readlinkSync(PARENT_COMMANDS_DIR);
        const resolvedTarget = path.resolve(path.dirname(PARENT_COMMANDS_DIR), target);
        const resolvedPrismCommands = path.resolve(PRISM_COMMANDS_DIR);
        
        if (resolvedTarget === resolvedPrismCommands) {
          console.log("✅ Symlink already exists and points to correct location");
          return;
        } else {
          console.log(`⚠️  Symlink exists but points to different location: ${target}`);
          console.log(`   Removing old symlink...`);
          fs.unlinkSync(PARENT_COMMANDS_DIR);
        }
      } else {
        console.log(`⚠️  ${PARENT_COMMANDS_DIR} exists but is not a symlink`);
        console.log(`   It's a ${stats.isDirectory() ? "directory" : "file"}`);
        console.log(`   Please remove it manually if you want to create a symlink`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Error checking existing symlink: ${error}`);
      process.exit(1);
    }
  }

  // Create symlink
  try {
    // Use relative path for the symlink
    const relativePath = path.relative(
      path.dirname(PARENT_COMMANDS_DIR),
      PRISM_COMMANDS_DIR
    );

    fs.symlinkSync(relativePath, PARENT_COMMANDS_DIR, "dir");
    console.log(`✅ Created symlink: ${PARENT_COMMANDS_DIR} -> ${PRISM_COMMANDS_DIR}`);
  } catch (error) {
    console.error(`❌ Failed to create symlink: ${error}`);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  syncCommands();
}
