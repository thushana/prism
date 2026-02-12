#!/usr/bin/env tsx
/**
 * Run typecheck in every Prism workspace that has a tsconfig.json.
 * Prism-wide: no need for each package to define a typecheck script.
 * New packages with tsconfig.json are included automatically.
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
  const tsconfigPath = path.join(dir, "tsconfig.json");
  if (!fs.existsSync(tsconfigPath)) continue;

  const name = path.basename(dir);
  try {
    execSync("npx tsc --noEmit", { cwd: dir, stdio: "inherit" });
  } catch {
    failed = true;
  }
}

if (failed) process.exit(1);
