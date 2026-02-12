/**
 * Run Command for Child Apps
 *
 * Provides the "run dev" command that child apps can automatically inherit.
 * This command kills existing servers, starts dev environment, and opens browser tabs.
 */

import type { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { execSync, spawn } from "child_process";
import * as dotenv from "dotenv";
import * as http from "http";
import * as https from "https";
// TODO: Fix tsx ESM resolution issue - revert to @logger/server when fixed
// Workaround: Use namespace import due to tsx bug with package.json exports
import * as LoggerModule from "@logger/server";
const serverLogger = LoggerModule.serverLogger;
const setCLIMode = LoggerModule.setCLIMode;
import type { BaseCommandOptions } from "./command";
import { displayBanner } from "./command";
import { chalk } from "./styling";

// Enable CLI mode for cleaner output (no timestamps, no [INFO] prefixes)
setCLIMode(true);

const logger = serverLogger;
const log: {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
} = (logger as unknown as typeof console) ?? console;

export interface RunCommandOptions extends BaseCommandOptions {
  port?: string;
  drizzlePort?: string;
}

/**
 * Find the app root directory (child app or prism root)
 */
function findAppRoot(): { appRoot: string; isChildApp: boolean } {
  let currentDir = process.cwd();

  // Check if we're in a child app (has package.json with "dev" script but not workspaces)
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8")
        );

        // Check if this is a child app (has dev script, no workspaces, and not @prism/core)
        if (
          packageJson.scripts?.dev &&
          !packageJson.workspaces &&
          packageJson.name !== "@prism/core"
        ) {
          return { appRoot: currentDir, isChildApp: true };
        }

        // Check if this is the Prism root (has workspaces and @prism/core name)
        if (
          packageJson.workspaces &&
          (packageJson.name === "@prism/core" ||
            packageJson.name?.includes("prism"))
        ) {
          return { appRoot: currentDir, isChildApp: false };
        }
      } catch {
        // Continue searching
      }
    }
    currentDir = path.dirname(currentDir);
  }

  // Fallback: assume we're in a child app at current directory
  return { appRoot: process.cwd(), isChildApp: true };
}

/**
 * Kill all running dev servers and drizzle studio
 */
function killDevServers(): void {
  log.info(`     ${chalk.bold("🔪 KILLING")} - All running dev servers...`);

  try {
    // Kill processes on common ports
    const ports = [3000, 4983]; // Next.js default, Drizzle Studio default
    for (const port of ports) {
      try {
        execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, {
          stdio: "pipe",
        });
      } catch {
        // Ignore errors if no process is running
      }
    }

    // Kill processes by name pattern
    const processes = ["next dev", "drizzle-kit studio", "tsc --watch"];

    for (const processName of processes) {
      try {
        execSync(`pkill -f '${processName}' 2>/dev/null || true`, {
          stdio: "pipe",
        });
      } catch {
        // Ignore errors if no process is running
      }
    }

    log.info(`     ${chalk.bold("✅ KILLED")} - All dev servers`);
  } catch (error) {
    log.warn("Some processes may still be running", { error });
  }
}

/**
 * Start the default browser (opens a blank page or new tab)
 */
function startBrowser(): void {
  try {
    const platform = process.platform;

    if (platform === "darwin") {
      // Open default browser with about:blank on macOS
      spawn("open", ["about:blank"], {
        stdio: "ignore",
        detached: true,
      }).unref();
    } else if (platform === "linux") {
      spawn("xdg-open", ["about:blank"], {
        stdio: "ignore",
        detached: true,
      }).unref();
    } else if (platform === "win32") {
      spawn("cmd", ["/c", "start", "", "about:blank"], {
        stdio: "ignore",
        detached: true,
      }).unref();
    }
  } catch (_error) {
    // Silently fail - browser might already be running
  }
}

/**
 * Open a URL in the default browser
 */
function openBrowser(url: string): void {
  try {
    const platform = process.platform;

    if (platform === "darwin") {
      // Use spawn with proper argument handling for macOS
      spawn("open", [url], {
        stdio: "ignore",
        detached: true,
      }).unref();
    } else if (platform === "linux") {
      spawn("xdg-open", [url], {
        stdio: "ignore",
        detached: true,
      }).unref();
    } else if (platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], {
        stdio: "ignore",
        detached: true,
      }).unref();
    } else {
      log.warn(`Unsupported platform: ${platform}`);
      return;
    }
    log.info(`     ${chalk.bold("🌐 OPENED")} - ${url}`);
  } catch (error) {
    log.warn(`Failed to open browser: ${url}`, { error });
  }
}

