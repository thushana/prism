/**
 * Generate Command
 *
 * Scaffolds a new Next.js app with Prism core pre-wired.
 */

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as loggerModule from "../../../packages/logger/source/server.ts";

const { serverLogger: logger } = loggerModule;
const log: {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
} = (logger as unknown as typeof console) ?? console;

import type { BaseCommandOptions } from "../../../packages/cli/source/command.ts";

export interface GenerateCommandOptions extends BaseCommandOptions {
  name: string;
  force?: boolean;
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
  // Otherwise, use @prism/core file reference
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
        // Standalone app, use @prism/core
        "@prism/core": "file:../prism",
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
  const paths = inMonorepo
    ? {
        "@/*": ["./*"],
        // Monorepo paths (like apps/web)
        database: ["../../packages/database/source"],
        intelligence: ["../../packages/intelligence/source"],
        logger: ["../../packages/logger/source"],
        ui: ["../../packages/ui/source"],
        utilities: ["../../packages/utilities/source"],
        "dev-sheet": ["../../packages/dev-sheet/source"],
      }
    : {
        "@/*": ["./*"],
        // Standalone app paths
        "@prism/core/*": ["../packages/*/source"],
        "@prism/core/ui": ["../packages/ui/source"],
        "@prism/core/database": ["../packages/database/source"],
        "@prism/core/intelligence": ["../packages/intelligence/source"],
        "@prism/core/logger": ["../packages/logger/source"],
        "@prism/core/utilities": ["../packages/utilities/source"],
        "@prism/core/dev-sheet": ["../packages/dev-sheet/source"],
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
 * Resolves relative to the tools directory (where this command lives)
 */
function getTemplatesDir(): string {
  // Find tools directory by looking for tools/package.json
  let currentDir = process.cwd();
  while (currentDir !== path.dirname(currentDir)) {
    const toolsDir = path.join(currentDir, "tools");
    if (fs.existsSync(path.join(toolsDir, "package.json"))) {
      return path.join(toolsDir, "templates");
    }
    currentDir = path.dirname(currentDir);
  }
  // Fallback: assume we're in the project root
  return path.resolve(process.cwd(), "tools/templates");
}

/**
 * Recursively copy template files from templates directory
 */
function copyTemplateFiles(
  sourceDir: string,
  targetDir: string,
  vars: Record<string, string>
): void {
  if (!fs.existsSync(sourceDir)) {
    log.error(`Templates directory not found: ${sourceDir}`);
    throw new Error(`Templates directory not found: ${sourceDir}`);
  }

  function processDirectory(
    currentSource: string,
    currentTarget: string
  ): void {
    const entries = fs.readdirSync(currentSource, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(currentSource, entry.name);
      const targetPath = path.join(currentTarget, entry.name);

      if (entry.isDirectory()) {
        // Skip .git directories
        if (entry.name === ".git") {
          continue;
        }
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
 * Generate all template files from templates directory
 */
function generateTemplateFiles(
  targetDir: string,
  appName: string,
  inMonorepo: boolean
): void {
  const vars = {
    APP_NAME: appName,
    UI_IMPORT: inMonorepo ? "ui" : "@prism/core/ui",
    DATABASE_IMPORT: inMonorepo ? "database" : "@prism/core/database",
    INTELLIGENCE_IMPORT: inMonorepo
      ? "intelligence"
      : "@prism/core/intelligence",
    LOGGER_IMPORT: inMonorepo ? "logger" : "@prism/core/logger",
    DEV_SHEET_IMPORT: inMonorepo ? "dev-sheet" : "@prism/core/dev-sheet",
  };

  const templatesDir = getTemplatesDir();
  copyTemplateFiles(templatesDir, targetDir, vars);

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
  // If we're in the Prism monorepo, save to apps/
  // Otherwise, save to current directory
  const prismRoot = findPrismRoot(process.cwd());
  const targetDir = prismRoot
    ? path.resolve(prismRoot, "apps", appName)
    : path.resolve(process.cwd(), appName);

  log.info(`Generating Prism app: ${appName}`);
  if (prismRoot) {
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
    const inMonorepo = !!prismRoot;
    generatePackageJson(targetDir, appName, prismRoot);
    generateTsConfig(targetDir, inMonorepo);
    generateTemplateFiles(targetDir, appName, inMonorepo);

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
    // Otherwise, install in the generated app
    if (prismRoot) {
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
      log.info("Installing dependencies...");
      const installCmd = getInstallCommand(pm);
      execSync(installCmd, {
        cwd: targetDir,
        stdio: "inherit",
      });
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
    log.info(`  cd ${appName}`);
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
    .action(async (name: string, options: GenerateCommandOptions) => {
      try {
        await runGenerateCommand({ ...options, name });
      } catch (error) {
        log.error("Generate command failed", { error });
        process.exitCode = 1;
      }
    });
}
