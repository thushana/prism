#!/usr/bin/env tsx
/**
 * Copy Neon / Prism env vars onto Vercel's Development target.
 *
 * Prefer Vercel Storage → Connect Project with Development checked, then
 * `vercel env pull .env.development.local` from your Vercel cwd. Use this
 * script only when Development is empty and Neon "sensitive" vars cannot be
 * PATCH'd to include the development target.
 *
 * Usage (consumer repo root):
 *   1. Copy .env.neon-sync.example → .env.neon-sync next to your Vercel cwd
 *      (apps/web for generated apps, repo root for flat layouts like TimeTraveler)
 *   2. Fill from Neon Console → Connect
 *   3. pnpm vercel:env:sync-development
 *
 * Optional env: VERCEL_TOKEN, VERCEL_TEAM_SLUG, VERCEL_PROJECT_NAME
 * Optional flags: --team=slug --project=name --cwd=relative/path
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SCRIPT_DIR = __dirname;
const PRISM_ROOT = path.resolve(SCRIPT_DIR, "..");

const NEON_ENV_KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "NEON_AUTH_BASE_URL",
  "NEON_PROJECT_ID",
  "VITE_NEON_AUTH_URL",
  "PGHOST",
  "PGHOST_UNPOOLED",
  "PGUSER",
  "PGPASSWORD",
  "PGDATABASE",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_NO_SSL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_HOST",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_DATABASE",
  "PRISM_KEY_WEB",
  "PRISM_KEY_API",
] as const;

type ConsumerContext = {
  consumerRoot: string;
  vercelCwd: string;
  sourceFile: string;
  exampleHint: string;
  pullHint: string;
};

function resolveConsumerRoot(): string {
  const parentOfPrism = path.resolve(PRISM_ROOT, "..");
  const parentPackageJson = path.join(parentOfPrism, "package.json");
  if (
    fs.existsSync(parentPackageJson) &&
    fs.existsSync(path.join(parentOfPrism, "prism", "package.json"))
  ) {
    return parentOfPrism;
  }
  return PRISM_ROOT;
}

function resolveConsumerContext(consumerRoot: string): ConsumerContext {
  const appsWebPackage = path.join(consumerRoot, "apps/web/package.json");
  const vercelCwd = fs.existsSync(appsWebPackage)
    ? path.join(consumerRoot, "apps/web")
    : consumerRoot;

  const sourceFile = path.join(vercelCwd, ".env.neon-sync");
  const exampleRelative = path.relative(consumerRoot, vercelCwd);
  const exampleHint =
    exampleRelative === ""
      ? "prism/.env.neon-sync.example → .env.neon-sync"
      : `${exampleRelative}/.env.neon-sync.example → ${exampleRelative}/.env.neon-sync`;

  const pullHint =
    exampleRelative === ""
      ? "vercel env pull .env.development.local"
      : `cd ${exampleRelative} && vercel env pull .env.development.local`;

  return { consumerRoot, vercelCwd, sourceFile, exampleHint, pullHint };
}

function parseCliFlag(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg?.slice(prefix.length);
}

function defaultProjectName(consumerRoot: string): string {
  const packageJsonPath = path.join(consumerRoot, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`No package.json at ${consumerRoot}`);
  }
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as {
    name?: string;
  };
  if (!pkg.name) {
    throw new Error("package.json missing name (used as Vercel project slug)");
  }
  return pkg.name;
}

function loadVercelToken(): string {
  const fromEnv = process.env.VERCEL_TOKEN;
  if (fromEnv) return fromEnv;

  const authPaths = [
    path.join(
      os.homedir(),
      "Library/Application Support/com.vercel.cli/auth.json"
    ),
    path.join(os.homedir(), ".local/share/com.vercel.cli/auth.json"),
  ];

  for (const authPath of authPaths) {
    if (!fs.existsSync(authPath)) continue;
    const auth = JSON.parse(fs.readFileSync(authPath, "utf8")) as {
      token: string;
    };
    if (auth.token) return auth.token;
  }

  throw new Error("No Vercel token. Run `vercel login` or set VERCEL_TOKEN.");
}

function parseEnvFile(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, "utf8");
  const out: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
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

async function vercelApi(
  token: string,
  teamSlug: string,
  apiPath: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const sep = apiPath.includes("?") ? "&" : "?";
  const url = `https://api.vercel.com${apiPath}${sep}teamId=${teamSlug}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

function ensureLinked(
  vercelCwd: string,
  project: string,
  teamSlug: string
): void {
  const projectJson = path.join(vercelCwd, ".vercel/project.json");
  if (fs.existsSync(projectJson)) return;

  execSync("vercel", ["link", "-p", project, "--scope", teamSlug, "-y"], {
    cwd: vercelCwd,
    stdio: "inherit",
  });
}

async function main(): Promise<void> {
  const consumerRoot = resolveConsumerRoot();
  let { vercelCwd, sourceFile, exampleHint, pullHint } =
    resolveConsumerContext(consumerRoot);

  const cwdOverride = parseCliFlag("cwd");
  if (cwdOverride) {
    vercelCwd = path.resolve(consumerRoot, cwdOverride);
    sourceFile = path.join(vercelCwd, ".env.neon-sync");
    const rel = path.relative(consumerRoot, vercelCwd);
    exampleHint =
      rel === ""
        ? "prism/.env.neon-sync.example → .env.neon-sync"
        : `${rel}/.env.neon-sync.example → ${rel}/.env.neon-sync`;
    pullHint = `cd ${rel || "."} && vercel env pull .env.development.local`;
  }

  const teamSlug = parseCliFlag("team") ?? process.env.VERCEL_TEAM_SLUG;
  const project =
    parseCliFlag("project") ??
    process.env.VERCEL_PROJECT_NAME ??
    defaultProjectName(consumerRoot);

  if (!teamSlug) {
    console.error(
      "Missing Vercel team. Set VERCEL_TEAM_SLUG or pass --team=your-team-slug"
    );
    process.exit(1);
  }

  if (!fs.existsSync(sourceFile)) {
    console.error(
      `Missing ${sourceFile}\n` +
        `Copy ${exampleHint} and fill from Neon Console → Connect.\n` +
        `Or enable Development on the Neon Storage resource (Vercel → Storage → Connect Project).`
    );
    process.exit(1);
  }

  const source = parseEnvFile(sourceFile);
  const missing = NEON_ENV_KEYS.filter((key) => !source[key]?.trim());
  if (missing.length > 0) {
    console.error("Missing or empty keys in .env.neon-sync:", missing.join(", "));
    process.exit(1);
  }

  const token = loadVercelToken();
  ensureLinked(vercelCwd, project, teamSlug);

  console.log(
    `Syncing ${NEON_ENV_KEYS.length} variables to Development on ${project} (${teamSlug})…`
  );

  for (const key of NEON_ENV_KEYS) {
    const value = source[key];
    const { ok, status, body } = await vercelApi(
      token,
      teamSlug,
      `/v10/projects/${project}/env?upsert=true`,
      {
        method: "POST",
        body: JSON.stringify([
          {
            key,
            value,
            type: "encrypted",
            target: ["development"],
          },
        ]),
      }
    );

    if (!ok) {
      console.error(
        `Failed ${key} (${status}):`,
        JSON.stringify(body).slice(0, 400)
      );
      process.exit(1);
    }
    console.log(`  ✓ ${key}`);
  }

  console.log(`\nDone. Pull locally:\n  ${pullHint}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
