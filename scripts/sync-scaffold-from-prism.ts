#!/usr/bin/env tsx
/**
 * Copy scaffold files from prism/apps/web into a consumer app (mode-aware).
 *
 * Shards (default = safe):
 * - Always overwrite: prism-schema + Better Auth Drizzle schema
 * - Seed if missing: auth wiring, kysely shim, db client/config, sample seeds
 * - Never overwrite (diff hint): domain schema, existing seeds, app config index,
 *   and any already-customized auth/db wiring
 *
 * Pass `--only=auth-schema` to sync only `database/schema/auth.ts`.
 * Pass `--diff` to print planned writes without writing.
 */

import fs from "fs";
import path from "path";
import { discoverPrismAppRoots } from "./assert-app-library-layout";
import { isStaticBuildAppRoot } from "./read-consumer-build-output";

const ALWAYS_COPY_RELATIVE_PATHS = ["library/config/prism-schema.ts"] as const;

/** Prism-owned; safe to overwrite on every sync (Better Auth lockstep). */
const SERVER_ONLY_OVERWRITE_RELATIVE_PATHS = [
  "database/schema/auth.ts",
] as const;

/**
 * Seed once for new apps. Never clobber consumer customizations afterward —
 * report drift via NEVER_OVERWRITE hints instead.
 */
const SERVER_ONLY_SEED_IF_MISSING_RELATIVE_PATHS = [
  "library/authentication/authentication.ts",
  "library/authentication/authentication-gates.ts",
  "library/authentication/authentication-api.ts",
  "library/kysely-shim.ts",
  "config/auth.ts",
  "database/db.ts",
  "database/drizzle.config.ts",
  "database/seed.ts",
  "database/seed-admin.ts",
] as const;

const STALE_SERVER_SCAFFOLD_PATHS = [
  "library/authentication",
  "database",
  "config/auth.ts",
] as const;

/** Domain / customized paths: never overwrite; print a merge hint when drifted. */
const NEVER_OVERWRITE_RELATIVE_PATHS = [
  "library/config/index.ts",
  "database/schema.ts",
  "database/seed.ts",
  "database/seed-admin.ts",
  "database/db.ts",
  "database/drizzle.config.ts",
  "config/auth.ts",
  "library/authentication/authentication.ts",
  "library/authentication/authentication-gates.ts",
  "library/authentication/authentication-api.ts",
] as const;

type ScaffoldOnly = "safe" | "auth-schema";

type ScaffoldOptions = {
  only: ScaffoldOnly;
  diffOnly: boolean;
};

function parseScaffoldOptions(argv: string[]): ScaffoldOptions {
  let only: ScaffoldOnly = "safe";
  let diffOnly = false;

  for (const arg of argv) {
    if (arg === "--diff") {
      diffOnly = true;
      continue;
    }
    if (arg.startsWith("--only=")) {
      const value = arg.slice("--only=".length);
      if (value === "auth-schema" || value === "safe") {
        only = value;
        continue;
      }
      throw new Error(
        `Unknown --only=${value}. Use --only=safe or --only=auth-schema.`
      );
    }
  }

  return { only, diffOnly };
}

