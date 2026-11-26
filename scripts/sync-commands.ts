#!/usr/bin/env tsx
/**
 * Copy prism/.cursor/skills into the parent .cursor/skills.
 * Cursor often skips instructions that live only inside the submodule.
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

const PRISM_SKILLS_DIR = path.join(PRISM_DIR, ".cursor", "skills");
const PARENT_SKILLS_DIR = path.join(PARENT_DIR, ".cursor", "skills");
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
    return fs.realpathSync(prismAtParent) === fs.realpathSync(PRISM_DIR);
  } catch {
    return false;
  }
}

function listSkillNames(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir).filter((name) => {
    return fs.existsSync(path.join(dir, name, "SKILL.md"));
  });
}

function skillsNeedSync(skillNames: string[]): boolean {
  if (!fs.existsSync(PARENT_SKILLS_DIR)) {
    return true;
  }

  const parentStats = fs.lstatSync(PARENT_SKILLS_DIR);
  if (parentStats.isSymbolicLink() || !parentStats.isDirectory()) {
    return true;
  }

  const parentNames = listSkillNames(PARENT_SKILLS_DIR);
  if (parentNames.length !== skillNames.length) {
    return true;
  }

  for (const name of skillNames) {
    const sourcePath = path.join(PRISM_SKILLS_DIR, name, "SKILL.md");
    const destPath = path.join(PARENT_SKILLS_DIR, name, "SKILL.md");
    if (!fs.existsSync(destPath)) {
      return true;
    }
    if (fs.statSync(sourcePath).mtimeMs > fs.statSync(destPath).mtimeMs) {
      return true;
    }
  }

  return false;
}

function removeDir(target: string): void {
  if (!fs.existsSync(target)) {
    return;
  }
  const stats = fs.lstatSync(target);
  if (stats.isSymbolicLink()) {
    fs.unlinkSync(target);
    return;
  }
  if (stats.isDirectory()) {
    fs.rmSync(target, { recursive: true, force: true });
    return;
  }
  console.error(`❌ ${target} exists and is not a directory or symlink`);
  process.exit(1);
}

function prismStillHasCommands(): boolean {
  if (!fs.existsSync(PRISM_COMMANDS_DIR)) {
    return false;
  }
  return fs
    .readdirSync(PRISM_COMMANDS_DIR)
    .some((name) => name.endsWith(".md"));
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
      console.log(
        "ℹ️  Skipping Cursor skills sync (not a Prism consumer app root)"
      );
    }
    return;
  }

  if (!prismStillHasCommands()) {
    removeDir(PARENT_COMMANDS_DIR);
  }

  const skillNames = listSkillNames(PRISM_SKILLS_DIR);
  if (skillNames.length === 0) {
    if (!quiet) {
      console.warn(`⚠️  No skills in ${PRISM_SKILLS_DIR}`);
    }
    return;
  }

  if (!force && !skillsNeedSync(skillNames)) {
    if (!quiet) {
      console.log("✅ Cursor skills already up to date");
    }
    return;
  }

  const parentCursorDir = path.dirname(PARENT_SKILLS_DIR);
  if (!fs.existsSync(parentCursorDir)) {
    fs.mkdirSync(parentCursorDir, { recursive: true });
  }

  removeDir(PARENT_SKILLS_DIR);
  fs.mkdirSync(PARENT_SKILLS_DIR, { recursive: true });

  for (const name of skillNames) {
    const sourceDir = path.join(PRISM_SKILLS_DIR, name);
    const destDir = path.join(PARENT_SKILLS_DIR, name);
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(
      path.join(sourceDir, "SKILL.md"),
      path.join(destDir, "SKILL.md")
    );
  }

  if (!quiet) {
    console.log(
      `✅ Copied ${skillNames.length} skill(s) to ${PARENT_SKILLS_DIR}`
    );
  }
}

if (require.main === module) {
  const quiet = process.argv.includes("--quiet");
  syncCommands({ quiet });
}
