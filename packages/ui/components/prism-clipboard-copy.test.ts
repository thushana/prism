import { describe, expect, it } from "vitest";
import { prismLocationHashUrl } from "./prism-clipboard-copy";

describe("prismLocationHashUrl", () => {
  it("keeps the current path and search and appends the hash id", () => {
    expect(
      prismLocationHashUrl("item-17", {
        origin: "https://cityobservatory.example",
        pathname: "/jurisdictions/alameda/city-council/2026/11/26",
        search: "?q=budget",
      })
    ).toBe(
      "https://cityobservatory.example/jurisdictions/alameda/city-council/2026/11/26?q=budget#item-17"
    );
  });
});
