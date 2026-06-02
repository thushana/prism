#!/usr/bin/env tsx
/**
 * Copy prism/.cursor/commands/*.md into parent .cursor/commands/.
 * Cursor's slash-command indexer often skips symlinked command dirs; use real files.
 *
 * Re-runs when prism sources are newer than the parent copy (or after submodule updates).
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

export type SyncCommandsOptions = {
  /** Copy even when parent files look current */
  force?: boolean;
  /** No log when already up to date; exit 0 if prism missing (e.g. prepare before submodule init) */
  quiet?: boolean;
};

function isConsumerAppRoot(): boolean {
  if (!fs.existsSync(path.join(PARENT_DIR, "package.json"))) {
    return false;
  }
  const prismAtParent = path.join(PARENT_DIR, "prism");
  if (!fs.existsSync(prismAtParent)) {
    return false;
  }
  try {
    return (
      fs.realpathSync(prismAtParent) === fs.realpathSync(PRISM_DIR)
    );
  } catch {
    return false;
  }
}

function listCommandMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir).filter((name) => name.endsWith(".md"));
}

function commandsNeedSync(sourceFiles: string[]): boolean {
  if (!fs.existsSync(PARENT_COMMANDS_DIR)) {
    return true;
  }

  const parentStats = fs.lstatSync(PARENT_COMMANDS_DIR);
  if (parentStats.isSymbolicLink()) {
    return true;
  }
  if (!parentStats.isDirectory()) {
    return true;
  }

  const parentFiles = listCommandMarkdownFiles(PARENT_COMMANDS_DIR);
  if (parentFiles.length !== sourceFiles.length) {
    return true;
  }

  for (const name of sourceFiles) {
    const sourcePath = path.join(PRISM_COMMANDS_DIR, name);
    const destPath = path.join(PARENT_COMMANDS_DIR, name);
    if (!fs.existsSync(destPath)) {
      return true;
    }
    const sourceMtime = fs.statSync(sourcePath).mtimeMs;
    const destMtime = fs.statSync(destPath).mtimeMs;
    if (sourceMtime > destMtime) {
      return true;
    }
  }

  return false;
}

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

export function syncCommands(options: SyncCommandsOptions = {}): void {
  const { force = false, quiet = false } = options;

  if (process.env.CI === "true" || process.env.VERCEL === "1") {
    return;
  }

  if (!fs.existsSync(PRISM_DIR)) {
    if (!quiet) {
      console.warn(`⚠️  Prism directory not found at: ${PRISM_DIR}`);
    }
    return;
  }

  if (!isConsumerAppRoot()) {
    if (!quiet) {
      console.log("ℹ️  Skipping Cursor commands sync (not a Prism consumer app root)");
    }
    return;
  }

  if (!fs.existsSync(PRISM_COMMANDS_DIR)) {
    fs.mkdirSync(PRISM_COMMANDS_DIR, { recursive: true });
    if (!quiet) {
      console.log(`✅ Created ${PRISM_COMMANDS_DIR}`);
    }
  }

  const sourceFiles = listCommandMarkdownFiles(PRISM_COMMANDS_DIR);
  if (sourceFiles.length === 0) {
    if (!quiet) {
      console.warn(`⚠️  No .md files in ${PRISM_COMMANDS_DIR}`);
    }
    return;
  }

  if (!force && !commandsNeedSync(sourceFiles)) {
    if (!quiet) {
      console.log("✅ Cursor commands already up to date");
    }
    return;
  }

  const parentCursorDir = path.dirname(PARENT_COMMANDS_DIR);
  if (!fs.existsSync(parentCursorDir)) {
    fs.mkdirSync(parentCursorDir, { recursive: true });
  }

  removeParentCommandsDir();
  fs.mkdirSync(PARENT_COMMANDS_DIR, { recursive: true });

  for (const name of sourceFiles) {
    fs.copyFileSync(
      path.join(PRISM_COMMANDS_DIR, name),
      path.join(PARENT_COMMANDS_DIR, name)
    );
  }

  if (!quiet) {
    console.log(
      `✅ Copied ${sourceFiles.length} command file(s) to ${PARENT_COMMANDS_DIR}`
    );
  }
}

if (require.main === module) {
  const quiet = process.argv.includes("--quiet");
  syncCommands({ quiet });
}
