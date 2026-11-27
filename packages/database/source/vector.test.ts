import { describe, expect, it } from "vitest";

import { DEFAULT_HALFVEC_DIMENSIONS, halfvec, vector } from "./vector";

describe("vector helpers", () => {
  it("exports the locked halfvec default dimensions", () => {
    expect(DEFAULT_HALFVEC_DIMENSIONS).toBe(1024);
  });

  it("builds halfvec and vector column builders with dimensions", () => {
    const half = halfvec("embedding", {
      dimensions: DEFAULT_HALFVEC_DIMENSIONS,
    });
    const full = vector("embedding_full", { dimensions: 1536 });

    expect(half).toBeTruthy();
    expect(full).toBeTruthy();
  });
});
