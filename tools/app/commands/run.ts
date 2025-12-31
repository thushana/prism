/**
 * Run Command
 *
 * Re-exports the run command from @cli package to avoid duplication.
 * The actual implementation is in prism/packages/cli/source/run.ts
 * Note: We skip banner here since prism/tools/app/tools.ts displays it via hook
 */

import type { Command } from "commander";
import { registerRunCommand as registerRunCommandFromCLI } from "@cli";

// Re-export the register function from @cli, skipping banner (shown via hook)
export function registerRunCommand(program: Command): void {
  registerRunCommandFromCLI(program, true); // Skip banner - shown via hook in tools.ts
}

// Re-export types for consistency
export type { RunCommandOptions } from "@cli";
