#!/usr/bin/env tsx
/**
 * Copy scaffold files from prism/apps/web into a consumer apps/web (mode-aware).
 * Static consumers receive only shared config scaffold; server consumers get auth/DB too.
 */

import fs from "fs";
import path from "path";
import {
  discoverPrismAppRoots,
  REQUIRED_LIBRARY_FILES_SERVER,
} from "./assert-app-library-layout";
import { isStaticBuildAppRoot } from "./read-consumer-build-output";

const ALWAYS_COPY_RELATIVE_PATHS = ["library/config/prism-schema.ts"] as const;

const SERVER_ONLY_COPY_RELATIVE_PATHS = [
  "library/authentication/authentication.ts",
  "library/authentication/authentication-gates.ts",
  "library/authentication/authentication-api.ts",
  "library/kysely-shim.ts",
  "config/auth.ts",
] as const;

const SERVER_ONLY_COPY_DIRECTORIES = ["database"] as const;

const STALE_SERVER_SCAFFOLD_PATHS = [
  "library/authentication",
  "database",
  "config/auth.ts",
] as const;

const NEVER_OVERWRITE_RELATIVE_PATHS = ["library/config/index.ts"] as const;

function copyFileIfChanged(source: string, target: string): boolean {
  const sourceContent = fs.readFileSync(source, "utf8");
  if (fs.existsSync(target)) {
    const targetContent = fs.readFileSync(target, "utf8");
    if (targetContent === sourceContent) {
      return false;
    }
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
  }
  fs.writeFileSync(target, sourceContent, "utf8");
  return true;
}

function copyDirectoryRecursive(sourceDir: string, targetDir: string): number {
  let copied = 0;
  if (!fs.existsSync(sourceDir)) {
    return copied;
  }

  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copied += copyDirectoryRecursive(sourcePath, targetPath);
    } else if (entry.isFile()) {
      if (copyFileIfChanged(sourcePath, targetPath)) {
        copied += 1;
      }
    }
  }
  return copied;
}

function reportIndexTsDiffHint(
  referencePath: string,
  consumerPath: string
): void {
  if (!fs.existsSync(referencePath)) {
    return;
  }
  if (!fs.existsSync(consumerPath)) {
    console.log(
      `ℹ️  Manual merge needed: create ${path.basename(consumerPath)} (upstream template changed)`
    );
    return;
  }

  const reference = fs.readFileSync(referencePath, "utf8");
  const consumer = fs.readFileSync(consumerPath, "utf8");
  if (reference !== consumer) {
    console.log(
      `ℹ️  Manual merge needed: library/config/index.ts differs from prism/apps/web — review upstream exports`
    );
  }
}

function reportStaleServerScaffold(appRoot: string): void {
  const stale: string[] = [];
  for (const relativePath of STALE_SERVER_SCAFFOLD_PATHS) {
    if (fs.existsSync(path.join(appRoot, relativePath))) {
      stale.push(relativePath);
    }
  }
  if (stale.length > 0) {
    console.log(
      `ℹ️  Static build: stale server scaffold present (not removed automatically): ${stale.join(", ")}`
    );
  }
}

export function syncScaffoldForAppRoot(
  prismRoot: string,
  appRoot: string
): number {
  const referenceRoot = path.join(prismRoot, "apps", "web");
  if (!fs.existsSync(referenceRoot)) {
    console.warn(`⚠️  Reference app not found: ${referenceRoot}`);
    return 0;
  }

  const isStatic = isStaticBuildAppRoot(appRoot);
  let copiedCount = 0;

  for (const relativePath of ALWAYS_COPY_RELATIVE_PATHS) {
    const source = path.join(referenceRoot, relativePath);
    const target = path.join(appRoot, relativePath);
    if (fs.existsSync(source) && copyFileIfChanged(source, target)) {
      copiedCount += 1;
      console.log(`   📄 ${relativePath}`);
    }
  }

  if (!isStatic) {
    for (const relativePath of SERVER_ONLY_COPY_RELATIVE_PATHS) {
      const source = path.join(referenceRoot, relativePath);
      const target = path.join(appRoot, relativePath);
      if (fs.existsSync(source) && copyFileIfChanged(source, target)) {
        copiedCount += 1;
        console.log(`   📄 ${relativePath}`);
      }
    }

    for (const directory of SERVER_ONLY_COPY_DIRECTORIES) {
      const source = path.join(referenceRoot, directory);
      const target = path.join(appRoot, directory);
      const copied = copyDirectoryRecursive(source, target);
      if (copied > 0) {
        copiedCount += copied;
        console.log(`   📁 ${directory}/ (${copied} file(s))`);
      }
    }
  } else {
    reportStaleServerScaffold(appRoot);
  }

  for (const relativePath of NEVER_OVERWRITE_RELATIVE_PATHS) {
    reportIndexTsDiffHint(
      path.join(referenceRoot, relativePath),
      path.join(appRoot, relativePath)
    );
  }

  return copiedCount;
}

export function syncScaffoldFromPrism(consumerRepoRoot: string): void {
  const prismRoot = path.join(consumerRepoRoot, "prism");
  if (!fs.existsSync(prismRoot)) {
    console.log(
      `ℹ️  No prism/ submodule at ${prismRoot} — skipping scaffold sync`
    );
    return;
  }

  const appRoots = discoverPrismAppRoots(consumerRepoRoot);
  if (appRoots.length === 0) {
    console.log(
      `ℹ️  No config.prism.json under ${consumerRepoRoot} — skipping scaffold sync`
    );
    return;
  }

  console.log("📋 Syncing scaffold from prism/apps/web...\n");
  let totalCopied = 0;
  for (const appRoot of appRoots) {
    const mode = isStaticBuildAppRoot(appRoot) ? "static" : "server";
    console.log(
      `   ${path.relative(consumerRepoRoot, appRoot) || "."} (${mode})`
    );
    totalCopied += syncScaffoldForAppRoot(prismRoot, appRoot);
  }

  if (totalCopied === 0) {
    console.log("\n✅ Scaffold already up to date");
  } else {
    console.log(`\n✅ Scaffold sync complete (${totalCopied} file(s) updated)`);
  }
}

function main(): void {
  const repoRoot = path.resolve(process.argv[2] ?? process.cwd());
  syncScaffoldFromPrism(repoRoot);
}

if (require.main === module) {
  main();
}
