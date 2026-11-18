import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@utilities": path.resolve(__dirname, "../utilities/source"),
      "@prism/utilities": path.resolve(__dirname, "../utilities/source"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    passWithNoTests: true,
  },
});