/**
 * Start the dev server
 */
function startDevServer(
  appRoot: string,
  isChildApp: boolean,
  port: string = "3000"
): void {
  log.info(`     ${chalk.bold("🚀 STARTING")} - Dev server on port ${port}...`);

  const packageJsonPath = path.join(appRoot, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  if (!packageJson.scripts?.dev) {
    throw new Error("dev script not found in package.json");
  }

  // Start dev server in background
  const devProcess = spawn("npm", ["run", "dev"], {
    cwd: appRoot,
    stdio: "inherit",
    detached: true,
  });

  devProcess.unref();
  log.info(`     ${chalk.bold("✅ STARTED")} - Dev server`);
}

/**
 * Start drizzle studio
 */
function startDrizzleStudio(
  appRoot: string,
  isChildApp: boolean,
  drizzlePort: string = "4983"
): void {
  log.info(
    `     ${chalk.bold("🗄️  STARTING")} - Drizzle Studio on port ${drizzlePort}...`
  );

  const packageJsonPath = path.join(appRoot, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found at ${packageJsonPath}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  const scriptName = isChildApp ? "db:studio" : "database:studio";
  if (!packageJson.scripts?.[scriptName]) {
    throw new Error(`${scriptName} script not found in package.json`);
  }

  // Start drizzle studio in background
  const studioProcess = spawn("npm", ["run", scriptName], {
    cwd: appRoot,
    stdio: "inherit",
    detached: true,
  });

  studioProcess.unref();
  log.info(`     ${chalk.bold("✅ STARTED")} - Drizzle Studio`);
}

/**
 * Check if a URL is accessible (service is ready)
 */
async function waitForService(
  url: string,
  maxAttempts: number = 30,
  delayMs: number = 500
): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;

    const check = () => {
      attempts++;
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === "https:";
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname,
        method: "HEAD",
        rejectUnauthorized: false, // Allow self-signed certificates for local.drizzle.studio
        timeout: 2000,
      };

      const requestModule = isHttps ? https : http;
      const req = requestModule.request(options, (res) => {
        // Only resolve true for successful status codes (2xx, 3xx)
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          // Treat non-2xx/3xx as not ready, retry
          if (attempts >= maxAttempts) {
            resolve(false);
          } else {
            setTimeout(check, delayMs);
          }
        }
      });

      req.on("error", () => {
        if (attempts >= maxAttempts) {
          resolve(false);
        } else {
          setTimeout(check, delayMs);
        }
      });

      req.on("timeout", () => {
        req.destroy();
        if (attempts >= maxAttempts) {
          resolve(false);
        } else {
          setTimeout(check, delayMs);
        }
      });

      req.end();
    };

    check();
  });
}

/**
 * Open browser tabs
 */
async function openBrowserTabs(
  port: string = "3000",
  _drizzlePort: string = "4983",
  hasDrizzle: boolean = true
): Promise<void> {
  log.info(`     ${chalk.bold("🌐 OPENING")} - Browser tabs...`);

  const hostDashboard = process.env.HOST_PROJECT_DASHBOARD;

  // Open host project dashboard pages first if HOST_PROJECT_DASHBOARD is set
  if (hostDashboard) {
    // Normalize URL by removing trailing slash
    const normalizedDashboard = hostDashboard.replace(/\/+$/, "");
    openBrowser(normalizedDashboard);
    setTimeout(() => {
      openBrowser(`${normalizedDashboard}/deployments`);
    }, 500);
  } else {
    log.warn(
      "HOST_PROJECT_DASHBOARD environment variable not set, skipping host dashboard pages"
    );
  }

  // Wait for Drizzle Studio to be ready before opening it
  if (hasDrizzle) {
    log.info(
      `     ${chalk.bold("⏳ WAITING")} - For Drizzle Studio to be ready...`
    );
    const drizzleReady = await waitForService("https://local.drizzle.studio");
    if (drizzleReady) {
      log.info(`     ${chalk.bold("✅ READY")} - Drizzle Studio is running`);
      openBrowser(`https://local.drizzle.studio`);
    } else {
      log.warn("Drizzle Studio did not become ready, opening anyway...");
      openBrowser(`https://local.drizzle.studio`);
    }
  }

  // Wait for localhost server to be ready, then open system-sheet and main app
  log.info(`     ${chalk.bold("⏳ WAITING")} - For dev server to be ready...`);
  const serverReady = await waitForService(`http://localhost:${port}`);
  if (serverReady) {
    log.info(`     ${chalk.bold("✅ READY")} - Dev server is running`);
    // Open system-sheet page before the main app
    openBrowser(`http://localhost:${port}/admin/system-sheet`);

    setTimeout(() => {
      // Open localhost last (the actual app)
      openBrowser(`http://localhost:${port}`);
    }, 500);
  } else {
    log.warn("Dev server did not become ready, opening anyway...");
    openBrowser(`http://localhost:${port}/admin/system-sheet`);
    setTimeout(() => {
      openBrowser(`http://localhost:${port}`);
    }, 500);
  }
}

