#!/usr/bin/env node

/**
 * CLI Wrapper - Executes the TypeScript CLI using tsx
 * 
 * This allows the CLI to be run directly as "prism" command
 * after running "npm run setup" or when using npx.
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Get the path to the TypeScript CLI file
const tsxPath = require.resolve("tsx/cli");
const cliPath = join(__dirname, "tools.ts");

// Spawn tsx with the CLI file and pass through all arguments
const child = spawn("node", [tsxPath, cliPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: process.cwd(),
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
