/**
 * Workspace package globs for Prism scripts. Prefers pnpm-workspace.yaml over package.json workspaces.
 */

import fs from "fs";
import path from "path";

export function readWorkspaceGlobs(rootDirectoryPath: string): string[] {
  const pnpmWorkspacePath = path.join(rootDirectoryPath, "pnpm-workspace.yaml");
  if (fs.existsSync(pnpmWorkspacePath)) {
    const text = fs.readFileSync(pnpmWorkspacePath, "utf-8");
    const globs: string[] = [];
    let insidePackagesSection = false;
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) continue;
      if (/^packages:\s*$/.test(line)) {
        insidePackagesSection = true;
        continue;
      }
      if (insidePackagesSection) {
        const listItem = line.match(/^\s*-\s*['"]?([^'"\n]+)['"]?\s*$/);
        if (listItem) {
          globs.push(listItem[1].trim());
          continue;
        }
        if (trimmed && !line.startsWith(" ") && !line.startsWith("\t")) {
          break;
        }
      }
    }
    if (globs.length > 0) {
      return globs;
    }
  }

  const packageJsonPath = path.join(rootDirectoryPath, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8")) as {
    workspaces?: string[];
  };
  return packageJson.workspaces ?? [];
}
