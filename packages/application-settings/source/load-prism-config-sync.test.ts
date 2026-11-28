import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  resolveCheckoutRoot,
  resolveMonorepoPackageName,
} from "./load-prism-config-sync";

describe("resolveCheckoutRoot", () => {
  it("treats a pnpm-workspace.yaml ancestor as the checkout root", () => {
    const root = mkdtempSync(path.join(tmpdir(), "prism-checkout-"));
    const appRoot = path.join(root, "apps", "web");
    mkdirSync(appRoot, { recursive: true });
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ name: "demo-app" })
    );
    writeFileSync(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
    writeFileSync(
      path.join(appRoot, "package.json"),
      JSON.stringify({ name: "web" })
    );

    expect(resolveCheckoutRoot(appRoot)).toBe(root);
    expect(resolveMonorepoPackageName(appRoot)).toBe("demo-app");
  });
});
