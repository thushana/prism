import { describe, expect, it } from "vitest";
import {
  assertRequiredVercelEnv,
  collectRequiredVercelEnvProblems,
} from "./assert-required-vercel-env";

const complete = {
  VERCEL: "1",
  VERCEL_ENV: "production",
  DATABASE_URL: "postgresql://x",
  BETTER_AUTH_SECRET: "ci_dummy_better_auth_secret_32_chars!!",
  BETTER_AUTH_URL: "https://example.com",
} as const;

describe("collectRequiredVercelEnvProblems", () => {
  it("is a no-op outside Vercel", () => {
    expect(collectRequiredVercelEnvProblems({ env: {} })).toEqual([]);
  });

  it("reports missing core keys on Vercel", () => {
    expect(
      collectRequiredVercelEnvProblems({
        env: { VERCEL: "1", VERCEL_ENV: "production" },
      })
    ).toEqual([
      "missing: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL",
    ]);
  });

  it("includes consumer additional keys", () => {
    expect(
      collectRequiredVercelEnvProblems({
        env: { ...complete, GOOGLE_MAPS_API_KEY: undefined },
        additionalKeys: ["GOOGLE_MAPS_API_KEY"],
      })[0]
    ).toContain("GOOGLE_MAPS_API_KEY");
  });

  it("rejects localhost auth URL in production", () => {
    expect(
      collectRequiredVercelEnvProblems({
        env: {
          ...complete,
          BETTER_AUTH_URL: "http://localhost:3000",
        },
      })
    ).toContain(
      "BETTER_AUTH_URL must be the public production URL (not localhost)"
    );
  });

  it("rejects *.localhost auth URL in production", () => {
    expect(
      collectRequiredVercelEnvProblems({
        env: {
          ...complete,
          BETTER_AUTH_URL: "http://app.localhost:3800",
        },
      })
    ).toContain(
      "BETTER_AUTH_URL must be the public production URL (not localhost)"
    );
  });
});

describe("assertRequiredVercelEnv", () => {
  it("throws with a clear message when incomplete", () => {
    expect(() =>
      assertRequiredVercelEnv({
        env: { VERCEL: "1", VERCEL_ENV: "preview" },
      })
    ).toThrow(/Refusing Vercel build \(preview\)/);
  });

  it("passes when complete", () => {
    expect(() => assertRequiredVercelEnv({ env: { ...complete } })).not.toThrow();
  });
});
