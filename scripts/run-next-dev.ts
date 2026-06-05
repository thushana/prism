/**
 * Start `next dev` using host and port from `config.prism.json`.
 * Forwards extra CLI args (e.g. `--webpack`) to Next.js.
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
