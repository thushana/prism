#!/usr/bin/env tsx
/**
 * Ensure Prism consumer apps use library/ for shared code — never a root lib/ folder.
 * Run from repo root (flat app) or monorepo root (checks apps/web when present).
 */

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

/** Required under each Prism app root (same list as prism generate). */
export const REQUIRED_LIBRARY_FILES = [
  "library/authentication/authentication.ts",
  "library/authentication/authentication-gates.ts",
  "library/authentication/authentication-api.ts",
  "library/kysely-shim.ts",
  "library/config/index.ts",
] as const;

const LEGACY_LIB_IMPORT = /@\/lib\//;
const SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);

function isPrismAppRoot(dir: string): boolean {
  return fs.existsSync(path.join(dir, "config.prism.json"));
}

/** Flat consumer repo root and/or apps/web when config.prism.json exists there. */
export function discoverPrismAppRoots(repoRoot: string): string[] {
  const roots: string[] = [];
  if (isPrismAppRoot(repoRoot)) {
    roots.push(path.resolve(repoRoot));
  }
  const appsWeb = path.join(repoRoot, "apps", "web");
  if (isPrismAppRoot(appsWeb)) {
    roots.push(path.resolve(appsWeb));
  }
  return [...new Set(roots)];
}

export function assertAppUsesLibraryDir(appRoot: string): void {
  const legacyLibDir = path.join(appRoot, "lib");
  if (fs.existsSync(legacyLibDir)) {
    throw new Error(
      `App must not include lib/ — use library/ only. Found: ${legacyLibDir}`
    );
  }

  const missing = REQUIRED_LIBRARY_FILES.filter(
    (relativePath) => !fs.existsSync(path.join(appRoot, relativePath))
  );
  if (missing.length > 0) {
    throw new Error(
      `App is missing required library files under ${appRoot}: ${missing.join(", ")}`
    );
  }
}

function listSourceFiles(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === "prism"
    ) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listSourceFiles(fullPath, files);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

export function assertNoLegacyLibImports(appRoot: string): void {
  const offenders: string[] = [];

  for (const filePath of listSourceFiles(appRoot)) {
    const content = fs.readFileSync(filePath, "utf-8");
    if (LEGACY_LIB_IMPORT.test(content)) {
      offenders.push(path.relative(appRoot, filePath));
    }
  }

  if (offenders.length > 0) {
    throw new Error(
      `Use @/library/ imports instead of @/lib/. Found in: ${offenders.join(", ")}`
    );
  }
}

export function assertPrismAppLibraryLayout(repoRoot: string): void {
  const appRoots = discoverPrismAppRoots(repoRoot);
  if (appRoots.length === 0) {
    return;
  }

  for (const appRoot of appRoots) {
    assertAppUsesLibraryDir(appRoot);
    assertNoLegacyLibImports(appRoot);
  }
}

function main(): void {
  const repoRoot = path.resolve(process.argv[2] ?? process.cwd());
  try {
    assertPrismAppLibraryLayout(repoRoot);
    const appRoots = discoverPrismAppRoots(repoRoot);
    if (appRoots.length === 0) {
      console.log(
        `ℹ️  No config.prism.json under ${repoRoot} — skipping library layout check`
      );
      return;
    }
    console.log(
      `✅ library/ layout OK (${appRoots.map((r) => path.relative(repoRoot, r) || ".").join(", ")})`
    );
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

const entry = process.argv[1];
if (
  entry &&
  import.meta.url === pathToFileURL(path.resolve(entry)).href
) {
  main();
}
