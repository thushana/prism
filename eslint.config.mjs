import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Replaces .eslintignore (flat config ignores)
  globalIgnores([
    ".next/**",
    "**/.next/**",
    "out/**",
    "**/out/**",
    "build/**",
    "**/build/**",
    "dist/**",
    "**/dist/**",
    "next-env.d.ts",
    "**/next-env.d.ts",
    "*.tsbuildinfo",
    "**/*.tsbuildinfo",
    "node_modules/**",
    "**/node_modules/**",
    ".next",
    "**/.next",
    ".cache/**",
    "**/.cache/**",
    ".vercel/**",
    "**/.vercel/**",
    "*.log",
    "**/*.log",
  ]),
  // Prism root has no pages dir; packages/tools are not Next apps
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  // Test files: allow explicit any for mocks and fixtures
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Allow _prefixed vars/args for intentionally unused (e.g. _level, _error, _chart1)
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
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
