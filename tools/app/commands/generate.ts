/**
 * Generate Command
 *
 * Scaffolds a new Next.js app with Prism core pre-wired.
 */

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
// TODO: Fix tsx ESM resolution issue - revert to @logger/server when fixed
// Workaround: Use namespace import due to tsx bug with package.json exports
import * as LoggerModule from "../../../packages/logger/source/server";
const serverLogger = LoggerModule.serverLogger;
import type { BaseCommandOptions } from "@cli";

const logger = serverLogger;
const log: {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
} = (logger as unknown as typeof console) ?? console;

export interface GenerateCommandOptions extends BaseCommandOptions {
  name: string;
  force?: boolean;
  path?: string;
}

/**
 * Detect package manager (npm, yarn, pnpm)
 */
function detectPackageManager(): string {
  if (fs.existsSync(path.join(process.cwd(), "yarn.lock"))) {
    return "yarn";
  }
  if (fs.existsSync(path.join(process.cwd(), "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  return "npm";
}

/**
 * Get install command based on package manager
 */
function getInstallCommand(pm: string): string {
  switch (pm) {
    case "yarn":
      return "yarn install";
    case "pnpm":
      return "pnpm install";
    default:
      return "npm install";
  }
}

/**
 * Create directory structure
 */
function createDirectoryStructure(targetDir: string): void {
  const dirs = [
    "app",
    "app/dev-sheet",
    "app/api",
    "ui/styles",
    "docs",
    "database",
    "database/migrations",
    "intelligence/tasks",
    "cli",
    "public",
  ];

  for (const dir of dirs) {
    const fullPath = path.join(targetDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

/**
 * Render template with variable substitution
 */
function renderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

/**
 * Write file from template
 */
function writeTemplateFile(
  targetDir: string,
  filePath: string,
  template: string,
  vars: Record<string, string>
): void {
  const fullPath = path.join(targetDir, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, renderTemplate(template, vars), "utf-8");
}

/**
 * Generate package.json
 */
function generatePackageJson(
  targetDir: string,
  appName: string,
  prismRoot: string | null
): void {
  // Determine dependencies based on location
  // If in monorepo, use workspace references like existing apps
  // For standalone, use file: dependencies to link Prism packages (enables CSS imports to work)
  const prismDependencies = prismRoot
    ? {
        // In monorepo, reference individual packages (like apps/web)
        database: "*",
        intelligence: "*",
        logger: "*",
        ui: "*",
        utilities: "*",
        "dev-sheet": "*",
      }
    : {
        // Standalone app: use file: refs to Prism packages
        // Assumes Prism is at ../prism (sibling directory or git submodule)
        // This enables CSS imports like @import "ui/styles/globals.css" to resolve
        database: "file:../prism/packages/database",
        intelligence: "file:../prism/packages/intelligence",
        logger: "file:../prism/packages/logger",
        ui: "file:../prism/packages/ui",
        utilities: "file:../prism/packages/utilities",
        "dev-sheet": "file:../prism/packages/dev-sheet",
      };

  const packageJson = {
    name: appName,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "eslint app --ext .ts,.tsx",
      format: 'prettier --write "app/**/*.{ts,tsx}" "*.{ts,tsx}" "*.{js,mjs}"',
      typecheck: "tsc --noEmit",
      "db:generate": "drizzle-kit generate --config=database/drizzle.config.ts",
      "db:migrate": "drizzle-kit migrate --config=database/drizzle.config.ts",
      "db:push": "drizzle-kit push --config=database/drizzle.config.ts",
      "db:studio": "drizzle-kit studio --config=database/drizzle.config.ts",
      "db:seed": "tsx database/seed.ts",
    },
    dependencies: {
      ...prismDependencies,
      "@radix-ui/react-slot": "^1.2.4",
      next: "16.1.1",
      react: "^19.2.3",
      "react-dom": "^19.2.3",
      "better-sqlite3": "^12.4.1",
      "drizzle-orm": "beta",
    },
    devDependencies: {
      "@tailwindcss/postcss": "^4.1.17",
      "@types/better-sqlite3": "^7.6.13",
      "@types/node": "^24.10.1",
      "@types/react": "^19.2.6",
      "@types/react-dom": "^19.2.3",
      commander: "^12.1.0",
      "drizzle-kit": "beta",
      eslint: "^9.39.1",
      "eslint-config-next": "16.1.1",
      lightningcss: "^1.30.2",
      "postcss-import": "^16.1.1",
      prettier: "^3.6.2",
      tailwindcss: "^4.1.17",
      tsx: "^4.20.6",
      "tw-animate-css": "^1.4.0",
      typescript: "^5.9.3",
    },
  };

  fs.writeFileSync(
    path.join(targetDir, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf-8"
  );
}

/**
 * Generate tsconfig.json
 */
function generateTsConfig(targetDir: string, inMonorepo: boolean): void {
  // Both monorepo and standalone use the same import style (@ui, @database, etc.)
  // Standalone uses file: dependencies to link packages, so paths are the same
  const paths = {
    "@/*": ["./*"],
    // Package paths - work in both monorepo and standalone (via file: dependencies)
    "@database": inMonorepo
      ? ["../../packages/database/source"]
      : ["../prism/packages/database/source"],
    "@intelligence": inMonorepo
      ? ["../../packages/intelligence/source"]
      : ["../prism/packages/intelligence/source"],
    "@logger": inMonorepo
      ? ["../../packages/logger/source"]
      : ["../prism/packages/logger/source"],
    "@logger/*": inMonorepo
      ? ["../../packages/logger/source/*"]
      : ["../prism/packages/logger/source/*"],
    "@ui": inMonorepo
      ? ["../../packages/ui/source"]
      : ["../prism/packages/ui/source"],
    "@utilities": inMonorepo
      ? ["../../packages/utilities/source"]
      : ["../prism/packages/utilities/source"],
    "@dev-sheet": inMonorepo
      ? ["../../packages/dev-sheet/source"]
      : ["../prism/packages/dev-sheet/source"],
  };

  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "react-jsx",
      incremental: true,
      plugins: [
        {
          name: "next",
        },
      ],
      paths,
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules", "cli"],
  };

  fs.writeFileSync(
    path.join(targetDir, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2) + "\n",
    "utf-8"
  );
}

/**
 * Get templates directory path
 * Uses apps/web as the template source (the actual working app)
 */
function getTemplatesDir(): string {
  // Find Prism root by looking for package.json with workspaces
  let currentDir = process.cwd();
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8")
        );
        if (
          packageJson.workspaces &&
          (packageJson.name === "@prism/core" ||
            packageJson.name?.includes("prism"))
        ) {
          const appsWebPath = path.join(currentDir, "apps", "web");
          if (fs.existsSync(appsWebPath)) {
            return appsWebPath;
          }
        }
      } catch {
        // Continue searching
      }
    }
    currentDir = path.dirname(currentDir);
  }
  // Fallback: try relative to current directory
  const fallbackPath = path.resolve(process.cwd(), "apps", "web");
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }
  throw new Error(
    "Could not find apps/web directory. Make sure you're running from the Prism monorepo root."
  );
}

