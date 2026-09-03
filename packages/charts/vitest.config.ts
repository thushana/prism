import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // These helpers/themes are SSR-safe (they default when `window` is undefined),
    // so we don't need a DOM environment for unit tests.
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