function copyFileIfChanged(
  source: string,
  target: string,
  options: { seedIfMissing?: boolean; diffOnly?: boolean } = {}
): boolean {
  const sourceContent = fs.readFileSync(source, "utf8");
  const exists = fs.existsSync(target);

  if (exists) {
    if (options.seedIfMissing) {
      return false;
    }
    const targetContent = fs.readFileSync(target, "utf8");
    if (targetContent === sourceContent) {
      return false;
    }
  } else {
    if (options.diffOnly) {
      return true;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
  }

  if (options.diffOnly) {
    return true;
  }

  fs.writeFileSync(target, sourceContent, "utf8");
  return true;
}

function reportScaffoldDiffHint(
  relativePath: string,
  referencePath: string,
  consumerPath: string
): void {
  if (!fs.existsSync(referencePath)) {
    return;
  }
  if (!fs.existsSync(consumerPath)) {
    console.log(
      `ℹ️  Manual merge needed: create ${relativePath} (upstream template missing locally)`
    );
    return;
  }

  const reference = fs.readFileSync(referencePath, "utf8");
  const consumer = fs.readFileSync(consumerPath, "utf8");
  if (reference !== consumer) {
    console.log(
      `ℹ️  Manual merge needed: ${relativePath} differs from prism/apps/web — review upstream`
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
  appRoot: string,
  options: ScaffoldOptions = { only: "safe", diffOnly: false }
): number {
  const referenceRoot = path.join(prismRoot, "apps", "web");
  if (!fs.existsSync(referenceRoot)) {
    console.warn(`⚠️  Reference app not found: ${referenceRoot}`);
    return 0;
  }

  const isStatic = isStaticBuildAppRoot(appRoot);
  let copiedCount = 0;
  const action = options.diffOnly ? "would update" : "updated";

  if (options.only === "auth-schema") {
    if (isStatic) {
      console.log("   ℹ️  Static build: skipping auth-schema shard");
      return 0;
    }
    const relativePath = "database/schema/auth.ts";
    const source = path.join(referenceRoot, relativePath);
    const target = path.join(appRoot, relativePath);
    if (fs.existsSync(source) && copyFileIfChanged(source, target, options)) {
      copiedCount += 1;
      console.log(`   📄 ${relativePath} (${action})`);
    }
    return copiedCount;
  }

  for (const relativePath of ALWAYS_COPY_RELATIVE_PATHS) {
    const source = path.join(referenceRoot, relativePath);
    const target = path.join(appRoot, relativePath);
    if (
      fs.existsSync(source) &&
      copyFileIfChanged(source, target, { diffOnly: options.diffOnly })
    ) {
      copiedCount += 1;
      console.log(`   📄 ${relativePath} (${action})`);
    }
  }

  if (!isStatic) {
    for (const relativePath of SERVER_ONLY_OVERWRITE_RELATIVE_PATHS) {
      const source = path.join(referenceRoot, relativePath);
      const target = path.join(appRoot, relativePath);
      if (
        fs.existsSync(source) &&
        copyFileIfChanged(source, target, { diffOnly: options.diffOnly })
      ) {
        copiedCount += 1;
        console.log(`   📄 ${relativePath} (${action})`);
      }
    }

    for (const relativePath of SERVER_ONLY_SEED_IF_MISSING_RELATIVE_PATHS) {
      const source = path.join(referenceRoot, relativePath);
      const target = path.join(appRoot, relativePath);
      if (
        fs.existsSync(source) &&
        copyFileIfChanged(source, target, {
          seedIfMissing: true,
          diffOnly: options.diffOnly,
        })
      ) {
        copiedCount += 1;
        console.log(`   📄 ${relativePath} (seeded)`);
      }
    }
  } else {
    reportStaleServerScaffold(appRoot);
  }

  for (const relativePath of NEVER_OVERWRITE_RELATIVE_PATHS) {
    reportScaffoldDiffHint(
      relativePath,
      path.join(referenceRoot, relativePath),
      path.join(appRoot, relativePath)
    );
  }

  return copiedCount;
}

export function syncScaffoldFromPrism(
  consumerRepoRoot: string,
  options: ScaffoldOptions = { only: "safe", diffOnly: false }
): void {
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

  const modeLabel = options.diffOnly ? " (diff only)" : "";
  console.log(
    `📋 Syncing scaffold from prism/apps/web [${options.only}]${modeLabel}...\n`
  );
  let totalCopied = 0;
  for (const appRoot of appRoots) {
    const mode = isStaticBuildAppRoot(appRoot) ? "static" : "server";
    console.log(
      `   ${path.relative(consumerRepoRoot, appRoot) || "."} (${mode})`
    );
    totalCopied += syncScaffoldForAppRoot(prismRoot, appRoot, options);
  }

  if (totalCopied === 0) {
    console.log(
      options.diffOnly
        ? "\n✅ Scaffold already up to date (nothing would change)"
        : "\n✅ Scaffold already up to date"
    );
  } else {
    console.log(
      options.diffOnly
        ? `\n✅ Scaffold diff: ${totalCopied} file(s) would update`
        : `\n✅ Scaffold sync complete (${totalCopied} file(s) updated)`
    );
  }
}

function main(): void {
  const args = process.argv.slice(2).filter((arg) => arg.startsWith("--"));
  const positional = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const options = parseScaffoldOptions(args);
  const repoRoot = path.resolve(positional[0] ?? process.cwd());
  syncScaffoldFromPrism(repoRoot, options);
}

if (require.main === module) {
  main();
}
