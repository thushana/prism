import type { NextConfig } from "next";
import path from "path";

const kyselyShim = path.resolve(__dirname, "library/kysely-shim.ts");

const nextConfig: NextConfig = {
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
  outputFileTracingRoot: path.join(__dirname, "../.."),
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
    resolveAlias: {
      kysely: kyselyShim,
      "@ui": path.resolve(__dirname, "../../packages/ui/source"),
      "@ui/map": path.resolve(__dirname, "../../packages/ui/source/map.ts"),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      kysely: kyselyShim,
      "@ui": path.resolve(__dirname, "../../packages/ui/source"),
      "@ui/map": path.resolve(__dirname, "../../packages/ui/source/map.ts"),
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
