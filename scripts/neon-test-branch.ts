#!/usr/bin/env tsx
/**
 * First-class Prism helper for a disposable Neon branch named `test`.
 *
 * Create / reset / destroy a copy-on-write fork of the project's default branch,
 * and wire `DATABASE_URL_TEST` (+ unpooled) into the app `.env` without printing
 * secrets.
 *
 * Usage (consumer repo root, Neon CLI authenticated):
 *   pnpm neon:test run       # ensure → migrate → tests → destroy on success; keep on failure
 *   pnpm neon:test run --keep
 *   pnpm neon:test run --destroy-on-fail
 *   pnpm neon:test ensure | reset | migrate | status | destroy
 *
 * Options:
 *   --project-id=prj_…   Neon project (else NEON_PROJECT_ID / single-project CLI)
 *   --name=test          Branch name (default: test)
 *   --parent=main        Parent branch (default: project default)
 *   --env-file=path      .env to update (default: apps/web/.env or ./.env)
 *   --keep               With `run`: always leave the branch (even on success)
 *   --destroy-on-fail    With `run`: destroy even when tests fail
 *   --command=…          With `run`: override test command (default: test:integration)
 */

import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SCRIPT_DIR = __dirname;
const PRISM_ROOT = path.resolve(SCRIPT_DIR, "..");

const DEFAULT_BRANCH_NAME = "test";
const POOLED_KEY = "DATABASE_URL_TEST";
const UNPOOLED_KEY = "DATABASE_URL_TEST_UNPOOLED";

type Command =
  | "ensure"
  | "reset"
  | "destroy"
  | "status"
  | "migrate"
  | "run"
  | "help";

function resolveConsumerRoot(): string {
  const parentOfPrism = path.resolve(PRISM_ROOT, "..");
  if (
    fs.existsSync(path.join(parentOfPrism, "package.json")) &&
    fs.existsSync(path.join(parentOfPrism, "prism", "package.json"))
  ) {
    return parentOfPrism;
  }
  return PRISM_ROOT;
}

