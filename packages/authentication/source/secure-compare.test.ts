import { describe, expect, it } from "vitest";
import { secureCompare } from "./secure-compare";

describe("secureCompare", () => {
  it("returns true when strings match", () => {
    expect(secureCompare("secret-key", "secret-key")).toBe(true);
  });

  it("returns false when strings differ", () => {
    expect(secureCompare("wrong", "secret-key")).toBe(false);
  });

  it("returns false when either value is missing", () => {
    expect(secureCompare(null, "secret-key")).toBe(false);
    expect(secureCompare("secret-key", undefined)).toBe(false);
  });
});
