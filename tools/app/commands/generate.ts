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
import type { BaseCommandOptions } from "../../../packages/cli/source/command";
import chalk from "chalk";

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
  if (fs.existsSync(path.join(process.cwd(), "package-lock.json"))) {
    return "npm";
  }
  return "pnpm";
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

/** Where generated app files live relative to the consumer repo root. */
type GenerateLayout = "prism-monorepo" | "consumer-workspace" | "consumer-flat";

function resolveGenerateLayout(
  inMonorepo: boolean,
  useGitDependency: boolean
): GenerateLayout {
  if (inMonorepo) {
    return "prism-monorepo";
  }
  if (useGitDependency) {
    return "consumer-flat";
  }
  return "consumer-workspace";
}

function resolveAppRoot(repoRoot: string, layout: GenerateLayout): string {
  if (layout === "consumer-workspace") {
    return path.join(repoRoot, "apps", "web");
  }
  return repoRoot;
}

function prismPackagesPrefix(layout: GenerateLayout): string {
  switch (layout) {
    case "prism-monorepo":
      return "../../packages";
    case "consumer-workspace":
      return "../../prism/packages";
    case "consumer-flat":
      return "./prism/packages";
  }
}

function usesSubmoduleFileDependencies(layout: GenerateLayout): boolean {
  return layout === "consumer-workspace" || layout === "consumer-flat";
}

/**
 * Create directory structure
 */
function createDirectoryStructure(targetDir: string): void {
  const dirs = [
    "app",
    "app/system-sheet",
    "app/.well-known/vercel/flags",
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

/** `packageManager` from Prism root so CI `pnpm/action-setup` matches local Corepack. */
function readPrismPackageManager(prismRoot: string | null): string | undefined {
  if (!prismRoot) {
    return undefined;
  }
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(prismRoot, "package.json"), "utf-8")
    ) as { packageManager?: string };
    return packageJson.packageManager;
  } catch {
    return undefined;
  }
}

function buildPrismDependencies(
  layout: GenerateLayout,
  prismRepo?: string
): Record<string, string> {
  if (layout === "prism-monorepo") {
    return {
      database: "*",
      intelligence: "*",
      logger: "*",
      ui: "*",
      "@prism/utilities": "*",
      admin: "*",
      "feature-flags": "*",
      flags: "^4.0.0",
    };
  }

  if (prismRepo) {
    return { "@prism/core": prismRepo };
  }

  const filePrefix =
    layout === "consumer-workspace"
      ? "file:../../prism/packages/"
      : "file:./prism/packages/";

  return {
    database: `${filePrefix}database`,
    intelligence: `${filePrefix}intelligence`,
    logger: `${filePrefix}logger`,
    ui: `${filePrefix}ui`,
    "@prism/utilities": `${filePrefix}utilities`,
    admin: `${filePrefix}admin`,
    "feature-flags": `${filePrefix}feature-flags`,
    flags: "^4.0.0",
  };
}

