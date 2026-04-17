import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readApplicationSettingsFromDirectory } from "./read-application-settings";

/** TimeTraveler repo root when `pnpm test:run` runs from `prism/packages/application-settings`. */
const repoRoot = join(process.cwd(), "../../..");

describe("readApplicationSettingsFromDirectory", () => {
  it("parses repo app.json", () => {
    const settings = readApplicationSettingsFromDirectory(repoRoot);
    expect(settings.displayName).toBe("TimeTraveler");
    expect(settings.description.length).toBeGreaterThan(0);
    expect(settings.icon).toBe("train-front");
  });
});
