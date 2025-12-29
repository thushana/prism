import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "**/.next/**",
    "out/**",
    "**/out/**",
    "build/**",
    "**/build/**",
    "next-env.d.ts",
    "**/next-env.d.ts",
    "node_modules/**",
    "**/node_modules/**",
    ".next",
    "**/.next",
  ]),
  {
    rules: {
      // Enforce @ prefixed imports for packages (only exact matches, not relative paths)
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "database",
              message:
                "Package imports must use @ prefix. Use '@database' instead of 'database'.",
            },
            {
              name: "cli",
              message:
                "Package imports must use @ prefix. Use '@cli' instead of 'cli'.",
            },
            {
              name: "logger",
              message:
                "Package imports must use @ prefix. Use '@logger' instead of 'logger'.",
            },
            {
              name: "ui",
              message:
                "Package imports must use @ prefix. Use '@ui' instead of 'ui'.",
            },
            {
              name: "utilities",
              message:
                "Package imports must use @ prefix. Use '@utilities' instead of 'utilities'.",
            },
            {
              name: "intelligence",
              message:
                "Package imports must use @ prefix. Use '@intelligence' instead of 'intelligence'.",
            },
            {
              name: "system-sheet",
              message:
                "Package imports must use @ prefix. Use '@system-sheet' instead of 'system-sheet'.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
