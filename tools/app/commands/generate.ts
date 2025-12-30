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
  prismRepo?: string; // Git URL for Prism (e.g., "git+https://github.com/user/prism.git")
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
    "app/system-sheet",
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
  prismRoot: string | null,
  prismRepo?: string,
  useFileDependencies: boolean = false
): void {
  // Determine dependencies based on location
  // If in monorepo, use workspace references like existing apps
  // For standalone, use git dependencies (deployable) or file: (local dev)
  const prismDependencies = prismRoot
    ? {
        // In monorepo, reference individual packages (like apps/web)
        database: "*",
        intelligence: "*",
        logger: "*",
        ui: "*",
        utilities: "*",
        "system-sheet": "*",
      }
    : prismRepo
      ? {
          // Standalone app with git dependency: use @prism/core from git repo
          // This works for deployment - Vercel will clone the repo during build
          "@prism/core": prismRepo,
        }
      : {
          // Standalone app: use file: refs to Prism packages (local dev only)
          // Prism is added as a git submodule at ./prism (inside the app)
          // This enables CSS imports like @import "ui/styles/globals.css" to resolve
          // For deployment, you'll need to either:
          // 1. Use --prism-repo flag to generate with git dependency
          // 2. Or manually change to git dependency before deploying
          database: "file:./prism/packages/database",
          intelligence: "file:./prism/packages/intelligence",
          logger: "file:./prism/packages/logger",
          ui: "file:./prism/packages/ui",
          utilities: "file:./prism/packages/utilities",
          "system-sheet": "file:./prism/packages/system-sheet",
        };

  const packageJson = {
    name: appName,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: useFileDependencies ? "next dev --webpack" : "next dev",
      build: useFileDependencies ? "next build --webpack" : "next build",
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
      "@neondatabase/serverless": "^1.0.2",
      "@radix-ui/react-slot": "^1.2.4",
      next: "16.1.1",
      react: "^19.2.3",
      "react-dom": "^19.2.3",
      dotenv: "^17.2.3",
      "drizzle-orm": "beta",
    },
    devDependencies: {
      "@tailwindcss/postcss": "^4.1.17",
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
 * Generate next.config.ts
 */
function generateNextConfig(
  targetDir: string,
  useFileDependencies: boolean
): void {
  // For file dependencies, we need to configure Next.js to allow external paths
  // Turbopack doesn't support this, so we disable it and use webpack
  const nextConfig = useFileDependencies
    ? `import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Webpack configuration for file dependencies (Prism as git submodule at ./prism)
  // Turbopack is disabled via --webpack flag in package.json scripts
  turbopack: {}, // Empty config to silence Turbopack warnings
  webpack: (config) => {
    // Configure webpack to resolve TypeScript paths
    // These match the paths in tsconfig.json
    config.resolve.alias = {
      ...config.resolve.alias,
      "@database": path.resolve(__dirname, "./prism/packages/database/source"),
      "@intelligence": path.resolve(__dirname, "./prism/packages/intelligence/source"),
      "@intelligence/tasks": path.resolve(__dirname, "./prism/packages/intelligence/source/tasks"),
      "@logger": path.resolve(__dirname, "./prism/packages/logger/source"),
      "@logger/client": path.resolve(__dirname, "./prism/packages/logger/source/client"),
      "@logger/server": path.resolve(__dirname, "./prism/packages/logger/source/server"),
      "@ui": path.resolve(__dirname, "./prism/packages/ui/source"),
      "@utilities": path.resolve(__dirname, "./prism/packages/utilities/source"),
      "@system-sheet": path.resolve(__dirname, "./prism/packages/system-sheet/source"),
    };
    // Allow resolving symlinks (submodule creates symlinks in node_modules)
    config.resolve.symlinks = true;
    return config;
  },
};

export default nextConfig;
`
    : `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
`;

  fs.writeFileSync(path.join(targetDir, "next.config.ts"), nextConfig, "utf-8");
}

/**
 * Generate .nvmrc file to ensure Node.js version consistency
 */
function generateNvmrc(targetDir: string): void {
  const nvmrcContent = "24.11.1\n";
  fs.writeFileSync(path.join(targetDir, ".nvmrc"), nvmrcContent, "utf-8");
}

/**
 * Generate tsconfig.json
 */
function generateTsConfig(
  targetDir: string,
  inMonorepo: boolean,
  useGitDependency: boolean
): void {
  // Both monorepo and standalone use the same import style (@ui, @database, etc.)
  // For git dependencies, we still use path aliases pointing to node_modules
  const paths = inMonorepo
    ? {
        "@/*": ["./*"],
        // Monorepo: point to workspace packages
        "@database": ["../../packages/database/source"],
        "@intelligence": ["../../packages/intelligence/source"],
        "@logger": ["../../packages/logger/source"],
        "@logger/*": ["../../packages/logger/source/*"],
        "@ui": ["../../packages/ui/source"],
        "@utilities": ["../../packages/utilities/source"],
        "@system-sheet": ["../../packages/system-sheet/source"],
      }
    : useGitDependency
      ? {
          "@/*": ["./*"],
          // Git dependency: point to @prism/core subpaths in node_modules
          // Paths are relative to tsconfig.json location (app root)
          "@database": ["node_modules/@prism/core/packages/database/source"],
          "@intelligence": [
            "node_modules/@prism/core/packages/intelligence/source",
          ],
          "@logger": ["node_modules/@prism/core/packages/logger/source"],
          "@logger/*": ["node_modules/@prism/core/packages/logger/source/*"],
          "@ui": ["node_modules/@prism/core/packages/ui/source"],
          "@utilities": ["node_modules/@prism/core/packages/utilities/source"],
          "@system-sheet": ["node_modules/@prism/core/packages/system-sheet/source"],
        }
      : {
          "@/*": ["./*"],
          // File dependencies: Prism is a git submodule at ./prism
          // Point directly to source files (bypass symlinks)
          // Turbopack doesn't support symlinks outside project root, so use direct paths
          "@database": ["./prism/packages/database/source"],
          "@intelligence": ["./prism/packages/intelligence/source"],
          "@logger": ["./prism/packages/logger/source"],
          "@logger/*": ["./prism/packages/logger/source/*"],
          "@intelligence/tasks": ["./prism/packages/intelligence/source/tasks"],
          "@intelligence/tasks/*": [
            "./prism/packages/intelligence/source/tasks/*",
          ],
          "@ui": ["./prism/packages/ui/source"],
          "@utilities": ["./prism/packages/utilities/source"],
          "@system-sheet": ["./prism/packages/system-sheet/source"],
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
    "next.config.ts", // Skip next.config.ts (generated separately with correct config)
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
    SYSTEM_SHEET_IMPORT: "@system-sheet",
  };

  const templateSourceDir = getTemplatesDir();
  copyTemplateFiles(templateSourceDir, targetDir, vars);

  // Create .env files (they're gitignored, so copy manually)
  const envExampleContent = `# Database - Neon PostgreSQL
# Get your connection strings from: https://console.neon.tech
# Recommended for most uses (with connection pooling) - used for runtime queries
DATABASE_URL=postgresql://user:password@ep-xxxxx-pooler.region.aws.neon.tech/dbname?sslmode=require

# For uses requiring a connection without pgbouncer - used for drizzle-kit operations (migrations, push)
DATABASE_URL_UNPOOLED=postgresql://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require

# Google Maps API
# Get your API key from: https://console.cloud.google.com/apis/credentials
# Required APIs: Places API, Timezone API, Geocoding API, Directions API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Prism Authentication
# Generate secure random strings: openssl rand -hex 32
# PRISM_KEY_API: Used in x-prism-api-key header for API route authentication (including cron endpoint)
PRISM_KEY_API=your_prism_api_key_here
# PRISM_KEY_WEB: Used for web page authentication (password form, stored in cookie)
PRISM_KEY_WEB=your_prism_web_key_here

# Cron Security (Optional)
# Generate a secure random string for verifying cron requests from Vercel
# Vercel automatically sends this as Authorization: Bearer <CRON_SECRET> header
# Works for both automatic cron jobs and manual triggers from dashboard
# Recommended for production to prevent unauthorized cron triggers
CRON_SECRET=your_cron_secret_here

# Node Environment (automatically set by Vercel in production)
NODE_ENV=development
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
      try {
        // Try Node.js method first
        fs.rmSync(targetDir, { recursive: true, force: true });
      } catch {
        // Fallback to shell command for stubborn directories (e.g., with git submodules)
        log.warn("Node.js removal failed, trying shell command...");
        try {
          execSync(`rm -rf "${targetDir}"`, { stdio: "pipe" });
        } catch {
          log.error(`Failed to remove directory: ${targetDir}`);
          log.error("Please remove it manually and try again");
          process.exitCode = 1;
          return;
        }
      }
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
    // For standalone apps:
    // - If --prism-repo is specified, use git dependency (deployable)
    // - If --prism-repo is NOT specified, add Prism as git submodule at ./prism (one deployable repo)
    let useGitDependency = false;
    let prismRepoUrl: string | undefined = undefined;
    if (!inMonorepo) {
      if (options.prismRepo !== undefined) {
        // User explicitly specified git repo - use as npm dependency
        useGitDependency = true;
        prismRepoUrl = options.prismRepo;
        log.info(`📦 Using Prism from git: ${prismRepoUrl}`);
        log.info(
          "💡 This creates a deployable app with Prism as npm dependency."
        );
      } else {
        // Default: add Prism as git submodule inside the app (one deployable repo)
        useGitDependency = false;
        const defaultPrismRepo = "https://github.com/thushana/prism.git";
        log.info("📦 Adding Prism as git submodule at ./prism");
        try {
          // Initialize git first if not already initialized
          if (!fs.existsSync(path.join(targetDir, ".git"))) {
            execSync("git init", { cwd: targetDir, stdio: "pipe" });
          }
          // Add Prism as submodule
          execSync(`git submodule add ${defaultPrismRepo} prism`, {
            cwd: targetDir,
            stdio: "inherit",
          });
          log.info("✅ Prism submodule added successfully");
        } catch {
          log.warn("Failed to add Prism submodule automatically");
          log.warn("Please add it manually:");
          log.warn(`  cd ${targetDir}`);
          log.warn(`  git submodule add ${defaultPrismRepo} prism`);
          // Continue anyway - user can add it manually
        }
      }
    }
    const useFileDeps = !inMonorepo && !useGitDependency;
    generatePackageJson(
      targetDir,
      appName,
      inMonorepo ? prismRoot : null,
      useGitDependency ? prismRepoUrl : undefined,
      useFileDeps
    );
    generateTsConfig(targetDir, inMonorepo, useGitDependency);
    generateNextConfig(targetDir, !inMonorepo && !useGitDependency);
    generateNvmrc(targetDir);
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
    // For standalone, install dependencies in the generated app
    if (!inMonorepo) {
      log.info("Installing dependencies in generated app...");
      const installCmd = getInstallCommand(pm);
      try {
        execSync(installCmd, {
          cwd: targetDir,
          stdio: "inherit",
        });
        log.info("✅ Dependencies installed successfully");
      } catch {
        log.warn("Failed to install dependencies automatically");
        log.warn("Please run 'npm install' manually in the generated app");
      }
    }

    // Note: Database connection is configured via DATABASE_URL environment variable
    // No need to create local database directory for PostgreSQL

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

    // Initialize git (if not already initialized for submodule)
    log.info("Initializing git repository...");
    try {
      if (!fs.existsSync(path.join(targetDir, ".git"))) {
        execSync("git init", { cwd: targetDir, stdio: "inherit" });
      }
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
    .option(
      "--prism-repo <url>",
      "Git URL for Prism (default: 'git+https://github.com/thushana/prism.git'). Use this for deployable standalone apps. For local dev iteration, omit and use file: dependencies with git submodule."
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