/**
 * Recursively copy template files from apps/web directory
 * Skips build artifacts, dependencies, and generated files
 */
function copyTemplateFiles(
  sourceDir: string,
  targetDir: string,
  vars: Record<string, string>
): void {
  if (!fs.existsSync(sourceDir)) {
    log.error(`Template source directory not found: ${sourceDir}`);
    throw new Error(`Template source directory not found: ${sourceDir}`);
  }

  // Files and directories to skip when copying from apps/web
  const skipPatterns = [
    ".git",
    "node_modules",
    ".next",
    "out",
    "build",
    "coverage",
    ".pnp",
    ".pnp.js",
    ".DS_Store",
    "*.pem",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    ".env",
    ".env*.local",
    ".vercel",
    "*.tsbuildinfo",
    "next-env.d.ts",
    "*.db",
    "*.db-wal",
    "*.db-shm",
    "data", // Skip data directory (contains database files)
    "package.json", // Skip package.json (generated separately with correct name)
    "tsconfig.json", // Skip tsconfig.json (generated separately with correct paths)
  ];

  function shouldSkip(name: string): boolean {
    return skipPatterns.some((pattern) => {
      // Simple pattern matching
      if (pattern.includes("*")) {
        const regex = new RegExp(
          "^" + pattern.replace(/\*/g, ".*").replace(/\./g, "\\.") + "$"
        );
        return regex.test(name);
      }
      return name === pattern;
    });
  }

  function processDirectory(
    currentSource: string,
    currentTarget: string
  ): void {
    const entries = fs.readdirSync(currentSource, { withFileTypes: true });

    for (const entry of entries) {
      // Skip files/directories that shouldn't be copied
      if (shouldSkip(entry.name)) {
        continue;
      }

      const sourcePath = path.join(currentSource, entry.name);
      const targetPath = path.join(currentTarget, entry.name);

      if (entry.isDirectory()) {
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        processDirectory(sourcePath, targetPath);
      } else if (entry.isFile()) {
        // Read template file and process variables
        const templateContent = fs.readFileSync(sourcePath, "utf-8");
        const processedContent = renderTemplate(templateContent, vars);
        fs.writeFileSync(targetPath, processedContent, "utf-8");
      }
    }
  }

  processDirectory(sourceDir, targetDir);
}

