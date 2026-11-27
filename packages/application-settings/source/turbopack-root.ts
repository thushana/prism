import fs from "node:fs";
import path from "node:path";

/**
 * Hosts that vendor Prism list `prism/packages/*` in their workspace.
 * Quoted and bare YAML list items both count.
 */
const EMBEDDER_WORKSPACE_PATTERN = /(?:^|\n)\s*-\s*["']?prism\/packages\/\*/;

/**
 * Directory Turbopack (and output file tracing) should treat as the workspace
 * root for an app that lives at `apps/<name>/`.
 *
 * Static export and server apps use the same rule. Next otherwise walks up
 * looking for `pnpm-workspace.yaml` and can land on a parent checkout that is
 * outside this git repo, then ignore it.
 *
 * - Consumer `apps/web` (static or server): the host repo (`../..`).
 * - Prism's own `apps/web` inside a host that lists `prism/packages/*`: that
 *   host, so CSS resolved through the parent `node_modules` stays in bounds.
 * - Standalone Prism: the Prism repo. Do not walk past the embedder.
 */
export function resolveTurbopackRoot(appDir: string): string {
  const monorepoRoot = path.resolve(appDir, "../..");
  const parentRoot = path.resolve(monorepoRoot, "..");
  const parentWorkspaceFile = path.join(parentRoot, "pnpm-workspace.yaml");

  if (!fs.existsSync(parentWorkspaceFile)) {
    return monorepoRoot;
  }

  const workspace = fs.readFileSync(parentWorkspaceFile, "utf8");
  const embeddedInApp = EMBEDDER_WORKSPACE_PATTERN.test(workspace);
  return embeddedInApp ? parentRoot : monorepoRoot;
}
