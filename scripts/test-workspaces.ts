#!/usr/bin/env tsx
/**
 * Run tests in every Prism workspace that has a vitest config or test:run script.
 * Prism-wide: workspaces with vitest.config.ts are run automatically.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const rootDir = path.join(__dirname, "..");
const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const workspaces: string[] = packageJson.workspaces ?? [];

const expanded: string[] = [];
for (const w of workspaces) {
  if (w.endsWith("/*")) {
    const base = w.slice(0, -2);
    const dir = path.join(rootDir, base);
    if (fs.existsSync(dir)) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory() && !e.name.startsWith(".")) {
          expanded.push(path.join(base, e.name));
        }
      }
    }
  } else {
    expanded.push(w);
  }
}

let failed = false;
for (const workspace of expanded) {
  const dir = path.join(rootDir, workspace);
  const hasVitestConfig =
    fs.existsSync(path.join(dir, "vitest.config.ts")) ||
    fs.existsSync(path.join(dir, "vitest.config.js"));
  const pkgPath = path.join(dir, "package.json");
  const hasTestRun =
    fs.existsSync(pkgPath) &&
    JSON.parse(fs.readFileSync(pkgPath, "utf-8")).scripts?.["test:run"];

  if (!hasVitestConfig && !hasTestRun) continue;

  try {
    execSync("npx vitest run", { cwd: dir, stdio: "inherit" });
  } catch {
    failed = true;
  }
}

if (failed) process.exit(1);
