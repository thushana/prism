/**
 * Prism consumer standard: Husky at repo root (same as TimeTraveler).
 * - pre-commit → lint-staged (--no-stash: copied .cursor/commands paths)
 * - post-merge → refresh .cursor/commands from prism after git pull
 */

import fs from "fs";
import path from "path";

export const HUSKY_PRE_COMMIT = `#!/usr/bin/env sh
pnpm exec lint-staged --no-stash
`;

export const HUSKY_POST_MERGE = `#!/usr/bin/env sh
pnpm exec tsx prism/scripts/sync-commands.ts --quiet
`;

export const LINT_STAGED_RC = `/**
 * Pre-commit hooks (consumer apps/web layout).
 * @type {import('lint-staged').Configuration}
 */
module.exports = {
  "apps/web/**/*.{ts,tsx,mjs,js,cjs}": (filenames) => {
    const files = filenames.map((f) => JSON.stringify(f)).join(" ");
    return [
      \`prettier --write \${files}\`,
      \`eslint --config apps/web/eslint.config.mjs --fix --max-warnings 0 \${files}\`,
    ];
  },
  "apps/web/**/*.{json,css,md,mdx,yml,yaml}": ["prettier --write"],
  "docs/**/*.{md,mdx}": ["prettier --write"],
};
`;

function chmodExecutable(filePath: string): void {
  try {
    fs.chmodSync(filePath, 0o755);
  } catch {
    // Windows may not support chmod
  }
}

/** Write .husky hooks and .lintstagedrc.cjs (idempotent). */
export function ensureConsumerHusky(repoRoot: string): void {
  const huskyDir = path.join(repoRoot, ".husky");
  fs.mkdirSync(huskyDir, { recursive: true });

  const preCommitPath = path.join(huskyDir, "pre-commit");
  fs.writeFileSync(preCommitPath, HUSKY_PRE_COMMIT, "utf-8");
  chmodExecutable(preCommitPath);

  const postMergePath = path.join(huskyDir, "post-merge");
  fs.writeFileSync(postMergePath, HUSKY_POST_MERGE, "utf-8");
  chmodExecutable(postMergePath);

  fs.writeFileSync(
    path.join(repoRoot, ".lintstagedrc.cjs"),
    LINT_STAGED_RC,
    "utf-8"
  );
}
