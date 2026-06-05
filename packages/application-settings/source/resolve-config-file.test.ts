import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  APP_CONFIG_FILE_CANDIDATES,
  PRISM_CONFIG_FILE_CANDIDATES,
} from "./config-file-names";
import { resolveExistingConfigFile } from "./resolve-config-file";

describe("resolveExistingConfigFile", () => {
  it("prefers config.prism.json over prism.config.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "prism-config-"));
    writeFileSync(
      join(dir, "prism.config.json"),
      JSON.stringify({ legacy: true })
    );
    writeFileSync(
      join(dir, "config.prism.json"),
      JSON.stringify({ current: true })
    );

    expect(resolveExistingConfigFile(dir, PRISM_CONFIG_FILE_CANDIDATES)).toBe(
      join(dir, "config.prism.json")
    );
  });

  it("falls back to app.config.json when config.app.json is absent", () => {
    const dir = mkdtempSync(join(tmpdir(), "prism-config-"));
    writeFileSync(
      join(dir, "app.config.json"),
      JSON.stringify({ elections: {} })
    );

    expect(resolveExistingConfigFile(dir, APP_CONFIG_FILE_CANDIDATES)).toBe(
      join(dir, "app.config.json")
    );
  });
});
