#!/usr/bin/env tsx
/**
 * Monthly dependency & code-health ritual (report-only).
 * Step order matches docs/PROJECT-HEALTH-Prism.md §6.
 *
 * Usage:
 *   pnpm run chores
 *   pnpm run chores -- --pull
 *   pnpm run chores -- --quarterly
 *   pnpm run chores -- --skip-quality
 *   pnpm run chores -- --help
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const scriptDir = __dirname;
const currentDir = path.join(scriptDir, "..");
const isInPrism =
  path.basename(path.dirname(scriptDir)) === "prism" ||
  path.basename(scriptDir) === "prism";

let PRISM_DIR: string;
let PARENT_OR_APP_DIR: string;

if (isInPrism) {
  PRISM_DIR = currentDir;
  PARENT_OR_APP_DIR = path.join(PRISM_DIR, "..");
} else {
  PARENT_OR_APP_DIR = currentDir;
  PRISM_DIR = path.join(PARENT_OR_APP_DIR, "prism");
}

type StepStatus = "pass" | "fail" | "warn" | "skip";

interface StepResult {
  name: string;
  status: StepStatus;
  detail?: string;
}

interface PackageJson {
  packageManager?: string;
  scripts?: Record<string, string>;
}

const args = process.argv.slice(2);

function printHelp(): void {
  console.log(`Monthly dependency & code-health ritual (report-only).

Usage:
  pnpm run chores [options]

Options:
  --pull           git pull + submodule update before checks
  --quarterly      include quarterly extras (store prune, knip:exports)
  --skip-quality   skip quality checks and build steps
  --strict         exit 1 on audit/outdated warnings (default: warn only)
  --help, -h       show this help

Examples:
  pnpm run chores
  pnpm run chores -- --pull
  pnpm run chores -- --quarterly
  pnpm run chores -- --pull --quarterly

See docs/PROJECT-HEALTH-Prism.md §6 for apply-updates / commit steps (not run here).
`);
}

if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const pull = args.includes("--pull");
const quarterly = args.includes("--quarterly");
const skipQuality = args.includes("--skip-quality");
const strict = args.includes("--strict");

function hasPackageJson(dir: string): boolean {
  return fs.existsSync(path.join(dir, "package.json"));
}

function readPackageJson(dir: string): PackageJson | null {
  const filePath = path.join(dir, "package.json");
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as PackageJson;
}

function section(title: string): void {
  console.log(`\n━━━ ${title} ━━━\n`);
}

function execInherit(command: string, cwd: string): void {
  execSync(command, { cwd, stdio: "inherit", env: process.env });
}

function execCapture(
  command: string,
  cwd: string
): { stdout: string; code: number } {
  try {
    const stdout = execSync(command, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    return { stdout, code: 0 };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; status?: number };
    const stdout = [err.stdout ?? "", err.stderr ?? ""]
      .filter(Boolean)
      .join("\n");
    return { stdout, code: err.status ?? 1 };
  }
}

function runStep(name: string, fn: () => StepStatus): StepResult {
  section(name);
  try {
    const status = fn();
    return { name, status };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ ${name}: ${detail}\n`);
    return { name, status: "fail", detail };
  }
}

function majorVersion(version: string): string {
  const match = version.trim().match(/(\d+)/);
  return match?.[1] ?? version.trim();
}

function resolveAppRoot(): string | null {
  if (!isInPrism && hasPackageJson(PARENT_OR_APP_DIR)) {
    return PARENT_OR_APP_DIR;
  }
  if (
    isInPrism &&
    hasPackageJson(PARENT_OR_APP_DIR) &&
    path.resolve(PARENT_OR_APP_DIR) !== path.resolve(PRISM_DIR)
  ) {
    return PARENT_OR_APP_DIR;
  }
  return null;
}

function resolvePrismRoot(): string | null {
  return hasPackageJson(PRISM_DIR) ? PRISM_DIR : null;
}

/** Warn when a submodule consumer still uses legacy flat app/ at repo root. */
function warnLegacyFlatLayout(appRoot: string): StepStatus {
  const hasPrismSubmodule = fs.existsSync(path.join(appRoot, "prism"));
  const hasFlatAppDir = fs.existsSync(path.join(appRoot, "app"));
  const hasAppsWeb = fs.existsSync(path.join(appRoot, "apps/web/app"));

  if (hasPrismSubmodule && hasFlatAppDir && !hasAppsWeb) {
    console.log(
      "⚠️  Legacy flat layout: app/ at repo root. New apps should use apps/web/ (see prism/docs/GENERATE-Prism.md)."
    );
    return "warn";
  }

  if (hasAppsWeb) {
    console.log("✅ Consumer workspace layout (apps/web/)");
  }

  return "pass";
}

