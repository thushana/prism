import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PRISM_CONFIG_FILE_NAME } from "./config-file-names";
import { readApplicationSettingsFromDirectory } from "./read-application-settings";

/** Host app root when this package lives under `host/prism/packages/...`. */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const hostPrismConfigPath = join(repoRoot, PRISM_CONFIG_FILE_NAME);
const hostLegacyPrismConfigPath = join(repoRoot, "prism.config.json");
const hostAppJsonPath = join(repoRoot, "app.json");
const hostHasConfig =
  existsSync(hostPrismConfigPath) ||
  existsSync(hostLegacyPrismConfigPath) ||
  existsSync(hostAppJsonPath);

describe("readApplicationSettingsFromDirectory", () => {
  it.skipIf(!hostHasConfig)(
    "parses repo config.prism.json or legacy manifests",
    () => {
      const settings = readApplicationSettingsFromDirectory(repoRoot);
      expect(settings.displayName.length).toBeGreaterThan(0);
      expect(settings.description.length).toBeGreaterThan(0);
    }
  );
});
