/**
 * Start `next dev` using host and port from Prism deployment resolution.
 * Forwards extra CLI args (e.g. `--webpack`) to Next.js.
 *
 * Port resolution (via `loadDevDeploymentFromDirectory`):
 * 1. `PORT` env
 * 2. `.cursor/dev-port` (app root)
 * 3. Main: `config.prism.json` → `deployments.dev.port`
 *    Worktree: stable hash of checkout root in `[configPort+1, configPort+999]`
 *
 * Host: `{nameIdentifier}.localhost`, or `{worktreeLabel}.{nameIdentifier}.localhost`
 * for linked worktrees (directory basename).
 *
 * Usage (from apps/web): tsx ../../prism/scripts/run-next-dev.ts --webpack
 */
import { spawn } from "node:child_process";
import { loadDevDeploymentFromDirectory } from "application-settings/load-prism-config-sync";

const appRoot = process.cwd();
const deployment = loadDevDeploymentFromDirectory(appRoot);
const extraArgs = process.argv.slice(2);

const nextArgs = [
  "dev",
  "--port",
  String(deployment.port),
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