function runReportCommand(
  label: string,
  command: string,
  cwd: string
): StepStatus {
  console.log(`→ ${label}: ${command}\n`);
  const { stdout, code } = execCapture(command, cwd);
  if (stdout.trim()) {
    console.log(stdout.trimEnd());
  } else {
    console.log("(no output)");
  }
  if (code === 0) {
    return "pass";
  }
  return strict ? "fail" : "warn";
}

const APP_QUALITY_CMD =
  "pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test:run";

const PRISM_QUALITY_CMD =
  "pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test:run";

function runChores(): void {
  const appRoot = resolveAppRoot();
  const prismRoot = resolvePrismRoot();
  const workRoot = appRoot ?? prismRoot;

  if (!workRoot) {
    console.error("❌ No package.json found for app or prism.");
    process.exit(1);
  }

  console.log("🧹 Monthly chores (report-only)\n");
  if (appRoot) {
    console.log(`App:   ${appRoot}`);
  }
  if (prismRoot) {
    console.log(`Prism: ${prismRoot}`);
  }

  const results: StepResult[] = [];

  if (appRoot) {
    results.push(
      runStep("App layout", () => warnLegacyFlatLayout(appRoot))
    );
  }

  results.push(
    runStep("Toolchain", () => {
      const nvmrcPath = path.join(workRoot, ".nvmrc");
      const pkg = readPackageJson(workRoot);
      const expectedNode = fs.existsSync(nvmrcPath)
        ? fs.readFileSync(nvmrcPath, "utf8").trim()
        : "(no .nvmrc)";
      const expectedPnpm = pkg?.packageManager?.match(/^pnpm@([^+]+)/)?.[1];

      const nodeVersion = execCapture("node -v", workRoot).stdout.trim();
      const pnpmVersion = execCapture("pnpm -v", workRoot).stdout.trim();

      console.log(`Node:  ${nodeVersion} (expected major ${expectedNode})`);
      console.log(
        `pnpm:  ${pnpmVersion}${expectedPnpm ? ` (expected ${expectedPnpm})` : ""}`
      );

      let status: StepStatus = "pass";
      if (
        expectedNode !== "(no .nvmrc)" &&
        majorVersion(nodeVersion) !== majorVersion(expectedNode)
      ) {
        console.log("\n⚠️  Node major version does not match .nvmrc");
        status = "warn";
      }
      if (expectedPnpm && pnpmVersion !== expectedPnpm) {
        console.log("\n⚠️  pnpm version does not match packageManager");
        status = "warn";
      }
      return status;
    })
  );

  results.push(
    runStep("Git", () => {
      const branch = execCapture(
        "git branch --show-current",
        workRoot
      ).stdout.trim();
      const statusOut = execCapture(
        "git status --porcelain",
        workRoot
      ).stdout.trim();
      console.log(`Branch: ${branch || "(unknown)"}`);
      if (statusOut) {
        console.log("\nWorking tree:\n");
        console.log(statusOut);
        return "warn";
      }
      console.log("Working tree: clean");
      return "pass";
    })
  );

  if (pull) {
    results.push(
      runStep("Pull", () => {
        execInherit("git pull", workRoot);
        if (fs.existsSync(path.join(workRoot, ".gitmodules"))) {
          execInherit("git submodule update --init --recursive", workRoot);
        }
        if (prismRoot) {
          execInherit("git pull", prismRoot);
        }
        return "pass";
      })
    );
  }

  const reportRoots: Array<{ label: string; dir: string }> = [];
  if (appRoot) {
    reportRoots.push({ label: "app", dir: appRoot });
  }
  if (prismRoot && prismRoot !== appRoot) {
    reportRoots.push({ label: "prism", dir: prismRoot });
  }

  for (const { label, dir } of reportRoots) {
    results.push(
      runStep(`Outdated (${label})`, () =>
        runReportCommand(label, "pnpm outdated", dir)
      )
    );
  }

  if (appRoot) {
    const appPkg = readPackageJson(appRoot);
    if (appPkg?.scripts?.["prism:sync:dependencies"]) {
      results.push(
        runStep("Dependency ranges (dry-run)", () =>
          runReportCommand("app", "pnpm prism:sync:dependencies", appRoot)
        )
      );
    } else {
      results.push({
        name: "Dependency ranges (dry-run)",
        status: "skip",
        detail: "prism:sync:dependencies not configured",
      });
    }
  }

  for (const { label, dir } of reportRoots) {
    results.push(
      runStep(`Audit high (${label})`, () =>
        runReportCommand(label, "pnpm audit --audit-level=high", dir)
      )
    );
  }

  for (const { label, dir } of reportRoots) {
    const pkg = readPackageJson(dir);
    if (!pkg?.scripts?.knip) {
      results.push({ name: `Knip (${label})`, status: "skip" });
      continue;
    }
    results.push(
      runStep(`Knip (${label})`, () => {
        execInherit("pnpm run knip", dir);
        return "pass";
      })
    );
  }

  if (!skipQuality) {
    if (appRoot) {
      results.push(
        runStep("Quality (app)", () => {
          execInherit(APP_QUALITY_CMD, appRoot);
          return "pass";
        })
      );
    }

    if (prismRoot) {
      results.push(
        runStep("Quality (prism)", () => {
          execInherit(PRISM_QUALITY_CMD, prismRoot);
          return "pass";
        })
      );
    }
  }

  if (quarterly) {
    results.push(
      runStep("Store prune", () => {
        execInherit("pnpm store prune", workRoot);
        return "pass";
      })
    );

    for (const { label, dir } of reportRoots) {
      const pkg = readPackageJson(dir);
      if (!pkg?.scripts?.["knip:exports"]) {
        results.push({ name: `Knip exports (${label})`, status: "skip" });
        continue;
      }
      results.push(
        runStep(`Knip exports (${label})`, () => {
          execInherit("pnpm run knip:exports", dir);
          return "pass";
        })
      );
    }
  }

  if (!skipQuality) {
    if (appRoot) {
      const appPkg = readPackageJson(appRoot);
      if (appPkg?.scripts?.build) {
        results.push(
          runStep("Build (app)", () => {
            execInherit("pnpm run build", appRoot);
            return "pass";
          })
        );
      } else {
        results.push({
          name: "Build (app)",
          status: "skip",
          detail: "build script not configured",
        });
      }
    }

    if (prismRoot) {
      const prismPkg = readPackageJson(prismRoot);
      if (prismPkg?.scripts?.["build:web"]) {
        results.push(
          runStep("Build (prism web)", () => {
            execInherit("pnpm run build:web", prismRoot);
            return "pass";
          })
        );
      }
    }
  }

  section("Summary");
  for (const result of results) {
    const icon =
      result.status === "pass"
        ? "✅"
        : result.status === "warn"
          ? "⚠️ "
          : result.status === "skip"
            ? "⏭️ "
            : "❌";
    const suffix = result.detail ? ` — ${result.detail}` : "";
    console.log(`${icon} ${result.name}${suffix}`);
  }

  const failed = results.some((result) => result.status === "fail");
  const warned = results.some((result) => result.status === "warn");

  if (failed) {
    console.log("\n❌ Chores finished with failures.");
    process.exit(1);
  }
  if (warned) {
    console.log(
      "\n⚠️  Chores finished with warnings (report-only; no changes made)."
    );
    process.exit(strict ? 1 : 0);
  }
  console.log("\n✅ Chores finished cleanly.");
}

runChores();
