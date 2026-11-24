import path from "node:path";
import { defineConfig } from "vitest/config";

const reactRoot = path.resolve(__dirname, "../../node_modules/react");
const reactDomRoot = path.resolve(__dirname, "../../node_modules/react-dom");

export default defineConfig({
  resolve: {
    alias: {
      // Peer react can land in packages/ui/node_modules while react-dom stays
      // hoisted — pin both to the workspace root so hooks share one dispatcher.
      react: reactRoot,
      "react-dom": reactDomRoot,
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