function generateWebAppPackageJson(
  appRoot: string,
  appName: string,
  layout: GenerateLayout,
  prismRoot: string | null,
  prismRepo?: string
): void {
  const useWebpack = usesSubmoduleFileDependencies(layout);
  const packageManager = readPrismPackageManager(prismRoot);

  const packageJson = {
    name: layout === "consumer-workspace" ? "web" : appName,
    version: "0.1.0",
    private: true,
    ...(packageManager ? { packageManager } : {}),
    scripts: {
      dev: useWebpack ? "next dev --webpack" : "next dev",
      build: useWebpack ? "next build --webpack" : "next build",
      start: "next start",
      lint: "eslint app",
      "lint:fix": "eslint app --fix",
      format: 'prettier --write "app/**/*.{ts,tsx}" "*.{ts,tsx}" "*.{js,mjs}"',
      "format:check":
        'prettier --check "app/**/*.{ts,tsx}" "*.{ts,tsx}" "*.{js,mjs}"',
      typecheck: "tsc --noEmit",
      test: "vitest",
      "test:run": "vitest run",
      "quality:ci":
        "pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test:run && pnpm run build",
      "db:generate": "drizzle-kit generate --config=database/drizzle.config.ts",
      "db:migrate": "drizzle-kit migrate --config=database/drizzle.config.ts",
      "db:push": "drizzle-kit push --config=database/drizzle.config.ts",
      "db:studio": "drizzle-kit studio --config=database/drizzle.config.ts",
      "db:seed": "tsx database/seed.ts",
    },
    dependencies: {
      ...buildPrismDependencies(layout, prismRepo),
      "@neondatabase/serverless": "^1.0.2",
      "@radix-ui/react-slot": "^1.2.4",
      next: "16.2.7",
      react: "19.2.7",
      "react-dom": "19.2.7",
      dotenv: "^17.4.2",
      "drizzle-orm": "^0.45.2",
    },
    devDependencies: {
      "@tailwindcss/postcss": "^4.3.0",
      "@types/node": "^25.9.1",
      "@types/react": "^19.2.16",
      "@types/react-dom": "^19.2.3",
      commander: "^15.0.0",
      "drizzle-kit": "^0.31.10",
      eslint: "^10.4.1",
      "eslint-config-next": "16.2.7",
      lightningcss: "^1.32.0",
      "postcss-import": "^16.1.1",
      "postcss-load-config": "^6.0.1",
      prettier: "^3.8.3",
      tailwindcss: "^4.3.0",
      tsx: "^4.22.4",
      "tw-animate-css": "^1.4.0",
      typescript: "^6.0.3",
      vitest: "^4.1.8",
    },
  };

  fs.writeFileSync(
    path.join(appRoot, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf-8"
  );
}

function generateConsumerRepoPackageJson(
  repoRoot: string,
  appName: string,
  prismRoot: string | null
): void {
  const packageManager = readPrismPackageManager(prismRoot);

  const packageJson = {
    name: appName,
    version: "0.1.0",
    private: true,
    ...(packageManager ? { packageManager } : {}),
    scripts: {
      build: "pnpm --filter web run build",
      clean: "rm -rf apps/*/.next apps/*/node_modules/.cache *.tsbuildinfo",
      "db:generate": "pnpm --filter web run db:generate",
      "db:migrate": "pnpm --filter web run db:migrate",
      "db:push": "pnpm --filter web run db:push",
      "db:seed": "pnpm --filter web run db:seed",
      "db:studio": "pnpm --filter web run db:studio",
      dev: "pnpm --filter web run dev",
      "dev:web": "pnpm --filter web run dev",
      format: 'prettier --write "apps/web/**/*.{ts,tsx}"',
      "format:check": 'prettier --check "apps/web/**/*.{ts,tsx}"',
      lint: "pnpm --filter web run lint",
      "lint:fix": "pnpm --filter web run lint:fix",
      "prism:sync": "tsx prism/scripts/sync.ts",
      "prism:sync:dependencies": "tsx prism/scripts/sync-dependencies.ts",
      "prism:sync:scripts": "tsx prism/scripts/sync-scripts.ts",
      quality: "tsx prism/scripts/quality.ts",
      "quality:quick": "pnpm run format && pnpm run lint && pnpm run typecheck",
      start: "pnpm --filter web run start",
      test: "pnpm --filter web run test",
      "test:run": "pnpm --filter web run test:run",
      typecheck: "pnpm --filter web run typecheck",
      "vercel:build": "vercel build --cwd apps/web",
    },
    devDependencies: {
      knip: "^6.15.0",
      prettier: "^3.8.3",
      tsx: "^4.22.4",
      typescript: "^6.0.3",
    },
  };

  fs.writeFileSync(
    path.join(repoRoot, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf-8"
  );
}

function generatePackageJson(
  repoRoot: string,
  appRoot: string,
  appName: string,
  layout: GenerateLayout,
  prismRoot: string | null,
  prismRepo?: string
): void {
  generateWebAppPackageJson(appRoot, appName, layout, prismRoot, prismRepo);

  if (layout === "consumer-workspace") {
    generateConsumerRepoPackageJson(repoRoot, appName, prismRoot);
  }
}

/**
 * Generate next.config.ts
 */
function generateNextConfig(appRoot: string, layout: GenerateLayout): void {
  const prismPrefix = prismPackagesPrefix(layout);
  const prismToolsWatchPath =
    layout === "consumer-workspace"
      ? "../../prism/tools/**"
      : "./prism/tools/**";

  const nextConfig = usesSubmoduleFileDependencies(layout)
    ? `import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@prism/utilities",
    "authentication",
    "intelligence",
    "logger",
    "ui",
    "admin",
    "feature-flags",
  ],
  turbopack: {},
  webpack: (config) => {
    const authenticationSource = path.resolve(
      __dirname,
      "${prismPrefix}/authentication/source"
    );

    config.resolve.alias = {
      ...config.resolve.alias,
      "@database": path.resolve(__dirname, "${prismPrefix}/database/source"),
      "@intelligence": path.resolve(__dirname, "${prismPrefix}/intelligence/source"),
      "@intelligence/tasks": path.resolve(__dirname, "${prismPrefix}/intelligence/source/tasks"),
      "@intelligence/client": path.resolve(__dirname, "${prismPrefix}/intelligence/source/client"),
      "@logger": path.resolve(__dirname, "${prismPrefix}/logger/source"),
      "@logger/client": path.resolve(__dirname, "${prismPrefix}/logger/source/client"),
      "@logger/server": path.resolve(__dirname, "${prismPrefix}/logger/source/server"),
      "@ui": path.resolve(__dirname, "${prismPrefix}/ui/source"),
      "@utilities": path.resolve(__dirname, "${prismPrefix}/utilities/source"),
      "@admin": path.resolve(__dirname, "${prismPrefix}/admin/source"),
      "feature-flags": path.resolve(__dirname, "${prismPrefix}/feature-flags/source"),
      "@authentication$": path.join(authenticationSource, "index.ts"),
      "@authentication/": \`\${authenticationSource}/\`,
    };
    config.resolve.symlinks = true;

    const existingIgnored = config.watchOptions?.ignored;
    const existingPatterns = Array.isArray(existingIgnored)
      ? existingIgnored
      : existingIgnored
        ? [existingIgnored]
        : [];

    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...existingPatterns.filter(
          (pattern): pattern is string =>
            typeof pattern === "string" && pattern.length > 0
        ),
        "**/cli/**",
        path.resolve(__dirname, "${prismToolsWatchPath}"),
      ],
    };

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

  fs.writeFileSync(path.join(appRoot, "next.config.ts"), nextConfig, "utf-8");
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
function generateTsConfig(appRoot: string, layout: GenerateLayout): void {
  const prismPrefix = prismPackagesPrefix(layout);

  const paths =
    layout === "consumer-flat"
      ? {
          "@/*": ["./*"],
          "@database": ["node_modules/@prism/core/packages/database/source"],
          "@intelligence": [
            "node_modules/@prism/core/packages/intelligence/source",
          ],
          "@logger": ["node_modules/@prism/core/packages/logger/source"],
          "@logger/*": ["node_modules/@prism/core/packages/logger/source/*"],
          "@ui": ["node_modules/@prism/core/packages/ui/source"],
          "@utilities": [
            "node_modules/@prism/core/packages/utilities/source",
          ],
          "@admin": ["node_modules/@prism/core/packages/admin/source"],
          "feature-flags": [
            "node_modules/@prism/core/packages/feature-flags/source",
          ],
        }
      : {
          "@/*": ["./*"],
          "@database": [`${prismPrefix}/database/source`],
          "@intelligence": [`${prismPrefix}/intelligence/source`],
          "@logger": [`${prismPrefix}/logger/source`],
          "@logger/*": [`${prismPrefix}/logger/source/*`],
          "@intelligence/tasks": [`${prismPrefix}/intelligence/source/tasks`],
          "@intelligence/tasks/*": [
            `${prismPrefix}/intelligence/source/tasks/*`,
          ],
          "@intelligence/client": [`${prismPrefix}/intelligence/source/client`],
          "@ui": [`${prismPrefix}/ui/source`],
          "@utilities": [`${prismPrefix}/utilities/source`],
          "@admin": [`${prismPrefix}/admin/source`],
          "@authentication": [`${prismPrefix}/authentication/source`],
          "@authentication/*": [`${prismPrefix}/authentication/source/*`],
          "feature-flags": [`${prismPrefix}/feature-flags/source`],
        };

  const tsconfigExclude =
    layout === "consumer-workspace"
      ? [
          "node_modules",
          "../../prism/apps",
          "../../prism/tools",
          "../../prism/scripts",
          "../../prism/packages/cli",
          ".next",
          "cli",
        ]
      : layout === "consumer-flat"
        ? [
            "node_modules",
            "prism/apps",
            "prism/tools",
            "prism/scripts",
            "prism/packages/cli",
            ".next",
            "cli",
          ]
        : ["node_modules", "cli"];

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
    exclude: tsconfigExclude,
  };

  fs.writeFileSync(
    path.join(appRoot, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2) + "\n",
    "utf-8"
  );
}

function generatePnpmWorkspaceYaml(repoRoot: string): void {
  const content = `packages:\n  - "apps/*"\n`;
  fs.writeFileSync(path.join(repoRoot, "pnpm-workspace.yaml"), content, "utf-8");
}

function generateConsumerWorkspaceCi(repoRoot: string): void {
  const ciDir = path.join(repoRoot, ".github/workflows");
  fs.mkdirSync(ciDir, { recursive: true });

  const ciContent = `# Generated by prism generate (consumer workspace layout).
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint, typecheck, test, build
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm run lint

      - name: Typecheck
        run: pnpm run typecheck

      - name: Tests
        run: pnpm run test:run

      - name: Build
        run: pnpm run build
`;

  fs.writeFileSync(path.join(ciDir, "ci.yml"), ciContent, "utf-8");
}

function patchGlobalsCss(appRoot: string, layout: GenerateLayout): void {
  if (layout === "prism-monorepo") {
    return;
  }

  const globalsPath = path.join(appRoot, "ui/styles/globals.css");
  if (!fs.existsSync(globalsPath)) {
    return;
  }

  const prismImport =
    layout === "consumer-workspace"
      ? '@import "../../../../prism/packages/ui/styles/globals.css";'
      : '@import "../../../prism/packages/ui/styles/globals.css";';

  const appSource =
    layout === "consumer-workspace"
      ? '@source "../../app/**/*.{ts,tsx,js,jsx,mdx}";'
      : '@source "../../app/**/*.{ts,tsx,js,jsx,mdx}";';

  fs.writeFileSync(
    globalsPath,
    `/* Import Prism styles from submodule (see ARCHITECTURE-Prism.md). */\n${prismImport}\n\n@source "../**/*.{ts,tsx,js,jsx,mdx}";\n${appSource}\n`,
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
    ADMIN_IMPORT: "@admin",
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

# Host Project Dashboard (Optional)
# URL to your hosting platform's project dashboard (e.g., Vercel, Netlify, etc.)
# Used by "run dev" command to open project dashboard and deployments pages
HOST_PROJECT_DASHBOARD=https://vercel.com/username/project

# Feature Flags (Optional – for Vercel Flags Explorer)
# Generate with: openssl rand -base64 32
# FLAGS_SECRET=your_base64_secret_here

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

  log.info(`Generating ${chalk.bold("💎 Prism")} app: ${appName}`);
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
    const inMonorepo = !!prismRoot && !options.path;
    let useGitDependency = false;
    let prismRepoUrl: string | undefined = undefined;

    if (!inMonorepo) {
      if (options.prismRepo !== undefined) {
        useGitDependency = true;
        prismRepoUrl = options.prismRepo;
        log.info(
          `📦 Using ${chalk.bold("💎 Prism")} from git: ${prismRepoUrl}`
        );
        log.info(
          "💡 Flat layout at repo root (legacy). Use without --prism-repo for apps/web workspace layout."
        );
      } else {
        useGitDependency = false;
        const defaultPrismRepo = "https://github.com/thushana/prism.git";
        log.info(
          `📦 Adding ${chalk.bold("💎 Prism")} as git submodule at ./prism`
        );
        log.info("📁 Next.js app will be generated at apps/web/");
        try {
          if (!fs.existsSync(path.join(targetDir, ".git"))) {
            execSync("git init", { cwd: targetDir, stdio: "pipe" });
          }
          execSync(`git submodule add ${defaultPrismRepo} prism`, {
            cwd: targetDir,
            stdio: "inherit",
          });
          log.info(`✅ ${chalk.bold("💎 Prism")} submodule added successfully`);
        } catch {
          log.warn("Failed to add Prism submodule automatically");
          log.warn("Please add it manually:");
          log.warn(`  cd ${targetDir}`);
          log.warn(`  git submodule add ${defaultPrismRepo} prism`);
        }
      }
    }

    const layout = resolveGenerateLayout(inMonorepo, useGitDependency);
    const repoRoot = targetDir;
    const appRoot = resolveAppRoot(repoRoot, layout);
    const installRoot = layout === "consumer-workspace" ? repoRoot : appRoot;
    const dbCommandRoot =
      layout === "consumer-workspace" ? repoRoot : appRoot;

    log.info("Creating directory structure...");
    createDirectoryStructure(appRoot);

    log.info("Generating template files...");
    const consumerPrismRoot =
      layout === "consumer-workspace"
        ? path.join(repoRoot, "prism")
        : null;

    generatePackageJson(
      repoRoot,
      appRoot,
      appName,
      layout,
      inMonorepo ? prismRoot : consumerPrismRoot,
      useGitDependency ? prismRepoUrl : undefined
    );
    generateTsConfig(appRoot, layout);
    generateNextConfig(appRoot, layout);
    generateNvmrc(repoRoot);
    if (layout === "consumer-workspace") {
      generatePnpmWorkspaceYaml(repoRoot);
      generateConsumerWorkspaceCi(repoRoot);
    }
    generateTemplateFiles(appRoot, appName);
    patchGlobalsCss(appRoot, layout);

    log.info("Setting up environment files...");
    const envExamplePath = path.join(appRoot, ".env.example");
    const envPath = path.join(appRoot, ".env");
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
    }

    const pm = detectPackageManager();
    log.info(`Detected package manager: ${pm}`);

    if (!inMonorepo) {
      log.info(`Installing dependencies at ${installRoot}...`);
      const installCmd = getInstallCommand(pm);
      try {
        execSync(installCmd, {
          cwd: installRoot,
          stdio: "inherit",
        });
        log.info("✅ Dependencies installed successfully");
      } catch {
        log.warn("Failed to install dependencies automatically");
        log.warn(
          `Please run '${installCmd}' manually from ${installRoot}`
        );
      }
    }

    log.info("Generating database migrations...");
    try {
      execSync(`${pm} run db:generate`, {
        cwd: dbCommandRoot,
        stdio: "inherit",
      });
    } catch {
      log.warn("Drizzle generate failed (this is okay if schema is empty)");
    }

    log.info("Applying database migrations...");
    try {
      execSync(`${pm} run db:migrate`, {
        cwd: dbCommandRoot,
        stdio: "inherit",
      });
    } catch {
      log.warn("Drizzle migrate failed (this is okay if no migrations)");
    }

    log.info("Seeding database...");
    try {
      execSync(`${pm} run db:seed`, {
        cwd: dbCommandRoot,
        stdio: "inherit",
      });
    } catch {
      log.warn("Seed failed (this is okay if seed script has issues)");
    }

    log.info("Initializing git repository...");
    try {
      if (!fs.existsSync(path.join(repoRoot, ".git"))) {
        execSync("git init", { cwd: repoRoot, stdio: "inherit" });
      }
      execSync("git add .", { cwd: repoRoot, stdio: "inherit" });
      execSync(
        'git commit -m "✨ INITIAL - Scaffold Prism Next.js app with core packages"',
        { cwd: repoRoot, stdio: "inherit" }
      );
    } catch {
      log.warn(
        "Git initialization failed (this is okay if git is not installed)"
      );
    }

    log.info(`✅ Successfully generated ${appName}!`);
    log.info(`\nNext steps:`);
    const relativePath = path.relative(process.cwd(), repoRoot);
    log.info(`  cd ${relativePath}`);
    if (layout === "consumer-workspace") {
      log.info("  pnpm install   # from repo root if you skipped install");
      log.info("  cp apps/web/.env.example apps/web/.env");
      log.info("  Vercel Root Directory: apps/web");
    }
    log.info(`  ${pm} run dev`);
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
