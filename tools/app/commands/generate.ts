/**
 * Generate Command
 *
 * Scaffolds a new Next.js app with Prism core pre-wired.
 */

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
// TODO: Fix tsx ESM resolution issue - revert to @logger/server when fixed
// Workaround: Use namespace import due to tsx bug with package.json exports
import * as LoggerModule from "../../../packages/logger/source/server";
import type { BaseCommandOptions } from "../../../packages/cli/source/command";
import chalk from "chalk";
import { assertAppUsesLibraryDir } from "../../../scripts/assert-app-library-layout";

const serverLogger = LoggerModule.serverLogger;

/** Prism monorepo root (tools/app/commands → ../../../) */
const PRISM_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

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
  /** App-wide session gate (proxy) vs admin-only pages. Default: admin */
  authGate?: "admin" | "app";
  /** Static export scaffold (no auth/DB). */
  static?: boolean;
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

type GenerateLayout = "prism-monorepo" | "consumer-workspace";

function resolveGenerateLayout(inMonorepo: boolean): GenerateLayout {
  return inMonorepo ? "prism-monorepo" : "consumer-workspace";
}

function resolveAppRoot(repoRoot: string, layout: GenerateLayout): string {
  return layout === "consumer-workspace"
    ? path.join(repoRoot, "apps", "web")
    : repoRoot;
}

function prismPackagesPrefix(layout: GenerateLayout): string {
  return layout === "consumer-workspace"
    ? "../../prism/packages"
    : "../../packages";
}

/**
 * Create directory structure
 */
