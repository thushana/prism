#!/usr/bin/env tsx
/**
 * Copy prism/.cursor/commands/*.md into parent .cursor/commands/.
 * Cursor's slash-command indexer often skips symlinked command dirs; use real files.
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
const PARENT_COMMANDS_DIR = path.join(PARENT_DIR, ".cursor", "commands");

function removeParentCommandsDir(): void {
  if (!fs.existsSync(PARENT_COMMANDS_DIR)) {
    return;
  }
  const stats = fs.lstatSync(PARENT_COMMANDS_DIR);
  if (stats.isSymbolicLink()) {
    fs.unlinkSync(PARENT_COMMANDS_DIR);
    return;
  }
  if (stats.isDirectory()) {
    fs.rmSync(PARENT_COMMANDS_DIR, { recursive: true, force: true });
    return;
  }
  console.error(
    `❌ ${PARENT_COMMANDS_DIR} exists and is not a directory or symlink`
  );
  process.exit(1);
}

function syncCommands(): void {
  if (!fs.existsSync(PRISM_DIR)) {
    console.error(`❌ Prism directory not found at: ${PRISM_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(PRISM_COMMANDS_DIR)) {
    fs.mkdirSync(PRISM_COMMANDS_DIR, { recursive: true });
    console.log(`✅ Created ${PRISM_COMMANDS_DIR}`);
  }

  const parentCursorDir = path.dirname(PARENT_COMMANDS_DIR);
  if (!fs.existsSync(parentCursorDir)) {
    fs.mkdirSync(parentCursorDir, { recursive: true });
  }

  const sourceFiles = fs
    .readdirSync(PRISM_COMMANDS_DIR)
    .filter((name) => name.endsWith(".md"));

  if (sourceFiles.length === 0) {
    console.warn(`⚠️  No .md files in ${PRISM_COMMANDS_DIR}`);
  }

  removeParentCommandsDir();
  fs.mkdirSync(PARENT_COMMANDS_DIR, { recursive: true });

  for (const name of sourceFiles) {
    fs.copyFileSync(
      path.join(PRISM_COMMANDS_DIR, name),
      path.join(PARENT_COMMANDS_DIR, name)
    );
  }

  console.log(
    `✅ Copied ${sourceFiles.length} command file(s) to ${PARENT_COMMANDS_DIR}`
  );
}

if (require.main === module) {
  syncCommands();
}
