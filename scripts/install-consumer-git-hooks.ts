#!/usr/bin/env tsx
/**
 * Ensure Prism consumer Husky hooks (.husky/pre-commit, .husky/post-merge).
 * Husky is the supported standard (see TimeTraveler); no .githooks fallback.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { ensureConsumerHusky } from "./consumer-husky";

const scriptDir = __dirname;
const isInPrism =
  path.basename(path.dirname(scriptDir)) === "prism" ||
  path.basename(scriptDir) === "prism";

const APP_ROOT = isInPrism
  ? path.join(scriptDir, "../..")
  : path.join(scriptDir, "..");

function clearLegacyGithooks(appRoot: string): void {
  const githooksDir = path.join(appRoot, ".githooks");
  if (fs.existsSync(githooksDir)) {
    fs.rmSync(githooksDir, { recursive: true, force: true });
  }
  try {
    const hooksPath = execSync("git config --get core.hooksPath", {
      cwd: appRoot,
      encoding: "utf-8",
    }).trim();
    if (hooksPath === ".githooks") {
      execSync("git config --unset core.hooksPath", { cwd: appRoot });
    }
  } catch {
    // unset
  }
}

function assertHuskyDependency(appRoot: string): void {
  const packageJsonPath = path.join(appRoot, "package.json");
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as {
    devDependencies?: Record<string, string>;
  };
  if (!pkg.devDependencies?.husky) {
    console.error(
      "❌ husky is required in devDependencies (Prism consumer standard). Add husky ^9 and prepare: \"husky\"."
    );
    process.exit(1);
  }
}

export function installConsumerGitHooks(appRoot: string = APP_ROOT): void {
  if (!fs.existsSync(path.join(appRoot, "prism"))) {
    return;
  }

  assertHuskyDependency(appRoot);
  clearLegacyGithooks(appRoot);
  ensureConsumerHusky(appRoot);

  if (process.env.CI !== "true" && process.env.VERCEL !== "1") {
    execSync("pnpm exec husky", { cwd: appRoot, stdio: "inherit" });
  }

  console.log(
    "✅ Husky: .husky/pre-commit (lint-staged) + .husky/post-merge (sync commands)"
  );
}

if (require.main === module) {
  installConsumerGitHooks();
}