function createDirectoryStructure(targetDir: string, isStatic = false): void {
  const dirs = [
    "app",
    "app/system-sheet",
    "app/.well-known/vercel/flags",
    "app/api",
    "ui/styles",
    "docs",
    "config",
    ...(isStatic ? [] : ["database", "database/migrations"]),
    "intelligence/tasks",
    "cli",
    "scripts",
    "tests",
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
  isStatic = false
): Record<string, string> {
  if (layout === "prism-monorepo") {
    const deps: Record<string, string> = {
      "application-settings": "*",
      intelligence: "*",
      logger: "*",
      ui: "*",
      "@prism/utilities": "*",
      charts: "*",
      zod: "^4.4.3",
    };
    if (!isStatic) {
      Object.assign(deps, {
        database: "*",
        admin: "*",
        authentication: "*",
        "feature-flags": "*",
        flags: "^4.0.0",
        "better-auth": "^1.6.14",
        "@better-auth/drizzle-adapter": "^1.6.14",
        "@better-auth/api-key": "^1.6.14",
        "@better-auth/passkey": "^1.6.14",
      });
    }
    return deps;
  }

  const filePrefix = "file:../../prism/packages/";

  const deps: Record<string, string> = {
    "application-settings": `${filePrefix}application-settings`,
    intelligence: `${filePrefix}intelligence`,
    logger: `${filePrefix}logger`,
    ui: `${filePrefix}ui`,
    "@prism/utilities": `${filePrefix}utilities`,
    charts: `${filePrefix}charts`,
    zod: "^4.4.3",
  };
  if (!isStatic) {
    Object.assign(deps, {
      database: `${filePrefix}database`,
      admin: `${filePrefix}admin`,
      authentication: `${filePrefix}authentication`,
      "feature-flags": `${filePrefix}feature-flags`,
      flags: "^4.0.0",
      "better-auth": "^1.6.14",
      "@better-auth/drizzle-adapter": "^1.6.14",
      "@better-auth/api-key": "^1.6.14",
      "@better-auth/passkey": "^1.6.14",
    });
  }
  return deps;
}

function generateWebAppPackageJson(
  appRoot: string,
  appName: string,
  layout: GenerateLayout,
  prismRoot: string | null,
  isStatic = false
): void {
  const useWebpack = layout === "consumer-workspace";
  const packageManager = readPrismPackageManager(prismRoot);

  const dbScripts = isStatic
    ? {}
    : {
        "db:generate":
          "drizzle-kit generate --config=database/drizzle.config.ts",
        "db:migrate": "drizzle-kit migrate --config=database/drizzle.config.ts",
        "db:push": "drizzle-kit push --config=database/drizzle.config.ts",
        "db:studio": "drizzle-kit studio --config=database/drizzle.config.ts",
        "db:seed": "tsx database/seed.ts",
        "db:seed:admin": "tsx database/seed-admin.ts",
      };

  const serverRuntimeDeps = isStatic
    ? {}
    : {
        "@neondatabase/serverless": "^1.0.2",
        dotenv: "^17.4.2",
        "drizzle-orm": "^0.45.2",
      };

  const serverDevDeps = isStatic ? {} : { "drizzle-kit": "^0.31.10" };

  const packageJson = {
    name: layout === "consumer-workspace" ? "web" : appName,
    version: "0.1.0",
    private: true,
    ...(packageManager ? { packageManager } : {}),
    scripts: {
      dev: useWebpack
        ? "tsx ../../prism/scripts/run-next-dev.ts --webpack"
        : "tsx ../../prism/scripts/run-next-dev.ts",
      build: useWebpack ? "next build --webpack" : "next build",
      start: "next start",
      lint: "eslint app cli scripts tests",
      "lint:fix": "eslint app cli scripts tests --fix",
      format: 'prettier --write "app/**/*.{ts,tsx}" "*.{ts,tsx}" "*.{js,mjs}"',
      "format:check":
        'prettier --check "app/**/*.{ts,tsx}" "*.{ts,tsx}" "*.{js,mjs}"',
      typecheck: "tsc --noEmit",
      test: "vitest",
      "test:run": "vitest run",
      "quality:ci":
        "pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test:run && pnpm run build",
      ...dbScripts,
    },
    dependencies: {
      ...buildPrismDependencies(layout, isStatic),
      "@radix-ui/react-slot": "^1.2.4",
      "mapbox-gl": "^3.16.0",
      next: "16.2.7",
      react: "19.2.7",
      "react-dom": "19.2.7",
      ...serverRuntimeDeps,
      zod: "^4.3.6",
    },
    devDependencies: {
      "@tailwindcss/postcss": "^4.3.0",
      "@types/google.maps": "^3.64.0",
      "@types/node": "^25.9.1",
      "@types/react": "^19.2.16",
      "@types/react-dom": "^19.2.3",
      commander: "^15.0.0",
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
      ...serverDevDeps,
    },
  };

  fs.writeFileSync(
    path.join(appRoot, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf-8"
  );
}

/** npm-safe CLI binary name (e.g. my-app → my-app). */
function sanitizeCliBinName(appName: string): string {
  const normalized = appName
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized : "app";
}

function generateConsumerRepoPackageJson(
  repoRoot: string,
  appName: string,
  prismRoot: string | null
): void {
  const packageManager = readPrismPackageManager(prismRoot);
  const cliBin = sanitizeCliBinName(appName);

  const packageJson = {
    name: appName,
    version: "0.1.0",
    private: true,
    ...(packageManager ? { packageManager } : {}),
    engines: {
      node: "24.x",
    },
    bin: {
      [cliBin]: "./apps/web/cli/index.js",
    },
    scripts: {
      build: "pnpm --filter web run build",
      "build:web": "pnpm --filter web run build",
      chores: "tsx prism/scripts/chores.ts",
      clean: "rm -rf apps/*/.next apps/*/node_modules/.cache *.tsbuildinfo",
      "db:generate": "pnpm --filter web run db:generate",
      "db:migrate": "pnpm --filter web run db:migrate",
      "db:push": "pnpm --filter web run db:push",
      "db:seed": "pnpm --filter web run db:seed",
      "db:studio": "pnpm --filter web run db:studio",
      dev: "pnpm --filter web run dev",
      "dev:web": "pnpm --filter web run dev",
      format:
        'prettier --write "apps/web/**/*.{ts,tsx,js,mjs,cjs}" "docs/**/*.{md,mdx}"',
      "format:check":
        'prettier --check "apps/web/**/*.{ts,tsx,js,mjs,cjs}" "docs/**/*.{md,mdx}"',
      "generate:colors": "cd prism/packages/ui && pnpm run generate:colors",
      knip: "knip --dependencies",
      "knip:exports": "knip --exports",
      lint: "pnpm --filter web run lint",
      "lint:fix": "pnpm --filter web run lint:fix",
      precommit: "pnpm exec lint-staged",
      prepare: "husky && tsx prism/scripts/sync-commands.ts",
      "prism:sync": "tsx prism/scripts/sync.ts",
      "prism:sync:commands": "tsx prism/scripts/sync-commands.ts",
      "prism:sync:hooks": "tsx prism/scripts/install-consumer-git-hooks.ts",
      "prism:sync:dependencies": "tsx prism/scripts/sync-dependencies.ts",
      "prism:sync:git": "tsx prism/scripts/sync-git.ts",
      "prism:sync:scripts": "tsx prism/scripts/sync-scripts.ts",
      quality: "tsx prism/scripts/quality.ts",
      "quality:ci":
        "pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run knip && pnpm run test:run && pnpm run build",
      "quality:quick": "pnpm run format && pnpm run lint && pnpm run typecheck",
      setup: "pnpm link --global && pnpm run prism:sync",
      start: "pnpm --filter web run start",
      "start:web": "pnpm --filter web run start",
      [cliBin]: "tsx apps/web/cli/index.ts",
      test: "pnpm --filter web run test",
      "test:run": "pnpm --filter web run test:run",
      typecheck: "pnpm --filter web run typecheck",
      "vercel:build": "vercel build --cwd apps/web",
      "vercel:test:web": "pnpm --filter web run build",
    },
    devDependencies: {
      eslint: "^10.4.1",
      "eslint-config-next": "16.2.7",
      husky: "^9.1.7",
      knip: "^6.15.0",
      "lint-staged": "^17.0.7",
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
  isStatic = false
): void {
  generateWebAppPackageJson(appRoot, appName, layout, prismRoot, isStatic);

  if (layout === "consumer-workspace") {
    generateConsumerRepoPackageJson(repoRoot, appName, prismRoot);
  }
}

/**
 * Generate next.config.ts
 */
function generateNextConfig(
  appRoot: string,
  layout: GenerateLayout,
  isStatic = false
): void {
  const prismPrefix = prismPackagesPrefix(layout);

  const nextConfig =
    layout === "consumer-workspace" && isStatic
      ? `import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./config.app.json", "./config.prism.json"],
  },
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    "application-settings",
    "@prism/utilities",
    "charts",
    "logger",
    "ui",
  ],
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@logger": path.resolve(__dirname, "${prismPrefix}/logger/source"),
      "@logger/client": path.resolve(
        __dirname,
        "${prismPrefix}/logger/source/client"
      ),
      "@logger/server": path.resolve(
        __dirname,
        "${prismPrefix}/logger/source/server"
      ),
      "@ui": path.resolve(__dirname, "${prismPrefix}/ui/source"),
      "@utilities": path.resolve(
        __dirname,
        "${prismPrefix}/utilities/source"
      ),
    };
    config.resolve.symlinks = true;
    return config;
  },
};

export default nextConfig;
`
      : layout === "consumer-workspace"
        ? `import type { NextConfig } from "next";
import path from "path";

const kyselyShim = path.resolve(__dirname, "library/kysely-shim.ts");

const nextConfig: NextConfig = {
  // config.app.json + config.prism.json are bundled or read at runtime.
  outputFileTracingIncludes: {
    "/*": ["./config.app.json", "./config.prism.json"],
  },
  transpilePackages: [
    "application-settings",
    "@prism/utilities",
    "authentication",
    "better-auth",
    "intelligence",
    "logger",
    "ui",
    "admin",
    "charts",
    "feature-flags",
  ],
  turbopack: {
    resolveAlias: {
      kysely: kyselyShim,
    },
  },
  webpack: (config) => {
    const authenticationSource = path.resolve(
      __dirname,
      "${prismPrefix}/authentication/source"
    );

    config.resolve.alias = {
      ...config.resolve.alias,
      kysely: kyselyShim,
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
        path.resolve(__dirname, "../../prism/tools/**"),
      ],
    };

    return config;
  },
  serverExternalPackages: [
    "better-auth",
    "@better-auth/drizzle-adapter",
    "@better-auth/api-key",
    "@better-auth/kysely-adapter",
    "@better-auth/passkey",
    "kysely",
  ],
};

export default nextConfig;
`
        : `import type { NextConfig } from "next";
import path from "path";

const kyselyShim = path.resolve(__dirname, "library/kysely-shim.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["authentication"],
  serverExternalPackages: [
    "better-auth",
    "@better-auth/drizzle-adapter",
    "@better-auth/api-key",
    "@better-auth/kysely-adapter",
    "@better-auth/passkey",
    "kysely",
  ],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  turbopack: {
    resolveAlias: {
      kysely: kyselyShim,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      kysely: kyselyShim,
    };
    return config;
  },
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

  const paths = {
    "@/*": ["./*"],
    // Prism packages live outside apps/web; on Vercel prism/node_modules is absent.
    // Resolve React/Next from the app install for typecheck of transpiled packages.
    react: ["node_modules/@types/react/index.d.ts"],
    "react-dom": ["node_modules/@types/react-dom/index.d.ts"],
    "react/jsx-runtime": ["node_modules/@types/react/jsx-runtime.d.ts"],
    "react/jsx-dev-runtime": ["node_modules/@types/react/jsx-dev-runtime.d.ts"],
    next: ["node_modules/next/index.d.ts"],
    "next/*": ["node_modules/next/*"],
    "@database": [`${prismPrefix}/database/source`],
    "@intelligence": [`${prismPrefix}/intelligence/source`],
    "@logger": [`${prismPrefix}/logger/source`],
    "@logger/*": [`${prismPrefix}/logger/source/*`],
    "@intelligence/tasks": [`${prismPrefix}/intelligence/source/tasks`],
    "@intelligence/tasks/*": [`${prismPrefix}/intelligence/source/tasks/*`],
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
      : ["node_modules", "cli"];

  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      ignoreDeprecations: "6.0",
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
      baseUrl: ".",
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
  const content = `packages:
  - "apps/*"
  - "packages/*"

shamefullyHoist: true
strictPeerDependencies: false

overrides:
  next: 16.2.7
  react: 19.2.7
  react-dom: 19.2.7
  typescript-eslint: ^8.59.3

allowBuilds:
  better-sqlite3: true
  esbuild: true
  sharp: true
  unrs-resolver: true
`;
  fs.writeFileSync(
    path.join(repoRoot, "pnpm-workspace.yaml"),
    content,
    "utf-8"
  );
}

function generateConsumerDependabot(repoRoot: string): void {
  const dependabotDir = path.join(repoRoot, ".github");
  fs.mkdirSync(dependabotDir, { recursive: true });

  const content = `version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    groups:
      react-next:
        patterns:
          - "react"
          - "react-dom"
          - "next"
          - "eslint-config-next"
      typescript-eslint:
        patterns:
          - "@typescript-eslint/*"
          - "typescript-eslint"

  - package-ecosystem: "npm"
    directory: "/prism"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    groups:
      react-next:
        patterns:
          - "react"
          - "react-dom"
          - "next"
          - "eslint-config-next"
      typescript-eslint:
        patterns:
          - "@typescript-eslint/*"
          - "typescript-eslint"

  - package-ecosystem: "gitsubmodule"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    commit-message:
      prefix: "prism"
      include: "scope"
`;

  fs.writeFileSync(
    path.join(dependabotDir, "dependabot.yml"),
    content,
    "utf-8"
  );
}

function generateConsumerKnip(repoRoot: string): void {
  const content = `import type { KnipConfig } from "knip";

const nextAppEntry = [
  "app/**/{page,layout,route,loading,error,not-found,default,template,global-error}.{ts,tsx}",
  "app/**/route.ts",
];

/** Generated consumer workspace — scopes analysis to apps/web (not prism/). */
const config: KnipConfig = {
  ignoreBinaries: ["vercel"],
  workspaces: {
    "apps/web": {
      entry: [
        ...nextAppEntry,
        "database/drizzle.config.ts",
        "library/**/*.ts",
        "config/**/*.ts",
        "intelligence/tasks/**/*.ts",
        "cli/index.ts",
        "cli/index.js",
      ],
      project: [
        "app/**/*.{ts,tsx}",
        "cli/**/*.{ts,tsx,js}",
        "database/**/*.ts",
        "library/**/*.ts",
        "intelligence/**/*.ts",
        "config/**/*.ts",
        "scripts/**/*.{ts,cjs,mjs}",
        "tests/**/*.{ts,tsx}",
      ],
      ignore: ["../../prism/**"],
      ignoreDependencies: [
        "admin",
        "authentication",
        "charts",
        "database",
        "intelligence",
        "logger",
        "ui",
        "@prism/utilities",
        "@radix-ui/react-slot",
        "feature-flags",
        "flags",
        "lightningcss",
        "tw-animate-css",
        "tailwindcss",
        "postcss-import",
        "postcss-load-config",
      ],
    },
  },
};

export default config;
`;

  fs.writeFileSync(path.join(repoRoot, "knip.config.ts"), content, "utf-8");
}

async function generateConsumerHusky(repoRoot: string): Promise<void> {
  // Dynamic import: static import fails under tsx when tools.ts loads this module
  const { ensureConsumerHusky } = await import(
    pathToFileURL(path.join(PRISM_ROOT, "scripts/consumer-husky.ts")).href
  );
  ensureConsumerHusky(repoRoot);
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
  quality:
    name: Quality & build
    runs-on: ubuntu-latest
    env:
      CI: "true"
      NO_COLOR: "1"
      FORCE_COLOR: "0"
      NEXT_TELEMETRY_DISABLED: "1"
      DATABASE_URL: postgresql://ci:ci@127.0.0.1:5432/ci?sslmode=disable
      DATABASE_URL_UNPOOLED: postgresql://ci:ci@127.0.0.1:5432/ci?sslmode=disable
      GOOGLE_MAPS_API_KEY: ci_dummy_not_used_at_build
      BETTER_AUTH_SECRET: ci_dummy_better_auth_secret_32_chars!!
      BETTER_AUTH_URL: http://localhost:3000

    steps:
      - name: Checkout (with Prism submodule)
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Format check
        run: pnpm run format:check

      - name: Lint
        run: pnpm run lint

      - name: Typecheck
        run: pnpm run typecheck

      - name: Knip (dependencies)
        run: pnpm run knip

      - name: Tests
        run: pnpm run test:run

      - name: Cache Next.js build
        uses: actions/cache@v4
        with:
          path: apps/web/.next/cache
          key: \${{ runner.os }}-next-\${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: |
            \${{ runner.os }}-next-

      - name: Build
        run: pnpm run build
`;

  fs.writeFileSync(path.join(ciDir, "ci.yml"), ciContent, "utf-8");
}

function generateAppCliWrapper(appRoot: string): void {
  const wrapper = `#!/usr/bin/env node

/**
 * CLI wrapper — runs apps/web/cli/index.ts via tsx (for pnpm link / bin).
 */

const { spawn } = require("child_process");
const path = require("path");

const tsxPath = require.resolve("tsx/cli");
const cliPath = path.join(__dirname, "index.ts");

const child = spawn("node", [tsxPath, cliPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
`;

  fs.writeFileSync(path.join(appRoot, "cli/index.js"), wrapper, "utf-8");
  try {
    fs.chmodSync(path.join(appRoot, "cli/index.js"), 0o755);
  } catch {
    // Windows may not support chmod; bin still works via node
  }
}

/** Human-facing title from CLI app name (my-app → My App). */
function formatDisplayName(appName: string): string {
  return appName
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Prism manifest files: config.prism.json (platform) + config.app.json (app) + loaders.
 */
function generateApplicationManifestFiles(
  appRoot: string,
  appName: string,
  authGate: "admin" | "app" = "admin",
  isStatic = false
): void {
  const displayName = formatDisplayName(appName);

  const prismConfig: Record<string, unknown> = {
    app: {
      nameIdentifier: appName,
      nameDisplay: displayName,
      description: `${displayName} — generated with Prism.`,
      icon: "layers",
    },
    ...(isStatic ? { build: { output: "static" } } : {}),
    authentication: {
      gateMode: authGate,
      signInPathDropOff: "/",
    },
    deployments: {
      dev: {
        port: 3000,
      },
    },
  };
  fs.writeFileSync(
    path.join(appRoot, "config.prism.json"),
    `${JSON.stringify(prismConfig, null, 2)}\n`,
    "utf-8"
  );

  const appConfig = {
    // Add client-specific domain keys here (e.g. elections, featureFlags).
  };
  fs.writeFileSync(
    path.join(appRoot, "config.app.json"),
    `${JSON.stringify(appConfig, null, 2)}\n`,
    "utf-8"
  );

  const configDir = path.join(appRoot, "library/config");
  fs.mkdirSync(configDir, { recursive: true });

  const schemaTs = `import { z } from "zod";

/** Client-specific domain config (\`config.app.json\`) — unique per app. */
export const appConfigSchema = z.object({
  // e.g. elections: electionsConfigSchema,
});

export type AppConfig = z.infer<typeof appConfigSchema>;
`;

  const prismSchemaTs = `import { z } from "zod";

/** Prism-standard config (\`config.prism.json\`) — validated via application-settings. */
export { prismConfigBaseSchema as prismConfigSchema, type PrismConfigBase as PrismConfig } from "application-settings/prism-config-schema";
`;

  const indexTs = `import appConfigJson from "../../config.app.json";
import prismConfigJson from "../../config.prism.json";
import { resolveDevDeployment } from "application-settings/dev-deployment";
import {
  prismConfigBaseSchema,
  resolveAuthenticationGateMode,
  resolveSignInPathDropOff,
} from "application-settings/prism-config-schema";
import { appConfigSchema, type AppConfig } from "./schema";

export const appConfig: AppConfig = appConfigSchema.parse(appConfigJson);

export const prismConfig = prismConfigBaseSchema.parse(prismConfigJson);

/** Prism-standard app chrome (from config.prism.json → app). */
export const prismApp = prismConfig.app;

export const devDeployment = resolveDevDeployment(prismConfig, {
  monorepoPackageName: "${appName}",
});

export const DEV_PORT = devDeployment.port;
export const DEV_HOST = devDeployment.host;
export const DEV_APP_URL = devDeployment.url;
export const DEV_APP_ORIGINS = devDeployment.origins;

export const SIGN_IN_PATH_DROP_OFF = resolveSignInPathDropOff(prismConfig);

export const AUTH_GATE_MODE = resolveAuthenticationGateMode(prismConfig);
`;

  fs.writeFileSync(path.join(configDir, "schema.ts"), schemaTs, "utf-8");
  fs.writeFileSync(
    path.join(configDir, "prism-schema.ts"),
    prismSchemaTs,
    "utf-8"
  );
  fs.writeFileSync(path.join(configDir, "index.ts"), indexTs, "utf-8");
}

function generateAppScaffoldFiles(
  appRoot: string,
  appName: string,
  vars: Record<string, string>
): void {
  const scriptsReadme = `# scripts/

One-off maintenance scripts for **{{APP_NAME}}** (import routes, benchmarks, etc.).
Run with \`tsx scripts/your-script.ts\` from \`apps/web/\` or add root scripts that call into here.
`;

  fs.writeFileSync(
    path.join(appRoot, "scripts/README.md"),
    renderTemplate(scriptsReadme, vars),
    "utf-8"
  );

  const smokeTest = `import { describe, expect, it } from "vitest";

describe("{{APP_NAME}}", () => {
  it("scaffold smoke test", () => {
    expect(true).toBe(true);
  });
});
`;

  fs.writeFileSync(
    path.join(appRoot, "tests/smoke.test.ts"),
    renderTemplate(smokeTest, vars),
    "utf-8"
  );

  const cliIndexPath = path.join(appRoot, "cli/index.ts");
  if (fs.existsSync(cliIndexPath)) {
    const cliBin = sanitizeCliBinName(appName);
    const cliSource = fs.readFileSync(cliIndexPath, "utf-8");
    const updated = cliSource.replace(
      /program\.name\([^)]+\)/,
      `program.name("${cliBin}")`
    );
    if (updated !== cliSource) {
      fs.writeFileSync(cliIndexPath, updated, "utf-8");
    }
  }
}

/** Stable doc token for host-project filenames (e.g. my-app → MyApp). */
function formatProjectDocToken(appName: string): string {
  return appName
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

function readEnvExampleFromTemplate(): string {
  const templateDir = getTemplatesDir();
  const envExamplePath = path.join(templateDir, ".env.example");
  if (!fs.existsSync(envExamplePath)) {
    throw new Error(`Missing template .env.example at ${envExamplePath}`);
  }
  return fs.readFileSync(envExamplePath, "utf-8");
}

function writeAppEnvFiles(appRoot: string): void {
  const envContent = readEnvExampleFromTemplate();
  for (const name of [".env.example", ".env"]) {
    fs.writeFileSync(path.join(appRoot, name), envContent, "utf-8");
  }
}

function generateConsumerGitignore(repoRoot: string): void {
  const gitignore = `# dependencies (never commit installs)
/node_modules
**/node_modules
**/node_modules/
node_modules.bak/
**/.pnpm-store
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/apps/*/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# cursor slash commands (copied from prism via prism:sync:commands)
.cursor/commands/

# typescript
*.tsbuildinfo
next-env.d.ts

# database
*.db
*.db-wal
*.db-shm
data/
`;

  fs.writeFileSync(path.join(repoRoot, ".gitignore"), gitignore, "utf-8");
}

function generateConsumerRepoDocs(
  repoRoot: string,
  appName: string,
  vars: Record<string, string>
): void {
  const projectToken = formatProjectDocToken(appName);
  const docsDir = path.join(repoRoot, "docs");
  fs.mkdirSync(docsDir, { recursive: true });

  const architecture = `# ARCHITECTURE-${projectToken}

Mental model for **{{APP_NAME}}**: a Prism consumer app with the submodule at \`prism/\`.

This matches [ARCHITECTURE-Prism.md](../prism/docs/ARCHITECTURE-Prism.md) and apps like Porch Scope / TimeTraveler:

- **\`pnpm install\` at repo root** — not only inside \`prism/\`
- **Next.js app** under **\`apps/web/\`**
- **Dependencies**: \`file:../../prism/packages/...\` in \`apps/web/package.json\`
- **TypeScript paths**: \`../../prism/packages/*/source\` in \`apps/web/tsconfig.json\`
- **Next.js**: \`--webpack\` dev/build; \`transpilePackages\` + webpack aliases in \`apps/web/next.config.ts\`
- **Styles**: Prism globals imported from \`apps/web/ui/styles/globals.css\`

## Layout

\`\`\`
{{APP_NAME}}/
  prism/                 # git submodule
  apps/
    web/                 # Next.js App Router (pnpm workspace name: web)
      app/
      database/
      intelligence/tasks/
      ui/styles/
      config/
      cli/
      scripts/
      tests/
      docs/              # in-app notes (MDX)
  docs/                  # ARCHITECTURE-*, DATABASE-*, CLI-*, MILESTONES-*, decisions/
  knip.config.ts
  .github/               # ci.yml, dependabot.yml
  package.json           # pnpm --filter web, prism:sync, quality:ci, …
  pnpm-workspace.yaml
\`\`\`

## Decisions

Architecture decision records live under **\`docs/decisions/\`** (\`NNN-DECISION-short-slug.md\`). See [DOCS-Prism.md](../prism/docs/DOCS-Prism.md).

## Customize

Describe your domain, data flow, and auth model here. Link to \`prism/docs/\` for Prism-owned behavior (admin, UI, flags, database patterns).
`;

  const conventions = `# CONVENTIONS-${projectToken}

Project token for doc filenames: **${projectToken}** (\`ARCHITECTURE-${projectToken}.md\`, this file).

## Commands

Run from **repo root**: \`pnpm run dev\`, \`pnpm run build\`, \`pnpm run quality:ci\`, \`pnpm run prism:sync\`, \`pnpm run chores\`.

## Environment

- **\`apps/web/.env\`** — local secrets (gitignored)
- **\`apps/web/.env.example\`** — committed template

## Code layout

- App code only under **\`apps/web/\`**
- Shared Prism packages under **\`prism/packages/\`**
- Add app-owned packages under **\`packages/\`** when needed (update \`pnpm-workspace.yaml\`)

## Decision records

- Directory: **\`docs/decisions/\`**
- Filename: **\`NNN-DECISION-short-slug.md\`** (three-digit prefix, increasing)
- Document **why**, not full **how** — link to code paths under \`Where Implemented\`

See [DOCS-Prism.md](../prism/docs/DOCS-Prism.md) for documentation philosophy.
`;

  const decisionsDir = path.join(docsDir, "decisions");
  fs.mkdirSync(decisionsDir, { recursive: true });

  const initialDecision = `# 001-DECISION-consumer-workspace-layout

Decision record (see [DOCS-Prism.md](../../prism/docs/DOCS-Prism.md): document **why**, not full **how**—implementation lives in code).

## Context

- **{{APP_NAME}}** is a Prism consumer app: Next.js UI plus shared packages from the **\`prism/\`** git submodule.
- We need one deployable git repo, Vercel-friendly installs, and the same ergonomics as mature consumers (TimeTraveler, Porch Scope).
- Running \`pnpm install\` only inside \`prism/\` duplicates dependencies and breaks alignment with the app.

## Decision

- **Repo root** orchestrates scripts (\`pnpm --filter web\`, \`prism:sync\`, database commands).
- **Next.js app** lives at **\`apps/web/\`** (pnpm workspace package name \`web\`).
- **Prism** is a **git submodule** at **\`prism/\`** with \`file:../../prism/packages/...\` dependencies in \`apps/web/package.json\`.
- **Docs**: app mental model in \`docs/ARCHITECTURE-${projectToken}.md\`; ADRs in \`docs/decisions/\`.
- **Env**: \`apps/web/.env.example\` (committed) and \`apps/web/.env\` (gitignored, created on generate).

## Pros

- Matches Prism \`generate\` output and existing consumer repos — no flat-root layout drift.
- Vercel **Root Directory** \`apps/web\` with install \`cd ../.. && pnpm install\`.
- Submodule lets you commit Prism changes from the app repo when iterating on shared packages.

## Cons / Risks

- Contributors must learn to run commands from **repo root**, not only \`apps/web/\`.
- Git submodules require \`submodules: recursive\` in CI and on Vercel.

## Follow-Ups

- Add domain-specific ADRs as **\`002-DECISION-…\`**, **\`003-DECISION-…\`** under \`docs/decisions/\`.
- Flesh out \`docs/ARCHITECTURE-${projectToken}.md\` with your data flow and auth model.

## Where Implemented

- Scaffold: \`prism generate\` ([GENERATE-Prism.md](../../prism/docs/GENERATE-Prism.md))
- Workspace: \`pnpm-workspace.yaml\`, root \`package.json\`, \`apps/web/package.json\`
- Prism layout reference: [ARCHITECTURE-Prism.md](../../prism/docs/ARCHITECTURE-Prism.md)
`;

  fs.writeFileSync(
    path.join(docsDir, `ARCHITECTURE-${projectToken}.md`),
    renderTemplate(architecture, vars),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(docsDir, `CONVENTIONS-${projectToken}.md`),
    renderTemplate(conventions, vars),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(decisionsDir, "001-DECISION-consumer-workspace-layout.md"),
    renderTemplate(initialDecision, vars),
    "utf-8"
  );

  const decisionsReadme = `# decisions/

Architecture decision records (ADRs) for **{{APP_NAME}}**.

| File | Topic |
| --- | --- |
| [001-DECISION-consumer-workspace-layout.md](./001-DECISION-consumer-workspace-layout.md) | \`apps/web/\` + \`prism/\` submodule layout |

Add **\`002-DECISION-short-slug.md\`**, **\`003-…\`** as you make product choices (API vendors, storage, charting, auth, …). See [DOCS-Prism.md](../../prism/docs/DOCS-Prism.md).
`;

  const databaseDoc = `# DATABASE-${projectToken}

Quick reference for schema shape and query patterns. **Canonical columns and types:** \`apps/web/database/schema.ts\` — verify there first.

See [ARCHITECTURE-${projectToken}.md](./ARCHITECTURE-${projectToken}.md) for the mental model and [DATABASE-Prism.md](../prism/docs/DATABASE-Prism.md) for Prism database patterns.

## Stack

- **Drizzle ORM** with **PostgreSQL** (Neon) by default
- Env: \`DATABASE_URL\` / \`DATABASE_URL_UNPOOLED\` in \`apps/web/.env\`

## Commands (repo root)

\`\`\`bash
pnpm run db:generate
pnpm run db:migrate
pnpm run db:push
pnpm run db:studio
pnpm run db:seed
\`\`\`

## Customize

Document your tables, relationships, and indexing choices here. Link domain ADRs under \`docs/decisions/\` when schema choices need a **why**.
`;

  const cliDoc = `# CLI-${projectToken}

App CLI for **{{APP_NAME}}** (Commander + tsx).

## Quick start

\`\`\`bash
pnpm run setup          # optional: pnpm link --global
pnpm run ${sanitizeCliBinName(appName)} --help
# or
pnpm exec ${sanitizeCliBinName(appName)} --help
\`\`\`

Implementation: \`apps/web/cli/index.ts\` (bin wrapper: \`apps/web/cli/index.js\`).

## Customize

Add commands under \`apps/web/cli/\` and document them here. For Prism tooling, see [CLI-Prism.md](../prism/docs/CLI-Prism.md).
`;

  const milestonesDoc = `# MILESTONES-${projectToken}

Discrete, testable milestones for **{{APP_NAME}}**. Philosophy: [DOCS-Prism.md](../prism/docs/DOCS-Prism.md).

## Milestone 1: Foundation

_Goal: App runs locally with database and Prism auth wired._

- [ ] \`pnpm install\` at repo root, submodule initialized
- [ ] \`apps/web/.env\` configured (Neon + \`PRISM_KEY_*\`)
- [ ] \`pnpm run db:push\` / migrations applied
- [ ] \`pnpm run dev\` — app loads at localhost
- [ ] \`pnpm run quality:ci\` passes locally

## Milestone 2: Domain core

_Goal: Describe your primary user flow._

- [ ] …

## Milestone 3: Production

_Goal: Vercel deploy with submodules._

- [ ] Root Directory \`apps/web\`, install \`cd ../.. && pnpm install\`
- [ ] CI green on \`main\`

Add checkboxes as you ship; keep **why** in \`docs/decisions/\` when choices are non-obvious.
`;

  fs.writeFileSync(
    path.join(decisionsDir, "README.md"),
    renderTemplate(decisionsReadme, vars),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(docsDir, `DATABASE-${projectToken}.md`),
    renderTemplate(databaseDoc, vars),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(docsDir, `CLI-${projectToken}.md`),
    renderTemplate(cliDoc, vars),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(docsDir, `MILESTONES-${projectToken}.md`),
    renderTemplate(milestonesDoc, vars),
    "utf-8"
  );
}

function generateConsumerReadme(
  repoRoot: string,
  appName: string,
  vars: Record<string, string>
): void {
  const projectToken = formatProjectDocToken(appName);
  const cliBin = sanitizeCliBinName(appName);

  const readme = `# {{APP_NAME}}

Next.js app generated with **Prism** (\`prism/\` git submodule). The UI and API live in **\`apps/web/\`** — not at the repo root.

Architecture and conventions: **[DOCS-Prism.md](prism/docs/DOCS-Prism.md)**.

### Prerequisites

- **Node.js** **24.x** (\`engines\` in \`package.json\`)
- **pnpm** — version in \`packageManager\`. \`corepack enable\` then \`pnpm -v\`.

### Quick start

\`\`\`bash
git submodule update --init --recursive
pnpm install
# Edit apps/web/.env (created from .env.example during generate)
pnpm run db:push
pnpm run dev
\`\`\`

Open http://localhost:3000 (or the port in \`apps/web/package.json\`).

### Documentation

| Doc | Purpose |
| --- | --- |
| [ARCHITECTURE-${projectToken}.md](docs/ARCHITECTURE-${projectToken}.md) | Mental model — fill in your domain |
| [DATABASE-${projectToken}.md](docs/DATABASE-${projectToken}.md) | Schema / query notes |
| [CLI-${projectToken}.md](docs/CLI-${projectToken}.md) | App CLI (\`${cliBin}\`) |
| [MILESTONES-${projectToken}.md](docs/MILESTONES-${projectToken}.md) | Delivery checklist |
| [docs/decisions/](docs/decisions/) | ADRs (\`001\` scaffolded) |
| [prism/docs/](prism/docs/) | Prism UI, admin, deployment, sync |

### Daily commands (repo root)

| Task | Command |
| --- | --- |
| Dev server | \`pnpm run dev\` |
| Build | \`pnpm run build\` |
| CI parity | \`pnpm run quality:ci\` |
| Lint / typecheck | \`pnpm run lint\` / \`pnpm run typecheck\` |
| Knip | \`pnpm run knip\` |
| Database | \`pnpm run db:push\` / \`pnpm run db:studio\` |
| Align with Prism | \`pnpm run prism:sync\` |
| Monthly health | \`pnpm run chores\` |

Do **not** run \`pnpm install\` only inside \`prism/\` — install once at repo root.

### Project health & CI

- **CI:** [.github/workflows/ci.yml](.github/workflows/ci.yml) — submodules, format, lint, knip, test, build
- **Dependabot:** [.github/dependabot.yml](.github/dependabot.yml) — root, \`prism/\`, submodule SHA
- **Commits:** Husky + lint-staged (\`.lintstagedrc.cjs\`)
- **CLI:** \`pnpm run setup\` then \`${cliBin} --help\`

### Vercel

- **Root Directory**: \`apps/web\`
- **Install Command**: \`cd ../.. && pnpm install\`
- **Build Command**: \`pnpm run build\`
- Enable **submodules** on the Git integration

### Working on Prism

\`\`\`bash
cd prism
# edit packages, commit, push to github.com/thushana/prism
cd ..
git add prism && git commit -m "Update Prism submodule"
\`\`\`

See [GENERATE-Prism.md](prism/docs/GENERATE-Prism.md) and [DEPLOYMENT-Prism.md](prism/docs/DEPLOYMENT-Prism.md).
`;

  fs.writeFileSync(
    path.join(repoRoot, "README.md"),
    renderTemplate(readme, vars),
    "utf-8"
  );
}

function patchGlobalsCss(appRoot: string, layout: GenerateLayout): void {
  if (layout === "prism-monorepo") {
    return;
  }

  const globalsPath = path.join(appRoot, "ui/styles/globals.css");
  if (!fs.existsSync(globalsPath)) {
    return;
  }

  fs.writeFileSync(
    globalsPath,
    `/* Tailwind from app workspace; Prism theme from submodule (see ARCHITECTURE-Prism.md). */\n@import "tailwindcss";\n@import "tw-animate-css";\n@import "../../../../prism/packages/ui/styles/globals-prism.css";\n\n@source "../**/*.{ts,tsx,js,jsx,mdx}";\n@source "../../app/**/*.{ts,tsx,js,jsx,mdx}";\n`,
    "utf-8"
  );
}

/**
 * Get templates directory path
 * Uses apps/web as the template source (the actual working app)
 */
function getTemplatesDir(): string {
  const appsWebPath = path.join(PRISM_ROOT, "apps", "web");
  if (fs.existsSync(appsWebPath)) {
    return appsWebPath;
  }
  throw new Error(
    `Could not find apps/web at ${appsWebPath}. Run generate from a Prism checkout with apps/web.`
  );
}

/**
 * Recursively copy template files from apps/web directory
 * Skips build artifacts, dependencies, and generated files
 */
function copyTemplateFiles(
  sourceDir: string,
  targetDir: string,
  vars: Record<string, string>,
  isStatic = false
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
    "lib", // Legacy Next convention — Prism apps use library/ only
    ...(isStatic
      ? [
          "database",
          "library/authentication",
          "library/kysely-shim.ts",
          "config/auth.ts",
          "proxy.ts",
        ]
      : []),
    "package.json", // Skip package.json (generated separately with correct name)
    "tsconfig.json", // Skip tsconfig.json (generated separately with correct paths)
    "next.config.ts", // Skip next.config.ts (generated separately with correct config)
    ".env.example", // Written from template via writeAppEnvFiles
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
function generateTemplateFiles(
  targetDir: string,
  appName: string,
  isStatic = false
): void {
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
  copyTemplateFiles(templateSourceDir, targetDir, vars, isStatic);
  if (!isStatic) {
    writeAppEnvFiles(targetDir);
  }
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
    log.info(
      `Layout: ${chalk.bold("apps/web")} + ${chalk.bold("./prism")} submodule`
    );
  } else if (prismRoot) {
    log.info(`Saving to Prism monorepo: ${targetDir}`);
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

    if (!inMonorepo) {
      const defaultPrismRepo = "https://github.com/thushana/prism.git";
      log.info(
        `📦 Adding ${chalk.bold("💎 Prism")} as git submodule at ./prism`
      );
      log.info("📁 Next.js app at apps/web/");
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

    const layout = resolveGenerateLayout(inMonorepo);
    const repoRoot = targetDir;
    const appRoot = resolveAppRoot(repoRoot, layout);
    const installRoot = layout === "consumer-workspace" ? repoRoot : appRoot;
    const dbCommandRoot = layout === "consumer-workspace" ? repoRoot : appRoot;

    const isStatic = options.static === true;

    log.info("Creating directory structure...");
    createDirectoryStructure(appRoot, isStatic);

    log.info("Generating template files...");
    const consumerPrismRoot =
      layout === "consumer-workspace" ? path.join(repoRoot, "prism") : null;

    generatePackageJson(
      repoRoot,
      appRoot,
      appName,
      layout,
      inMonorepo ? prismRoot : consumerPrismRoot,
      isStatic
    );
    generateTsConfig(appRoot, layout);
    generateNextConfig(appRoot, layout, isStatic);
    generateNvmrc(repoRoot);
    const templateVars = { APP_NAME: appName };

    if (layout === "consumer-workspace") {
      generatePnpmWorkspaceYaml(repoRoot);
      generateConsumerDependabot(repoRoot);
      generateConsumerKnip(repoRoot);
      await generateConsumerHusky(repoRoot);
      generateConsumerWorkspaceCi(repoRoot);
      generateConsumerGitignore(repoRoot);
      generateConsumerRepoDocs(repoRoot, appName, templateVars);
      generateConsumerReadme(repoRoot, appName, templateVars);
    }
    generateApplicationManifestFiles(
      appRoot,
      appName,
      options.authGate ?? "admin",
      isStatic
    );
    generateTemplateFiles(appRoot, appName, isStatic);
    assertAppUsesLibraryDir(appRoot);
    if (layout === "consumer-workspace") {
      generateAppCliWrapper(appRoot);
      generateAppScaffoldFiles(appRoot, appName, templateVars);
    }
    patchGlobalsCss(appRoot, layout);

    log.info(
      isStatic
        ? "Environment: static export — no DATABASE_URL required"
        : "Environment: apps/web/.env.example + apps/web/.env (edit before db:push)"
    );

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
        log.warn(`Please run '${installCmd}' manually from ${installRoot}`);
      }
    }

    if (!isStatic) {
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
      log.info("  Edit apps/web/.env (DATABASE_URL, PRISM_KEY_WEB, …)");
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
    .description(
      "Scaffold a Next.js app with Prism (consumer: apps/web + prism submodule)"
    )
    .option("-v, --verbose", "Enable verbose logging", false)
    .option("-d, --debug", "Enable debug logging", false)
    .option("-f, --force", "Overwrite existing directory if it exists", false)
    .option(
      "-p, --path <path>",
      "Consumer repo directory (creates apps/web/ + prism/ submodule)"
    )
    .option(
      "--auth-gate <mode>",
      "Session gate: admin (default, /admin only) or app (full UI via proxy)",
      "admin"
    )
    .option(
      "--static",
      "Static export scaffold (build.output: static, no auth/DB)",
      false
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
