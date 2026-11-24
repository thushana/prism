import type { NextConfig } from "next";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "path";
import { assertRequiredVercelEnv } from "application-settings/assert-required-vercel-env";

assertRequiredVercelEnv();

const require = createRequire(__filename);
const kyselyShim = path.resolve(__dirname, "library/kysely-shim.ts");
const kyselyOriginal = require.resolve("kysely");

const prismRoot = path.join(__dirname, "../..");
const parentRoot = path.join(prismRoot, "..");
const parentWorkspaceFile = path.join(parentRoot, "pnpm-workspace.yaml");
/** Embedder apps (e.g. city-observatory) list `prism/packages/*` in their workspace. */
const embeddedInApp =
  fs.existsSync(parentWorkspaceFile) &&
  /(?:^|\n)\s*-\s*["']?prism\/packages\/\*/.test(
    fs.readFileSync(parentWorkspaceFile, "utf8")
  );
// Turbopack refuses CSS deps resolved via the parent node_modules when root is
// only `prism/`. Widen to the embedder root so those paths stay in-bounds.
const monorepoRoot = embeddedInApp ? parentRoot : prismRoot;

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["ui", "lucide-react", "gsap"],
  },
  transpilePackages: [
    "@prism/utilities",
    "application-settings",
    "authentication",
    "database",
    "feature-flags",
    "intelligence",
    "logger",
    "admin",
    "ui",
  ],
  serverExternalPackages: [
    "better-auth",
    "@better-auth/drizzle-adapter",
    "@better-auth/api-key",
    "@better-auth/passkey",
  ],
  outputFileTracingRoot: monorepoRoot,
  async redirects() {
    return [
      {
        source: "/admin/system-sheet",
        destination: "/admin/app/system",
        permanent: false,
      },
    ];
  },
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      "kysely-original": kyselyOriginal,
      // Exact package name only — shim re-exports via kysely-original.
      kysely: kyselyShim,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "kysely-original": kyselyOriginal,
      // Exact match so the shim's `kysely-original` import is not redirected.
      kysely$: kyselyShim,
      "@ui": path.resolve(__dirname, "../../packages/ui/source"),
      "@ui/map": path.resolve(__dirname, "../../packages/ui/source/map.ts"),
      "@ui/pickers": path.resolve(
        __dirname,
        "../../packages/ui/source/pickers.ts"
      ),
    };

    // Exclude CLI and tools directories from webpack watch mode
    // These are not needed for the web app build and should be ignored
    // This optimizes dev builds by preventing webpack from watching these directories
    // Production builds already exclude unimported files via tree-shaking
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
        "**/tools/**",
        // Exclude tools directory from monorepo root (prism/tools)
        path.resolve(__dirname, "../../tools/**"),
      ],
    };

    return config;
  },
};

export default nextConfig;
