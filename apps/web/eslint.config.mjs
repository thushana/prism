import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "*.tsbuildinfo",
  ]),
  {
    settings: {
      react: { version: "19" },
    },
  },
  {
    files: ["app/**/*.{ts,tsx}", "**/*.{ts,tsx}"],
    rules: {
      // Add any custom rules here if needed
    },
  },
]);
