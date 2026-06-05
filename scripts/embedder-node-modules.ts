/**
 * Embedder apps hoist prism/packages/*; a separate prism/node_modules duplicates types.
 * Stash it during app checks, restore for prism-only checks.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export const PRISM_STANDALONE_NODE_MODULES_DIR = ".prism-node-modules-stash";

export function prismDirForApp(appRoot: string): string {
  return path.join(appRoot, "prism");
}

export function isPrismEmbedderApp(appRoot: string): boolean {
  const prismDir = prismDirForApp(appRoot);
  return (
    fs.existsSync(path.join(appRoot, "config.prism.json")) &&
    fs.existsSync(path.join(prismDir, "package.json"))
  );
}

function prismStandaloneNodeModulesStashPath(appRoot: string): string {
  return path.join(appRoot, PRISM_STANDALONE_NODE_MODULES_DIR);
}

export function hidePrismStandaloneNodeModules(appRoot: string): void {
  if (!isPrismEmbedderApp(appRoot)) {
    return;
  }

  const prismDir = prismDirForApp(appRoot);
  const nodeModules = path.join(prismDir, "node_modules");
  const hidden = prismStandaloneNodeModulesStashPath(appRoot);
  const legacyHidden = path.join(prismDir, "node_modules.prism-standalone");

  if (fs.existsSync(legacyHidden) && !fs.existsSync(nodeModules)) {
    fs.renameSync(legacyHidden, nodeModules);
  }

  if (fs.existsSync(nodeModules) && fs.existsSync(hidden)) {
    fs.rmSync(nodeModules, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
    console.log(
      "ℹ️  Removed duplicate prism/node_modules (using existing stash for app checks)\n"
    );
  } else if (fs.existsSync(nodeModules) && !fs.existsSync(hidden)) {
    fs.renameSync(nodeModules, hidden);
    console.log(
      "ℹ️  Stashed prism/node_modules during app checks (avoid duplicate Next/Better Auth types)\n"
    );
  }
}

export function ensurePrismStandaloneNodeModules(appRoot: string): void {
  if (!isPrismEmbedderApp(appRoot)) {
    return;
  }

  const prismDir = prismDirForApp(appRoot);
  const nodeModules = path.join(prismDir, "node_modules");
  const hidden = prismStandaloneNodeModulesStashPath(appRoot);

  if (fs.existsSync(hidden) && fs.existsSync(nodeModules)) {
    fs.rmSync(nodeModules, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  }

  if (fs.existsSync(hidden)) {
    fs.renameSync(hidden, nodeModules);
    console.log("ℹ️  Relinking prism workspace dependencies after restore…\n");
    execSync("pnpm install", { cwd: prismDir, stdio: "inherit" });
    return;
  }

  if (!fs.existsSync(nodeModules)) {
    console.log(
      "ℹ️  Installing prism/node_modules for prism quality checks…\n"
    );
    execSync("pnpm install", { cwd: prismDir, stdio: "inherit" });
  }
}

/** Restore stashed deps for embedder apps, or install when running prism standalone. */
export function ensurePrismNodeModulesForQuality(
  prismDir: string,
  embedderAppRoot: string | null
): void {
  if (embedderAppRoot && isPrismEmbedderApp(embedderAppRoot)) {
    ensurePrismStandaloneNodeModules(embedderAppRoot);
    return;
  }

  const nodeModules = path.join(prismDir, "node_modules");
  if (!fs.existsSync(nodeModules)) {
    console.log(
      "ℹ️  Installing prism/node_modules for prism quality checks…\n"
    );
    execSync("pnpm install", { cwd: prismDir, stdio: "inherit" });
  }
}

export function resolveEmbedderAppRoot(
  appRoot: string,
  prismDir: string
): string | null {
  if (isPrismEmbedderApp(appRoot)) {
    return appRoot;
  }
  const parent = path.dirname(prismDir);
  return isPrismEmbedderApp(parent) ? parent : null;
}
