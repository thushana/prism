import { describe, expect, it } from "vitest";
import { allowBuildEnvFallback } from "./build-env-fallback";

describe("allowBuildEnvFallback", () => {
  it("never allows fallback on Vercel", () => {
    expect(
      allowBuildEnvFallback({
        VERCEL: "1",
        NEXT_PHASE: "phase-production-build",
        CI: "true",
      })
    ).toBe(false);
  });

  it("allows fallback for local production builds", () => {
    expect(
      allowBuildEnvFallback({
        NEXT_PHASE: "phase-production-build",
      })
    ).toBe(true);
  });

  it("allows fallback for CI", () => {
    expect(allowBuildEnvFallback({ CI: "true" })).toBe(true);
    expect(allowBuildEnvFallback({ CI: "1" })).toBe(true);
  });

  it("denies fallback for normal runtime", () => {
    expect(allowBuildEnvFallback({ NODE_ENV: "production" })).toBe(false);
  });
});
