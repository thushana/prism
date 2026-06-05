import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  assertAppUsesLibraryDir,
  assertNoLegacyLibImports,
  discoverPrismAppRoots,
} from "./assert-app-library-layout";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "prism-app-layout-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function writeRequiredLibraryFiles(appRoot: string): void {
  for (const relativePath of [
    "library/authentication/authentication.ts",
    "library/authentication/authentication-gates.ts",
    "library/authentication/authentication-api.ts",
    "library/kysely-shim.ts",
    "library/config/index.ts",
  ]) {
    const fullPath = path.join(appRoot, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, "export {};\n", "utf-8");
  }
}

describe("discoverPrismAppRoots", () => {
  it("finds flat app root and apps/web", () => {
    const repo = makeTempDir();
    fs.writeFileSync(
      path.join(repo, "config.prism.json"),
      JSON.stringify({ app: { nameDisplay: "A", description: "d" } })
    );
    const appsWeb = path.join(repo, "apps", "web");
    fs.mkdirSync(appsWeb, { recursive: true });
    fs.writeFileSync(
      path.join(appsWeb, "config.prism.json"),
      JSON.stringify({ app: { nameDisplay: "B", description: "d" } })
    );

    expect(discoverPrismAppRoots(repo).sort()).toEqual([repo, appsWeb].sort());
  });
});

describe("assertAppUsesLibraryDir", () => {
  it("throws when lib/ exists", () => {
    const appRoot = makeTempDir();
    writeRequiredLibraryFiles(appRoot);
    fs.mkdirSync(path.join(appRoot, "lib"));

    expect(() => assertAppUsesLibraryDir(appRoot)).toThrow(
      /must not include lib/
    );
  });
});

describe("assertNoLegacyLibImports", () => {
  it("throws on @/lib/ imports", () => {
    const appRoot = makeTempDir();
    fs.mkdirSync(path.join(appRoot, "app"), { recursive: true });
    fs.writeFileSync(
      path.join(appRoot, "app", "page.tsx"),
      `import { auth } from "@/lib/auth";\n`,
      "utf-8"
    );

    expect(() => assertNoLegacyLibImports(appRoot)).toThrow(/@\/library\//);
  });
});
