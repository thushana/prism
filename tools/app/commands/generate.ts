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
    exclude: ["node_modules"],
  };

  fs.writeFileSync(
    path.join(targetDir, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2) + "\n",
    "utf-8"
  );
}

/**
 * Generate all template files
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

  // next.config.ts
  writeTemplateFile(
    targetDir,
    "next.config.ts",
    `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
`,
    vars
  );

  // postcss.config.mjs
  writeTemplateFile(
    targetDir,
    "postcss.config.mjs",
    `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`,
    vars
  );

  // vercel.json
  writeTemplateFile(
    targetDir,
    "vercel.json",
    `{
  "regions": ["iad1"],
  "functions": {
    "app/**/*.ts": {
      "maxDuration": 10
    },
    "app/**/*.tsx": {
      "maxDuration": 10
    }
  }
}
`,
    vars
  );

  // .eslintrc.json
  writeTemplateFile(
    targetDir,
    ".eslintrc.json",
    `{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
`,
    vars
  );

  // .prettierrc
  writeTemplateFile(
    targetDir,
    ".prettierrc",
    `{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2
}
`,
    vars
  );

  // .gitignore
  writeTemplateFile(
    targetDir,
    ".gitignore",
    `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
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

# typescript
*.tsbuildinfo
next-env.d.ts

# database
*.db
*.db-wal
*.db-shm
data/
`,
    vars
  );

  // .env.example
  writeTemplateFile(
    targetDir,
    ".env.example",
    `# Database
DATABASE_URL=./data/database/sqlite.db

# For production, use a PostgreSQL connection string:
# DATABASE_URL=postgresql://user:password@host:5432/dbname
`,
    vars
  );

  // .env (auto-copy from .env.example)
  writeTemplateFile(
    targetDir,
    ".env",
    `# Database
DATABASE_URL=./data/database/sqlite.db

# For production, use a PostgreSQL connection string:
# DATABASE_URL=postgresql://user:password@host:5432/dbname
`,
    vars
  );

  // app/layout.tsx
  writeTemplateFile(
    targetDir,
    "app/layout.tsx",
    `import type { Metadata } from "next";
import { satoshi } from "{{UI_IMPORT}}";
import "../ui/styles/globals.css";

export const metadata: Metadata = {
  title: "{{APP_NAME}}",
  description: "Generated with Prism",
  other: {
    "material-symbols-font":
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional"
          rel="stylesheet"
        />
      </head>
      <body className={\`\${satoshi.variable} antialiased\`}>{children}</body>
    </html>
  );
}
`,
    vars
  );

  // app/page.tsx (Prism demo)
  writeTemplateFile(
    targetDir,
    "app/page.tsx",
    `import { Button } from "{{UI_IMPORT}}";
import { Card, CardContent, CardHeader, CardTitle } from "{{UI_IMPORT}}";
import { db } from "../database/db";

export default async function Home() {
  // Example: Query database
  let userCount = 0;
  try {
    // @ts-expect-error - Drizzle beta query API types
    const users = await db.query.users.findMany();
    userCount = users.length;
  } catch (error) {
    // Database might not be initialized yet
    console.error("Database query failed:", error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-4xl">{{APP_NAME}}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Welcome to your Prism-powered Next.js app!
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Users in database: {userCount}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`,
    vars
  );

  // app/dev-sheet/page.tsx
  writeTemplateFile(
    targetDir,
    "app/dev-sheet/page.tsx",
    `import { DevSheetPage } from "{{DEV_SHEET_IMPORT}}";
import type { DevSheetData } from "{{DEV_SHEET_IMPORT}}";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getProtocol(host: string): string {
  if (process.env.VERCEL_URL) return "https";
  if (host.includes("localhost")) return "http";
  return "https";
}

async function fetchDevSheetData(): Promise<DevSheetData | null> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = getProtocol(host);
    const baseUrl = \`\${protocol}://\${host}\`;

    const res = await fetch(\`\${baseUrl}/api/dev-sheet\`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json?.success ? json.data : null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to fetch dev-sheet data:", error);
    }
    return null;
  }
}

export default async function Page() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_DEV_SHEET !== "true"
  ) {
    return null;
  }

  const data = await fetchDevSheetData();

  return <DevSheetPage data={data} />;
}
`,
    vars
  );

  // app/api/dev-sheet/route.ts
  writeTemplateFile(
    targetDir,
    "app/api/dev-sheet/route.ts",
    `import { NextResponse } from "next/server";
import type { DevSheetData } from "{{DEV_SHEET_IMPORT}}";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getGitInfo() {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  async function safeExec(cmd: string, args: string[]): Promise<string | undefined> {
    try {
      const { stdout } = await execFileAsync(cmd, args, { timeout: 1000 });
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  const repoOwner = process.env.VERCEL_GIT_REPO_OWNER;
  const repoSlug = process.env.VERCEL_GIT_REPO_SLUG;
  const envCommit = process.env.VERCEL_GIT_COMMIT_SHA;

  const repositoryUrl =
    repoOwner && repoSlug
      ? \`https://github.com/\${repoOwner}/\${repoSlug}\`
      : await safeExec("git", ["config", "--get", "remote.origin.url"]);

  const commitSha = envCommit || (await safeExec("git", ["rev-parse", "HEAD"]));
  const commitMessage =
    process.env.VERCEL_GIT_COMMIT_MESSAGE ||
    (await safeExec("git", ["log", "-1", "--format=%s"]));
  const branch =
    process.env.VERCEL_GIT_COMMIT_REF ||
    (await safeExec("git", ["rev-parse", "--abbrev-ref", "HEAD"]));
  const status =
    process.env.VERCEL || process.env.NODE_ENV === "production"
      ? "clean"
      : (await safeExec("git", ["status", "--porcelain"]))?.trim() === ""
        ? "clean"
        : "dirty";

  return {
    repositoryUrl: repositoryUrl?.replace(/\\.git$/, ""),
    status: status || "unknown",
    branch: branch || undefined,
    commitSha: commitSha || undefined,
    commitMessage: commitMessage || undefined,
  };
}

function getVercelInfo() {
  if (!process.env.VERCEL) return undefined;
  return {
    env: process.env.VERCEL_ENV || "unknown",
    url: process.env.VERCEL_URL
      ? \`https://\${process.env.VERCEL_URL}\`
      : undefined,
    region: process.env.VERCEL_REGION || undefined,
    buildTime: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const git = await getGitInfo();
    const vercel = getVercelInfo();

    const data: DevSheetData = {
      apps: [],
      shadcn: {
        style: "default",
        iconLibrary: "material-symbols",
        baseColor: "neutral",
        components: [],
      },
      components: {
        shadcn: [],
        custom: [],
        app: [],
      },
      techStack: {
        framework: "Next.js 16.1.1",
        language: "TypeScript 5.9.3",
        styling: "Tailwind CSS 4.1.17",
        database: "Drizzle ORM beta",
        testing: "None",
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "development",
      },
      git,
      dependencies: { key: [] },
      vercel,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Failed to get dev-sheet data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dev-sheet data" },
      { status: 500 }
    );
  }
}
`,
    vars
  );

  // ui/styles/globals.css
  writeTemplateFile(
    targetDir,
    "ui/styles/globals.css",
    `@import "tailwindcss";
@source "../**/*.{ts,tsx,js,jsx,mdx}";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-satoshi);
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground font-sans;
  }
  h1 {
    @apply text-4xl font-bold;
  }
  h2 {
    @apply text-3xl font-semibold;
  }
  h3 {
    @apply text-2xl font-semibold;
  }
  h4 {
    @apply text-xl font-medium;
  }
  h5 {
    @apply text-lg font-medium;
  }
  h6 {
    @apply text-base font-medium;
  }
  .material-symbols-rounded {
    font-family: "Material Symbols Rounded";
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: "liga";
    -webkit-font-smoothing: antialiased;
  }
}

@layer components {
  .typography-h1 {
    font-family: var(--font-satoshi);
    font-size: 2.25rem;
    line-height: 2.5rem;
    font-weight: 700;
  }
  .typography-h2 {
    font-family: var(--font-satoshi);
    font-size: 1.875rem;
    line-height: 2.25rem;
    font-weight: 600;
  }
  .typography-h3 {
    font-family: var(--font-satoshi);
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 600;
  }
  .typography-h4 {
    font-family: var(--font-satoshi);
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 500;
  }
  .typography-h5 {
    font-family: var(--font-satoshi);
    font-size: 1.125rem;
    line-height: 1.75rem;
    font-weight: 500;
  }
  .typography-h6 {
    font-family: var(--font-satoshi);
    font-size: 1rem;
    line-height: 1.5rem;
    font-weight: 500;
  }
  .typography-subtitle1 {
    font-family: var(--font-satoshi);
    font-size: 1rem;
    line-height: 1.5rem;
    font-weight: 600;
  }
  .typography-subtitle2 {
    font-family: var(--font-satoshi);
    font-size: 0.95rem;
    line-height: 1.4rem;
    font-weight: 500;
  }
  .typography-body1 {
    font-family: var(--font-satoshi);
    font-size: 1rem;
    line-height: 1.5rem;
    font-weight: 400;
  }
  .typography-body2 {
    font-family: var(--font-satoshi);
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 400;
  }
  .typography-button {
    font-family: var(--font-satoshi);
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
  }
  .typography-caption {
    font-family: var(--font-satoshi);
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 400;
  }
  .typography-overline {
    font-family: var(--font-satoshi);
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .typography-label {
    font-family: var(--font-satoshi);
    font-size: 0.8125rem;
    line-height: 1.25rem;
    font-weight: 500;
  }
}
`,
    vars
  );

  // docs/index.mdx
  writeTemplateFile(
    targetDir,
    "docs/index.mdx",
    `# {{APP_NAME}} Documentation

Welcome to your Prism-powered application!

## Getting Started

This app was generated with \`prism generate\` and includes:

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS
- Drizzle ORM with SQLite (dev) / PostgreSQL (prod)
- Prism core packages

## Development

\`\`\`bash
npm run dev
\`\`\`

Visit http://localhost:3000

## Database

\`\`\`bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema (dev only)
npm run db:push

# Open Drizzle Studio
npm run db:studio
\`\`\`

## Deployment

This app is configured for Vercel deployment. See \`vercel.json\` for configuration.
`,
    vars
  );

  // database/drizzle.config.ts
  writeTemplateFile(
    targetDir,
    "database/drizzle.config.ts",
    `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./database/schema.ts",
  out: "./database/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL || "./data/database/sqlite.db",
  },
});
`,
    vars
  );

  // database/schema.ts
  writeTemplateFile(
    targetDir,
    "database/schema.ts",
    `import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Example table - replace with your actual schema
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
`,
    vars
  );

  // database/db.ts
  writeTemplateFile(
    targetDir,
    "database/db.ts",
    `import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import * as path from "path";
import * as fs from "fs";

const dbPath = path.resolve(
  process.cwd(),
  process.env.DATABASE_URL || "./data/database/sqlite.db"
);
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.exec(\`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  )
\`);
// @ts-expect-error - Beta version type definitions don't match runtime API yet
export const db = drizzle(sqlite, { schema });
export const databasePath = dbPath;

// Export schema for convenience
export * from "./schema";
`,
    vars
  );

  // database/seed.ts
  writeTemplateFile(
    targetDir,
    "database/seed.ts",
    `import Database from "better-sqlite3";
import { databasePath } from "./db";
import * as fs from "fs";

async function seed() {
  try {
    console.log(\`cwd: \${process.cwd()}\`);
    console.log(\`Using database at: \${databasePath}\`);
    console.log(\`DB exists: \${fs.existsSync(databasePath)}\`);

    const sqlite = new Database(databasePath);
    sqlite.exec(\`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      );
      DELETE FROM users;
      INSERT INTO users (name, email, created_at) VALUES
        ('Alice', 'alice@example.com', strftime('%s','now')),
        ('Bob', 'bob@example.com', strftime('%s','now'));
    \`);
    sqlite.close();

    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
    process.exit(1);
  }
}

seed();
`,
    vars
  );

  // intelligence/tasks/exampleTask.ts
  writeTemplateFile(
    targetDir,
    "intelligence/tasks/exampleTask.ts",
    `/**
 * Example AI Task
 * 
 * This is a starter task demonstrating the Prism intelligence system.
 * Replace with your own tasks following the BaseTask pattern.
 */

import { BaseTask } from "{{INTELLIGENCE_IMPORT}}/tasks/base";
import type { TaskConfig, ExecutionResult } from "{{INTELLIGENCE_IMPORT}}/tasks/types";
import { z } from "zod";

const inputSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
});

const outputSchema = z.object({
  result: z.string(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

export class ExampleTask extends BaseTask<Input, Output> {
  name = "example-task";
  description = "An example AI task";
  inputSchema = inputSchema;
  outputSchema = outputSchema;

  defaultConfig: TaskConfig = {
    model: "google/gemini-3-flash",
    temperature: 0.7,
    maxTokens: 500,
    retries: 3,
  };

  protected async executeTask(
    input: Input,
    _config: TaskConfig
  ): Promise<ExecutionResult<Output>> {
    // TODO: Implement your task logic here
    // This is a placeholder that returns the input as output
    return {
      data: {
        result: \`Processed: \${input.prompt}\`,
      },
      usage: {
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      },
    };
  }
}
`,
    vars
  );

  // cli/index.ts
  writeTemplateFile(
    targetDir,
    "cli/index.ts",
    `#!/usr/bin/env node

/**
 * CLI Entry Point
 * 
 * Add your CLI commands here for local maintenance and tasks.
 */

import { Command } from "commander";

const program = new Command();

program
  .name("cli")
  .description("CLI tools for {{APP_NAME}}")
  .version("0.1.0");

program
  .command("example")
  .description("Example command")
  .action(() => {
    console.log("Hello from {{APP_NAME}} CLI!");
  });

program.parse(process.argv);
`,
    vars
  );

  // public/favicon.ico placeholder (create empty file, user can replace)
  writeTemplateFile(targetDir, "public/.gitkeep", "", vars);
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
