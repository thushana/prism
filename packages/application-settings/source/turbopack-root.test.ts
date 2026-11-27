import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveTurbopackRoot } from "./turbopack-root";

const tempRoots: string[] = [];

function makeTree(segments: string[]): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "prism-turbopack-root-"));
  tempRoots.push(root);
  const dir = path.join(root, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("resolveTurbopackRoot", () => {
  it("pins static and server consumers to their repo when a parent workspace exists", () => {
    const appDir = makeTree(["grandparent", "host", "apps", "web"]);
    const host = path.resolve(appDir, "../..");
    const grandparent = path.resolve(host, "..");
    fs.writeFileSync(
      path.join(grandparent, "pnpm-workspace.yaml"),
      'packages:\n  - "apps/*"\n'
    );
    fs.writeFileSync(
      path.join(host, "pnpm-workspace.yaml"),
      'packages:\n  - "apps/*"\n  - "packages/*"\n'
    );

    expect(resolveTurbopackRoot(appDir)).toBe(host);
  });

  it("widens embedded Prism apps/web to the host that vendors prism/packages", () => {
    const appDir = makeTree(["host", "prism", "apps", "web"]);
    const host = path.resolve(appDir, "../../..");
    fs.writeFileSync(
      path.join(host, "pnpm-workspace.yaml"),
      'packages:\n  - "apps/*"\n  - "prism/packages/*"\n'
    );

    expect(resolveTurbopackRoot(appDir)).toBe(host);
  });

  it("keeps a standalone Prism app at the Prism repo root", () => {
    const appDir = makeTree(["prism", "apps", "web"]);
    const prism = path.resolve(appDir, "../..");

    expect(resolveTurbopackRoot(appDir)).toBe(prism);
  });
});
