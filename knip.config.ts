import type { KnipConfig } from "knip";

const nextAppEntry = [
  "app/**/{page,layout,route,loading,error,not-found,default,template,global-error}.{ts,tsx}",
  "app/**/route.ts",
];

const webPaths = {
  "@/*": ["./*"],
  "@cli": ["../../packages/cli/source"],
  "@database": ["../../packages/database/source"],
  "@database/*": ["../../packages/database/source/*"],
  "@intelligence": ["../../packages/intelligence/source"],
  "@intelligence/*": ["../../packages/intelligence/source/*"],
  "@logger": ["../../packages/logger/source"],
  "@logger/*": ["../../packages/logger/source/*"],
  "@ui": ["../../packages/ui/source"],
  "@utilities": ["../../packages/utilities/source"],
  "@admin": ["../../packages/admin/source"],
  "@authentication": ["../../packages/authentication/source"],
  "@authentication/*": ["../../packages/authentication/source/*"],
};

const loggerPathsFromPackage = {
  "@logger": ["../logger/source"],
  "@logger/*": ["../logger/source/*"],
};

/**
 * Dead-code and dependency hygiene for the Prism monorepo.
 *
 * - Workspaces mirror pnpm (root, apps/web, packages/*, tools).
 * - Path aliases match tsconfig so workspace deps resolve correctly.
 * - Workspace package names are ignored where imports use tsconfig aliases (@ui, @logger, …).
 * - CI/chores run `pnpm knip` (--dependencies) for unlisted/unused deps and orphan files.
 * - Run `pnpm knip:exports` locally when tightening the public export surface.
 */
const config: KnipConfig = {
  workspaces: {
    ".": {
      entry: ["scripts/*.ts"],
      project: ["scripts/**/*.ts"],
      ignoreBinaries: ["drizzle-kit", "lsof", "pkill"],
      ignoreDependencies: ["husky", "swr", "lightningcss", "concurrently"],
      drizzle: { config: [] },
    },
    "apps/web": {
      entry: [
        ...nextAppEntry,
        "cli/**/*.{ts,js}",
        "database/drizzle.config.ts",
        "intelligence/**/*.ts",
      ],
      project: [
        "app/**/*.{ts,tsx}",
        "cli/**/*.{ts,js}",
        "config/**/*.{ts,tsx}",
        "database/**/*.{ts,tsx}",
        "intelligence/**/*.ts",
      ],
      paths: webPaths,
      ignoreDependencies: [
        "@prism/utilities",
        "@radix-ui/react-slot",
        "admin",
        "database",
        "intelligence",
        "lightningcss",
        "logger",
        "tailwindcss",
        "tw-animate-css",
        "ui",
      ],
      drizzle: { config: [] },
    },
    "packages/*": {
      entry: ["source/index.ts"],
      project: ["**/*.{ts,tsx}"],
      ignore: ["**/*.test.ts", "**/*.test.tsx"],
    },
    "packages/admin": {
      paths: {
        "@ui": ["../ui/source"],
        "@utilities": ["../utilities/source"],
      },
      ignoreDependencies: ["ui", "@prism/utilities"],
    },
    "packages/ui": {
      paths: {
        "@utilities": ["../utilities/source"],
      },
      ignoreDependencies: [
        "clsx",
        "tailwind-merge",
        "@types/mapbox-gl",
        "@prism/utilities",
        "mapbox-gl",
      ],
    },
    "packages/cli": {
      paths: loggerPathsFromPackage,
      ignoreDependencies: ["@types/inquirer", "logger"],
    },
    "packages/intelligence": {
      paths: loggerPathsFromPackage,
      ignoreDependencies: ["ai", "logger"],
    },
    "packages/database": {
      ignoreDependencies: ["drizzle-kit"],
      drizzle: { config: [] },
    },
    "packages/charts": {
      ignoreDependencies: ["@nivo/core", "@nivo/colors", "@nivo/tooltip"],
    },
    "packages/logger": {
      ignoreDependencies: ["server-only", "@vitejs/plugin-react"],
    },
    tools: {
      entry: ["app/tools.ts"],
      project: ["app/**/*.{ts,tsx,mjs}"],
      ignoreDependencies: ["@prism/cli", "database", "logger"],
    },
  },
  ignoreBinaries: ["vercel"],
};

export default config;
