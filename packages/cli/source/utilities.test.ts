import { describe, it, expect } from "vitest";
import { parseList } from "./utilities";

describe("parseList", () => {
  it("parses simple comma-separated values", () => {
    expect(parseList("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("preserves commas inside quoted values", () => {
    expect(parseList('"Route, A",Route B')).toEqual(["Route, A", "Route B"]);
  });

  it("handles escaped quotes inside quoted values", () => {
    expect(parseList('"Route \\"A\\"",Route B')).toEqual([
      'Route "A"',
      "Route B",
    ]);
  });

  it("parses JSON array input", () => {
    expect(parseList('["Route 1","Route, 2"]')).toEqual([
      "Route 1",
      "Route, 2",
    ]);
  });
});
