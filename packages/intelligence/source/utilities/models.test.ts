import { describe, expect, it } from "vitest";

import { calculateCost, resolveModel } from "./models";

describe("models utilities", () => {
  it("resolves provider/model identifiers", () => {
    const resolved = resolveModel("google/gemini-3-flash");
    expect(resolved?.id).toBe("google/gemini-3-flash");
    expect(resolved?.config.provider).toBe("google");
  });

  it("resolves legacy aliases to provider/model IDs", () => {
    const resolved = resolveModel("gpt-5-nano");
    expect(resolved?.id).toBe("openai/gpt-5-nano");
    expect(resolved?.config.apiIdentifier).toBe("gpt-5-nano");
  });

  it("calculates cost with fully-qualified IDs", () => {
    const cost = calculateCost("openai/gpt-5-nano", {
      promptTokens: 1_000,
      completionTokens: 2_000,
    });
    expect(cost).toBeCloseTo(0.00085, 10);
  });
});