/**
 * Generate all template files from apps/web directory
 */
function generateTemplateFiles(targetDir: string, appName: string): void {
  // Both monorepo and standalone use the same import style (@ui, @database, etc.)
  // Standalone uses file: dependencies, so imports are identical
  const vars = {
    APP_NAME: appName,
    UI_IMPORT: "@ui",
    DATABASE_IMPORT: "@database",
    INTELLIGENCE_IMPORT: "@intelligence",
    LOGGER_IMPORT: "@logger",
    DEV_SHEET_IMPORT: "@dev-sheet",
  };

  const templateSourceDir = getTemplatesDir();
  copyTemplateFiles(templateSourceDir, targetDir, vars);

  // Create .env files (they're gitignored, so copy manually)
  const envExampleContent = `# Database
DATABASE_URL=./data/database/sqlite.db

# For production, use a PostgreSQL connection string:
# DATABASE_URL=postgresql://user:password@host:5432/dbname
`;
  writeTemplateFile(targetDir, ".env.example", envExampleContent, vars);
  writeTemplateFile(targetDir, ".env", envExampleContent, vars);
}

/**
 * Find Prism monorepo root (directory with package.json containing workspaces)
 */
function findPrismRoot(startDir: string): string | null {
  let currentDir = startDir;

  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8")
        );
        // Check if this is the Prism root (has workspaces and @prism/core name)
        if (
          packageJson.workspaces &&
          (packageJson.name === "@prism/core" ||
            packageJson.name?.includes("prism"))
        ) {
          return currentDir;
        }
      } catch {
        // Continue searching
      }
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Run the generate command
 */