function parseFlag(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg?.slice(prefix.length);
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function resolveEnvFile(consumerRoot: string): string {
  const override = parseFlag("env-file");
  if (override) {
    return path.isAbsolute(override)
      ? override
      : path.join(consumerRoot, override);
  }
  const appsWebEnv = path.join(consumerRoot, "apps/web/.env");
  if (fs.existsSync(path.join(consumerRoot, "apps/web/package.json"))) {
    return appsWebEnv;
  }
  return path.join(consumerRoot, ".env");
}

function loadDotEnvKeys(envFile: string): Record<string, string> {
  if (!fs.existsSync(envFile)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/** Quote .env values that would break unquoted dotenv parsing. */
export function formatEnvValue(value: string): string {
  if (/[\s#"'$\\]/.test(value)) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}

/** Whether `neon:test run` should tear down the disposable branch. */
export function shouldDestroyTestBranch({
  testsPassed,
  keep,
  destroyOnFail,
}: {
  testsPassed: boolean;
  keep: boolean;
  destroyOnFail: boolean;
}): boolean {
  if (keep) {
    return false;
  }
  return testsPassed || destroyOnFail;
}

/** Upsert KEY=value lines; never logs values. Returns whether the file changed. */
export function upsertEnvKeys(
  contents: string,
  updates: Record<string, string | null>
): { next: string; changed: boolean } {
  const lines = contents.length > 0 ? contents.split(/\r?\n/) : [];
  const seen = new Set<string>();
  let changed = false;
  const nextLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (!match) {
      nextLines.push(line);
      continue;
    }
    const key = match[1]!;
    if (!(key in updates)) {
      nextLines.push(line);
      continue;
    }
    seen.add(key);
    const value = updates[key];
    if (value === null) {
      changed = true;
      continue;
    }
    const replacement = `${key}=${formatEnvValue(value)}`;
    if (line !== replacement) {
      changed = true;
    }
    nextLines.push(replacement);
  }

  for (const [key, value] of Object.entries(updates)) {
    if (seen.has(key) || value === null) continue;
    if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== "") {
      nextLines.push("");
    }
    nextLines.push(`${key}=${formatEnvValue(value)}`);
    changed = true;
  }

  let next = nextLines.join("\n");
  if (next.length > 0 && !next.endsWith("\n")) {
    next += "\n";
  }
  return { next, changed };
}

function writeEnvKeys(
  envFile: string,
  updates: Record<string, string | null>
): void {
  const previous = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
  const { next, changed } = upsertEnvKeys(previous, updates);
  if (!changed) {
    console.log(`No .env changes (${path.relative(process.cwd(), envFile)})`);
    return;
  }
  fs.mkdirSync(path.dirname(envFile), { recursive: true });
  fs.writeFileSync(envFile, next, "utf8");
  const keys = Object.keys(updates).join(", ");
  console.log(
    `Updated ${path.relative(process.cwd(), envFile)} (${keys}; values not printed)`
  );
}

function requireNeonCli(): void {
  try {
    execFileSync("neon", ["--version"], { stdio: "pipe" });
  } catch {
    console.error(
      "Neon CLI not found. Install and auth: https://neon.com/docs/cli/quickstart"
    );
    process.exit(1);
  }
}

function neonJson(args: string[]): unknown {
  const output = execFileSync("neon", [...args, "--output", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output) as unknown;
}

function neonCapture(args: string[]): string {
  return execFileSync("neon", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function resolveProjectId(
  envFile: string,
  envKeys: Record<string, string>
): string {
  const fromFlag = parseFlag("project-id");
  if (fromFlag) return fromFlag;

  const fromProcess = process.env.NEON_PROJECT_ID?.trim();
  if (fromProcess) return fromProcess;

  const fromEnv = envKeys.NEON_PROJECT_ID?.trim();
  if (fromEnv) return fromEnv;

  const projects = neonJson(["projects", "list"]) as
    | { id?: string }[]
    | { projects?: { id?: string }[] };
  const list = Array.isArray(projects)
    ? projects
    : (projects.projects ?? []);
  const ids = list
    .map((project) => project.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (ids.length === 1) {
    return ids[0]!;
  }

  console.error(
    `Could not resolve Neon project id. Set NEON_PROJECT_ID in ${path.relative(
      process.cwd(),
      envFile
    )} or pass --project-id=.`
  );
  if (ids.length > 1) {
    console.error(`Available projects: ${ids.join(", ")}`);
  }
  process.exit(1);
}

function listBranchNames(projectId: string): string[] {
  const raw = neonJson(["branches", "list", "--project-id", projectId]) as
    | { name?: string }[]
    | { branches?: { name?: string }[] };
  const list = Array.isArray(raw) ? raw : (raw.branches ?? []);
  return list
    .map((branch) => branch.name)
    .filter((name): name is string => typeof name === "string");
}

function branchExists(projectId: string, name: string): boolean {
  return listBranchNames(projectId).includes(name);
}

function connectionString(
  projectId: string,
  branchName: string,
  pooled: boolean
): string {
  const args = ["connection-string", branchName, "--project-id", projectId];
  if (pooled) {
    args.push("--pooled");
  }
  return neonCapture(args);
}

/** Neon may still be initializing compute right after create. */
function connectionStringWithRetry(
  projectId: string,
  branchName: string,
  pooled: boolean,
  attempts = 8
): string {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return connectionString(projectId, branchName, pooled);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delayMs = Math.min(500 * attempt, 2500);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch connection string for ${branchName}`);
}

function wireEnv(
  envFile: string,
  projectId: string,
  branchName: string,
  existingKeys: Record<string, string>
): void {
  const pooled = connectionStringWithRetry(projectId, branchName, true);
  const unpooled = connectionStringWithRetry(projectId, branchName, false);

  const prodUrls = [
    existingKeys.DATABASE_URL?.trim(),
    existingKeys.DATABASE_URL_UNPOOLED?.trim(),
  ].filter((value): value is string => Boolean(value));

  if (prodUrls.includes(pooled) || prodUrls.includes(unpooled)) {
    console.error(
      "Refusing to write DATABASE_URL_TEST*: connection string matches DATABASE_URL / DATABASE_URL_UNPOOLED. Use a disposable branch, not production."
    );
    process.exit(1);
  }

  writeEnvKeys(envFile, {
    [POOLED_KEY]: pooled,
    [UNPOOLED_KEY]: unpooled,
    NEON_PROJECT_ID: projectId,
  });
}

function createBranch(
  projectId: string,
  branchName: string,
  parent: string | undefined
): void {
  const args = [
    "branches",
    "create",
    "--project-id",
    projectId,
    "--name",
    branchName,
    "--no-secrets",
  ];
  if (parent) {
    args.push("--parent", parent);
  }
  console.log(
    `Creating Neon branch "${branchName}"${parent ? ` from ${parent}` : ""}…`
  );
  execFileSync("neon", args, { stdio: "inherit" });
}

function resetBranch(projectId: string, branchName: string): void {
  console.log(`Resetting Neon branch "${branchName}" from parent…`);
  execFileSync(
    "neon",
    [
      "branches",
      "reset",
      branchName,
      "--project-id",
      projectId,
      "--parent",
    ],
    { stdio: "inherit" }
  );
}

function destroyBranch(projectId: string, branchName: string): void {
  console.log(`Deleting Neon branch "${branchName}"…`);
  execFileSync(
    "neon",
    ["branches", "delete", branchName, "--project-id", projectId],
    { stdio: "inherit" }
  );
}

function printHelp(): void {
  console.log(`Prism Neon test branch

Commands:
  run       ensure → migrate → tests → destroy on success; keep on failure (inspect)
  ensure    Create branch if missing, then wire DATABASE_URL_TEST* into .env
  reset     Reset branch from parent, then re-wire .env
  destroy   Delete branch and remove DATABASE_URL_TEST* from .env
  status    Show whether branch exists and .env keys are set (no secrets)
  migrate   Run app db:migrate against DATABASE_URL_TEST_UNPOOLED

Options:
  --project-id=…   Neon project id
  --name=test      Branch name (default: test)
  --parent=…       Parent branch for create (default: project default)
  --env-file=…     Path to .env (default: apps/web/.env or ./.env)
  --keep           With run: never destroy (even on success)
  --destroy-on-fail With run: destroy even when tests fail
  --command=…      With run: shell command (default: pnpm run test:integration)
`);
}

function runIntegrationCommand(consumerRoot: string): void {
  const override = parseFlag("command");
  const hasWebFilter = fs.existsSync(
    path.join(consumerRoot, "apps/web/package.json")
  );
  const command =
    override ??
    (hasWebFilter
      ? "pnpm --filter web run test:integration"
      : "pnpm run test:integration");
  console.log(`Running: ${command}`);
  execSync(command, {
    cwd: consumerRoot,
    stdio: "inherit",
    env: process.env,
  });
}

function destroyAndClearEnv(
  envFile: string,
  projectId: string,
  branchName: string
): void {
  if (branchExists(projectId, branchName)) {
    destroyBranch(projectId, branchName);
  } else {
    console.log(`Branch "${branchName}" already absent.`);
  }
  writeEnvKeys(envFile, {
    [POOLED_KEY]: null,
    [UNPOOLED_KEY]: null,
  });
}

function runMigrate(consumerRoot: string, envFile: string): void {
  const keys = loadDotEnvKeys(envFile);
  const unpooled = keys[UNPOOLED_KEY]?.trim();
  const pooled = keys[POOLED_KEY]?.trim();
  if (!unpooled) {
    console.error(
      `${UNPOOLED_KEY} missing. Run: pnpm neon:test ensure`
    );
    process.exit(1);
  }

  const env = {
    ...process.env,
    DATABASE_URL_UNPOOLED: unpooled,
    DATABASE_URL: pooled || unpooled,
  };

  const hasWebFilter = fs.existsSync(
    path.join(consumerRoot, "apps/web/package.json")
  );
  const command = hasWebFilter
    ? "pnpm --filter web run db:migrate"
    : "pnpm run db:migrate";

  console.log(`Running migrations against the test branch…`);
  execSync(command, {
    cwd: consumerRoot,
    env,
    stdio: "inherit",
  });
}

function main(): void {
  const raw = process.argv[2] ?? "help";
  if (raw === "--help" || raw === "-h") {
    printHelp();
    return;
  }

  const command = raw as Command;
  if (
    !(
      [
        "ensure",
        "reset",
        "destroy",
        "status",
        "migrate",
        "run",
        "help",
      ] as string[]
    ).includes(command)
  ) {
    console.error(`Unknown command: ${raw}`);
    printHelp();
    process.exit(1);
  }

  if (command === "help") {
    printHelp();
    return;
  }

  requireNeonCli();

  const consumerRoot = resolveConsumerRoot();
  const envFile = resolveEnvFile(consumerRoot);
  const envKeys = loadDotEnvKeys(envFile);
  const branchName = parseFlag("name") ?? DEFAULT_BRANCH_NAME;
  const parent = parseFlag("parent");
  const projectId = resolveProjectId(envFile, envKeys);
  const keepBranch = hasFlag("keep");
  const destroyOnFail = hasFlag("destroy-on-fail");

  if (command === "status") {
    const exists = branchExists(projectId, branchName);
    const hasPooled = Boolean(envKeys[POOLED_KEY]?.trim());
    const hasUnpooled = Boolean(envKeys[UNPOOLED_KEY]?.trim());
    console.log(`Project: ${projectId}`);
    console.log(`Branch "${branchName}": ${exists ? "exists" : "missing"}`);
    console.log(
      `${POOLED_KEY}: ${hasPooled ? "set" : "missing"} in ${path.relative(process.cwd(), envFile)}`
    );
    console.log(
      `${UNPOOLED_KEY}: ${hasUnpooled ? "set" : "missing"} in ${path.relative(process.cwd(), envFile)}`
    );
    return;
  }

  if (command === "migrate") {
    runMigrate(consumerRoot, envFile);
    return;
  }

  if (command === "ensure") {
    if (!branchExists(projectId, branchName)) {
      createBranch(projectId, branchName, parent);
    } else {
      console.log(`Branch "${branchName}" already exists.`);
    }
    wireEnv(envFile, projectId, branchName, envKeys);
    console.log(
      `Ready. Prefer: pnpm neon:test run  (destroys on success; keeps on failure)\nOr: pnpm neon:test migrate && pnpm --filter web run test:integration`
    );
    return;
  }

  if (command === "reset") {
    if (!branchExists(projectId, branchName)) {
      createBranch(projectId, branchName, parent);
    } else {
      resetBranch(projectId, branchName);
    }
    wireEnv(envFile, projectId, branchName, envKeys);
    console.log(`Reset complete. Re-run: pnpm neon:test migrate`);
    return;
  }

  if (command === "destroy") {
    destroyAndClearEnv(envFile, projectId, branchName);
    return;
  }

  if (command === "run") {
    let testFailed: unknown;
    try {
      if (!branchExists(projectId, branchName)) {
        createBranch(projectId, branchName, parent);
      } else {
        console.log(`Branch "${branchName}" already exists.`);
      }
      wireEnv(envFile, projectId, branchName, envKeys);
      runMigrate(consumerRoot, envFile);
      runIntegrationCommand(consumerRoot);
    } catch (error) {
      testFailed = error;
      console.error("neon:test run failed before or during tests.");
    } finally {
      const shouldDestroy = shouldDestroyTestBranch({
        testsPassed: !testFailed,
        keep: keepBranch,
        destroyOnFail,
      });
      if (shouldDestroy) {
        try {
          destroyAndClearEnv(envFile, projectId, branchName);
        } catch (destroyError) {
          console.error("Failed to destroy test branch after run.");
          console.error(destroyError);
          if (!testFailed) {
            process.exit(1);
          }
        }
      } else {
        const reason = keepBranch
          ? "--keep"
          : "failure — inspect, then pnpm neon:test destroy";
        console.log(`Keeping Neon branch "${branchName}" (${reason}).`);
      }
    }
    if (testFailed) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main();
}
