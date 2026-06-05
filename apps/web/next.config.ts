import type { NextConfig } from "next";
import path from "path";

const kyselyShim = path.resolve(__dirname, "lib/kysely-shim.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["authentication"],
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
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      kysely: kyselyShim,
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
