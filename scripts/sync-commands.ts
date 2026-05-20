#!/usr/bin/env tsx
/**
 * Symlink parent `.cursor/commands` → `prism/.cursor/commands/`.
 * Cursor indexes the directory symlink and lists all prism command .md files in `/`.
 */

import fs from "fs";
import path from "path";

const scriptDir = __dirname;
const isInPrism =
  path.basename(path.dirname(scriptDir)) === "prism" ||
  path.basename(scriptDir) === "prism";

const PRISM_DIR = isInPrism
  ? path.join(scriptDir, "..")
  : path.join(scriptDir, "../prism");
const PARENT_DIR = isInPrism
  ? path.join(PRISM_DIR, "..")
  : path.join(scriptDir, "..");

const PRISM_COMMANDS_DIR = path.join(PRISM_DIR, ".cursor", "commands");
const PARENT_COMMANDS_LINK = path.join(PARENT_DIR, ".cursor", "commands");

function syncCommands(): void {
  if (!fs.existsSync(PRISM_DIR)) {
    console.error(`❌ Prism directory not found at: ${PRISM_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(PRISM_COMMANDS_DIR)) {
    fs.mkdirSync(PRISM_COMMANDS_DIR, { recursive: true });
    console.log(`✅ Created ${PRISM_COMMANDS_DIR}`);
  }

  const parentCursorDir = path.dirname(PARENT_COMMANDS_LINK);
  if (!fs.existsSync(parentCursorDir)) {
    fs.mkdirSync(parentCursorDir, { recursive: true });
  }

  if (fs.existsSync(PARENT_COMMANDS_LINK)) {
    const stats = fs.lstatSync(PARENT_COMMANDS_LINK);
    if (stats.isSymbolicLink()) {
      const target = fs.readlinkSync(PARENT_COMMANDS_LINK);
      const resolvedTarget = path.resolve(
        path.dirname(PARENT_COMMANDS_LINK),
        target
      );
      const resolvedPrismCommands = path.resolve(PRISM_COMMANDS_DIR);
      if (resolvedTarget === resolvedPrismCommands) {
        console.log("✅ commands symlink already points at prism");
        return;
      }
      fs.unlinkSync(PARENT_COMMANDS_LINK);
    } else {
      console.error(
        `❌ ${PARENT_COMMANDS_LINK} exists and is not a symlink (remove it first)`
      );
      process.exit(1);
    }
  }

  const relativePath = path.relative(
    path.dirname(PARENT_COMMANDS_LINK),
    PRISM_COMMANDS_DIR
  );
  fs.symlinkSync(relativePath, PARENT_COMMANDS_LINK, "dir");
  console.log(`✅ ${PARENT_COMMANDS_LINK} → ${PRISM_COMMANDS_DIR}`);
}

if (require.main === module) {
  syncCommands();
}
