#!/usr/bin/env tsx
/**
 * Aligns selected dependency ranges in the parent app package.json with
 * prism/apps/web (canonical Next.js app in the monorepo).
 *
 * Default: dry-run (report drift only). Pass --update to write the root manifest.
 */

import fs from "fs";
import path from "path";

const scriptDir = __dirname;
const isInPrism =
  path.basename(path.dirname(scriptDir)) === "prism" ||
  path.basename(scriptDir) === "prism";

let APP_ROOT: string;
let PRISM_ROOT: string;

if (isInPrism) {
  PRISM_ROOT = path.join(scriptDir, "..");
  APP_ROOT = path.join(PRISM_ROOT, "..");
} else {
  APP_ROOT = path.join(scriptDir, "..");
  PRISM_ROOT = path.join(APP_ROOT, "prism");
}

const WEB_PACKAGE_JSON = path.join(PRISM_ROOT, "apps/web/package.json");
const ROOT_PACKAGE_JSON = path.join(APP_ROOT, "package.json");

/** Dependency keys in web `dependencies` mirrored to root `dependencies`. */
const SYNC_DEPENDENCIES = [
  "next",
  "react",
  "react-dom",
  "@radix-ui/react-slot",
  "dotenv",
  "drizzle-orm",
  "flags",
  "zod",
] as const;

/** Dependency keys in web `devDependencies` mirrored to root `devDependencies`. */
const SYNC_DEV_DEPENDENCIES = [
  "@tailwindcss/postcss",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "commander",
  "drizzle-kit",
  "@eslint/compat",
  "eslint",
  "eslint-config-next",
  "lightningcss",
  "postcss-import",
  "prettier",
  "tailwindcss",
  "tsx",
  "tw-animate-css",
  "typescript",
  "vitest",
  "@vitest/ui",
] as const;

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

function readJson(filePath: string): PackageJson {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as PackageJson;
}

function writeJson(filePath: string, data: PackageJson): void {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function syncDeps(update: boolean): void {
  if (!fs.existsSync(WEB_PACKAGE_JSON)) {
    console.error(`❌ Web package.json not found: ${WEB_PACKAGE_JSON}`);
    process.exit(1);
  }
  if (!fs.existsSync(ROOT_PACKAGE_JSON)) {
    console.error(`❌ Root package.json not found: ${ROOT_PACKAGE_JSON}`);
    process.exit(1);
  }

  const web = readJson(WEB_PACKAGE_JSON);
  const root = readJson(ROOT_PACKAGE_JSON);

  const webDeps = web.dependencies ?? {};
  const webDevDeps = web.devDependencies ?? {};
  const rootDeps = { ...(root.dependencies ?? {}) };
  const rootDevDeps = { ...(root.devDependencies ?? {}) };

  const drift: string[] = [];
  const skipped: string[] = [];

  for (const name of SYNC_DEPENDENCIES) {
    const source = webDeps[name];
    if (source === undefined) {
      skipped.push(`${name} (not in web dependencies — skipped)`);
      continue;
    }
    const current = rootDeps[name];
    if (current !== source) {
      drift.push(`dependencies.${name}: root "${current ?? "(missing)"}" → web "${source}"`);
      if (update) {
        rootDeps[name] = source;
      }
    }
  }

  for (const name of SYNC_DEV_DEPENDENCIES) {
    const source = webDevDeps[name];
    if (source === undefined) {
      skipped.push(`${name} (not in web devDependencies — skipped)`);
      continue;
    }
    const current = rootDevDeps[name];
    if (current !== source) {
      drift.push(
        `devDependencies.${name}: root "${current ?? "(missing)"}" → web "${source}"`,
      );
      if (update) {
        rootDevDeps[name] = source;
      }
    }
  }

  if (skipped.length > 0) {
    console.log("ℹ️  Allowlisted packages not present in web (left unchanged):\n");
    for (const line of skipped) {
      console.log(`   - ${line}`);
    }
    console.log("");
  }

  if (drift.length === 0) {
    console.log("✅ Dependency ranges already match prism/apps/web.");
    return;
  }

  console.log(
    update
      ? "📝 Applying updates from prism/apps/web:\n"
      : "⚠️  Drift vs prism/apps/web (run with --update to apply):\n",
  );
  for (const line of drift) {
    console.log(`   - ${line}`);
  }
  console.log("");

  if (update) {
    root.dependencies = rootDeps;
    root.devDependencies = rootDevDeps;
    writeJson(ROOT_PACKAGE_JSON, root);
    console.log(`✅ Updated ${ROOT_PACKAGE_JSON}`);
  }
}

const update = process.argv.includes("--update");

syncDeps(update);
