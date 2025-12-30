import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Exclude CLI and tools directories from webpack watch mode
    // These are not needed for the web app build and should be ignored
    // This optimizes dev builds by preventing webpack from watching these directories
    // Production builds already exclude unimported files via tree-shaking
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...(Array.isArray(config.watchOptions?.ignored)
          ? config.watchOptions.ignored
          : config.watchOptions?.ignored
          ? [config.watchOptions.ignored]
          : []),
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
