import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readApplicationSettingsFromDirectory } from "./read-application-settings";

/** Host app root when this package lives under `host/prism/packages/...` (e.g. TimeTraveler). */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const hostAppJsonPath = join(repoRoot, "app.json");
const hostHasAppJson = existsSync(hostAppJsonPath);

describe("readApplicationSettingsFromDirectory", () => {
  it.skipIf(!hostHasAppJson)("parses repo app.json", () => {
    const settings = readApplicationSettingsFromDirectory(repoRoot);
    expect(settings.displayName).toBe("TimeTraveler");
    expect(settings.description.length).toBeGreaterThan(0);
    expect(settings.icon).toBe("train-front");
  });
});
