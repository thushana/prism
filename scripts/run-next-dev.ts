/**
 * Start `next dev` using host and port from `config.prism.json`.
 * Forwards extra CLI args (e.g. `--webpack`) to Next.js.
 *
 * Port resolution (same order as embedder `scripts/lib/dev-port.cjs`):
 * 1. `PORT` env
 * 2. `.cursor/dev-port` (Cursor worktree parallel checkouts)
 * 3. `config.prism.json` → `deployments.dev.port`
 *
 * Usage (from apps/web): tsx ../../prism/scripts/run-next-dev.ts --webpack
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { loadDevDeploymentFromDirectory } from "application-settings/load-prism-config-sync";

function resolveDevPort(appRoot: string, configPort: number): number {
  const portEnv = process.env.PORT?.trim();
  if (portEnv && /^\d+$/.test(portEnv)) {
    return Number(portEnv);
  }

  const devPortFile = path.join(appRoot, ".cursor", "dev-port");
  try {
    const fromFile = readFileSync(devPortFile, "utf8").trim();
    if (/^\d+$/.test(fromFile)) {
      return Number(fromFile);
    }
  } catch {
    // missing or unreadable
  }

  return configPort;
}

const appRoot = process.cwd();
const deployment = loadDevDeploymentFromDirectory(appRoot);
const port = resolveDevPort(appRoot, deployment.port);
const extraArgs = process.argv.slice(2);

const nextArgs = [
  "dev",
  "--port",
  String(port),
  "--hostname",
  deployment.host,
  ...extraArgs,
];

const child = spawn("next", nextArgs, {
  cwd: appRoot,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
