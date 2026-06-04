import { describe, expect, it } from "vitest";
import { verifyKey } from "./core";

describe("verifyKey", () => {
  it("returns true when strings match", () => {
    expect(verifyKey("secret-key", "secret-key")).toBe(true);
  });

  it("returns false when strings differ", () => {
    expect(verifyKey("wrong", "secret-key")).toBe(false);
  });

  it("returns false when either value is missing", () => {
    expect(verifyKey("", "secret-key")).toBe(false);
    expect(verifyKey("secret-key", undefined)).toBe(false);
  });
});
