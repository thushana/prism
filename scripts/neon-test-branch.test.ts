import { describe, expect, it } from "vitest";
import { formatEnvValue, upsertEnvKeys } from "./neon-test-branch";

describe("formatEnvValue", () => {
  it("quotes values that contain dotenv-breaking characters", () => {
    expect(formatEnvValue("plain")).toBe("plain");
    expect(formatEnvValue("p@ss#word")).toBe('"p@ss#word"');
  });
});

describe("upsertEnvKeys", () => {
  it("appends missing keys", () => {
    const { next, changed } = upsertEnvKeys("FOO=1\n", {
      DATABASE_URL_TEST: "postgres://pooled",
      DATABASE_URL_TEST_UNPOOLED: "postgres://direct",
    });
    expect(changed).toBe(true);
    expect(next).toContain("FOO=1");
    expect(next).toContain("DATABASE_URL_TEST=postgres://pooled");
    expect(next).toContain("DATABASE_URL_TEST_UNPOOLED=postgres://direct");
  });

  it("quotes secrets that would break unquoted .env lines", () => {
    const { next } = upsertEnvKeys("", {
      DATABASE_URL_TEST: "postgres://u:p#x@host/db",
    });
    expect(next).toContain('DATABASE_URL_TEST="postgres://u:p#x@host/db"');
  });

  it("replaces existing keys without duplicating", () => {
    const previous = [
      "DATABASE_URL=prod",
      "DATABASE_URL_TEST=old",
      "OTHER=x",
      "",
    ].join("\n");
    const { next, changed } = upsertEnvKeys(previous, {
      DATABASE_URL_TEST: "new",
    });
    expect(changed).toBe(true);
    expect(next.match(/DATABASE_URL_TEST=/g)).toHaveLength(1);
    expect(next).toContain("DATABASE_URL_TEST=new");
    expect(next).toContain("DATABASE_URL=prod");
    expect(next).toContain("OTHER=x");
  });

  it("removes keys when value is null", () => {
    const previous = "A=1\nDATABASE_URL_TEST=gone\nB=2\n";
    const { next, changed } = upsertEnvKeys(previous, {
      DATABASE_URL_TEST: null,
    });
    expect(changed).toBe(true);
    expect(next).not.toContain("DATABASE_URL_TEST");
    expect(next).toContain("A=1");
    expect(next).toContain("B=2");
  });

  it("is a no-op when values already match", () => {
    const previous = "DATABASE_URL_TEST=same\n";
    const { next, changed } = upsertEnvKeys(previous, {
      DATABASE_URL_TEST: "same",
    });
    expect(changed).toBe(false);
    expect(next).toBe(previous);
  });
});