export async function runGenerateCommand(
  options: GenerateCommandOptions
): Promise<void> {
  const appName = options.name;

  // Determine target directory
  // If --path is specified, use it (for standalone apps)
  // If we're in the Prism monorepo, save to apps/
  // Otherwise, save to current directory
  const prismRoot = findPrismRoot(process.cwd());
  const targetDir = options.path
    ? path.resolve(process.cwd(), options.path)
    : prismRoot
      ? path.resolve(prismRoot, "apps", appName)
      : path.resolve(process.cwd(), appName);

  log.info(`Generating Prism app: ${appName}`);
  if (options.path) {
    log.info(`Saving to: ${targetDir}`);
  } else if (prismRoot) {
    log.info(`Saving to monorepo: ${targetDir}`);
  }

  // Check if directory already exists
  if (fs.existsSync(targetDir)) {
    if (options.force) {
      log.warn(
        `Directory ${targetDir} already exists. Removing it due to --force flag...`
      );
      fs.rmSync(targetDir, { recursive: true, force: true });
    } else {
      log.error(`Directory ${targetDir} already exists`);
      log.error(`Use --force to overwrite the existing directory`);
      process.exitCode = 1;
      return;
    }
  }

  try {
    // Create directory structure
    log.info("Creating directory structure...");
    createDirectoryStructure(targetDir);

    // Generate files
    log.info("Generating template files...");
    // If --path is specified, treat as standalone (even if in monorepo)
    const inMonorepo = !!prismRoot && !options.path;
    generatePackageJson(targetDir, appName, inMonorepo ? prismRoot : null);
    generateTsConfig(targetDir, inMonorepo);
    generateTemplateFiles(targetDir, appName);

    // Auto-copy .env.example to .env
    log.info("Setting up environment files...");
    const envExamplePath = path.join(targetDir, ".env.example");
    const envPath = path.join(targetDir, ".env");
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
    }

    // Detect package manager
    const pm = detectPackageManager();
    log.info(`Detected package manager: ${pm}`);

    // Install dependencies
    // If in monorepo, rebuild native modules (better-sqlite3) from root
    // For standalone, install dependencies in the generated app
    if (inMonorepo) {
      log.info("Rebuilding native modules for monorepo...");
      try {
        execSync("npm rebuild better-sqlite3", {
          cwd: prismRoot,
          stdio: "inherit",
        });
      } catch {
        log.warn(
          "Failed to rebuild better-sqlite3 (this is okay, will use existing build)"
        );
      }
    } else {
      log.info("Installing dependencies in generated app...");
      const installCmd = getInstallCommand(pm);
      try {
        execSync(installCmd, {
          cwd: targetDir,
          stdio: "inherit",
        });
        log.info("✅ Dependencies installed successfully");
      } catch (error) {
        log.warn("Failed to install dependencies automatically");
        log.warn("Please run 'npm install' manually in the generated app");
      }
    }

    // Ensure database directory exists for drizzle (e.g., ./data/database/sqlite.db)
    const dbPath = path.resolve(
      targetDir,
      process.env.DATABASE_URL || "./data/database/sqlite.db"
    );
    const dbDir = path.dirname(dbPath);
    fs.mkdirSync(dbDir, { recursive: true });

    // Run drizzle generate
    log.info("Generating database migrations...");
    try {
      execSync(`${pm} run db:generate`, {
        cwd: targetDir,
        stdio: "inherit",
      });
    } catch {
      log.warn("Drizzle generate failed (this is okay if schema is empty)");
    }

    // Run drizzle migrate
    log.info("Applying database migrations...");
    try {
      execSync(`${pm} run db:migrate`, {
        cwd: targetDir,
        stdio: "inherit",
      });
    } catch {
      log.warn("Drizzle migrate failed (this is okay if no migrations)");
    }

    // Run seed
    log.info("Seeding database...");
    try {
      execSync(`${pm} run db:seed`, {
        cwd: targetDir,
        stdio: "inherit",
      });
    } catch {
      log.warn("Seed failed (this is okay if seed script has issues)");
    }

    // Initialize git
    log.info("Initializing git repository...");
    try {
      execSync("git init", { cwd: targetDir, stdio: "inherit" });
      execSync("git add .", { cwd: targetDir, stdio: "inherit" });
      execSync(
        'git commit -m "✨ INITIAL - Scaffold Prism Next.js app with core packages"',
        { cwd: targetDir, stdio: "inherit" }
      );
    } catch {
      log.warn(
        "Git initialization failed (this is okay if git is not installed)"
      );
    }

    log.info(`✅ Successfully generated ${appName}!`);
    log.info(`\nNext steps:`);
    const relativePath = path.relative(process.cwd(), targetDir);
    log.info(`  cd ${relativePath}`);
    log.info(`  npm run dev`);
  } catch (error) {
    log.error(`Failed to generate app: ${error}`);
    process.exitCode = 1;
    throw error;
  }
}

/**
 * Register the generate command
 */
export function registerGenerateCommand(program: Command): void {
  program
    .command("generate <name>")
    .description("Generate a new Next.js app with Prism core")
    .option("-v, --verbose", "Enable verbose logging", false)
    .option("-d, --debug", "Enable debug logging", false)
    .option("-f, --force", "Overwrite existing directory if it exists", false)
    .option(
      "-p, --path <path>",
      "Target directory path (for standalone apps outside monorepo)"
    )
    .action(async (name: string, options: GenerateCommandOptions) => {
      try {
        await runGenerateCommand({ ...options, name });
      } catch (error) {
        log.error("Generate command failed", { error });
        process.exitCode = 1;
      }
    });
}