/**
 * Run the dev command
 */
export async function runRunCommand(options: RunCommandOptions): Promise<void> {
  if (options.debug || options.verbose) {
    logger.level = "debug";
  }

  // Find app root
  const { appRoot, isChildApp } = findAppRoot();

  // Load environment variables from .env file in app root
  const envPath = path.join(appRoot, ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, opsOff: true } as Parameters<
      typeof dotenv.config
    >[0]);
  }

  // Get app name from package.json
  const packageJsonPath = path.join(appRoot, "package.json");
  let appName = "server";
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      appName = packageJson.name || "server";
    } catch {
      // Use default
    }
  }

  const nodeEnv = process.env.NODE_ENV || "development";

  log.info(`${chalk.bold(`🚀 Starting ${appName} server`)}`);
  log.info(`     ${chalk.bold("ENVIRONMENT")} - ${nodeEnv}`);
  log.info(`     ${chalk.bold("APP ROOT")} - ${appRoot}\n`);

  // Start browser early so it's ready when we need to open tabs
  log.info(`${chalk.bold("🌐 BROWSER")}`);
  log.info(`     ${chalk.bold("🚀 STARTING")} - Browser...`);
  startBrowser();
  // Give browser time to start
  await new Promise((resolve) => setTimeout(resolve, 1000));

  log.info(`\n${chalk.bold("🎛️  SERVERS")}`);
  // Kill existing servers
  killDevServers();

  // Wait a moment for processes to fully terminate
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Start dev server
  const port = options.port || "3000";
  startDevServer(appRoot, isChildApp, port);

  // Start drizzle studio (may not be available)
  const drizzlePort = options.drizzlePort || "4983";
  let hasDrizzle = false;
  try {
    startDrizzleStudio(appRoot, isChildApp, drizzlePort);
    hasDrizzle = true;
  } catch (error) {
    log.warn("Drizzle Studio not available, continuing without it", { error });
  }

  log.info(`\n${chalk.bold("🌐 BROWSER")}`);
  // Open browser tabs (wait for services to be ready)
  await openBrowserTabs(port, drizzlePort, hasDrizzle);

  log.info(`\n${chalk.bold("✅ READY")} - Development environment started!`);
  log.info("Press Ctrl+C to stop all servers");
}

/**
 * Register the run command for child apps
 * This automatically provides the "run dev" command to any app using @cli
 * @param skipBanner - If true, skip displaying banner (useful when banner is shown via hook)
 */
export function registerRunCommand(
  program: Command,
  skipBanner: boolean = false
): void {
  program
    .command("run <mode>")
    .description(
      "Kill existing servers, start dev environment, and open browser tabs"
    )
    .option("-p, --port <port>", "Port for dev server (default: 3000)", "3000")
    .option(
      "-d, --drizzle-port <port>",
      "Port for Drizzle Studio (default: 4983)",
      "4983"
    )
    .option("-v, --verbose", "Enable verbose logging", false)
    .option("--debug", "Enable debug logging", false)
    .action(async (mode: string, options: RunCommandOptions) => {
      if (mode !== "dev") {
        log.error(`Unknown mode: ${mode}. Only "dev" is supported.`);
        process.exitCode = 1;
        return;
      }

      try {
        // Display banner unless skipped (e.g., when shown via hook in prism tools)
        if (!skipBanner) {
          displayBanner();
        }
        await runRunCommand(options);
      } catch (error) {
        log.error("Run command failed", { error });
        process.exitCode = 1;
      }
    });
}
