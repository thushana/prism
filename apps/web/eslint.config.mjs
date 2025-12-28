import { fixupConfigRules } from "@eslint/compat";
import nextPlugin from "eslint-config-next";

const nextConfig = fixupConfigRules(nextPlugin);

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "*.tsbuildinfo",
    ],
  },
  ...nextConfig,
  {
    files: ["app/**/*.{ts,tsx}", "**/*.{ts,tsx}"],
    rules: {
      // Add any custom rules here if needed
    },
  },
];
