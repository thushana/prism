import { describe, expect, it } from "vitest";
import {
  enforceRateLimit,
  getClientIp,
  resetRateLimitsForTests,
} from "./rate-limit";

describe("getClientIp", () => {
  it("uses the first x-forwarded-for address", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });
    expect(getClientIp(request)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip then unknown", () => {
    const realIpRequest = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    expect(getClientIp(realIpRequest)).toBe("198.51.100.2");
    expect(getClientIp(new Request("https://example.com"))).toBe("unknown");
  });
});

describe("enforceRateLimit", () => {
  it("allows attempts within the window", () => {
    resetRateLimitsForTests();
    const options = { maxAttempts: 2, windowMs: 60_000 };

    enforceRateLimit("test-key", options);
    enforceRateLimit("test-key", options);

    expect(() => enforceRateLimit("test-key", options)).toThrow(
      expect.objectContaining({ status: 429 })
    );
  });

  it("tracks limits separately per key", () => {
    resetRateLimitsForTests();
    const options = { maxAttempts: 2, windowMs: 60_000 };

    enforceRateLimit("a", options);
    enforceRateLimit("a", options);
    enforceRateLimit("b", options);

    expect(() => enforceRateLimit("a", options)).toThrow();
    enforceRateLimit("b", options);
  });
});
