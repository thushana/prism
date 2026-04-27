import { describe, expect, it } from "vitest";
import { prismTypographySentenceCaseFromIdentifier } from "./prism-typography-sentence-case";

describe("prismTypographySentenceCaseFromIdentifier", () => {
  it("splits camelCase into sentence case", () => {
    expect(prismTypographySentenceCaseFromIdentifier("textAlign")).toBe(
      "Text align"
    );
    expect(prismTypographySentenceCaseFromIdentifier("animationZone")).toBe(
      "Animation zone"
    );
    expect(prismTypographySentenceCaseFromIdentifier("animationKind")).toBe(
      "Animation kind"
    );
    expect(prismTypographySentenceCaseFromIdentifier("textTransform")).toBe(
      "Text transform"
    );
  });

  it("handles snake_case and hyphens", () => {
    expect(prismTypographySentenceCaseFromIdentifier("TEXT_ALIGN")).toBe(
      "Text align"
    );
    expect(prismTypographySentenceCaseFromIdentifier("text-wrap")).toBe(
      "Text wrap"
    );
  });

  it("handles font", () => {
    expect(prismTypographySentenceCaseFromIdentifier("font")).toBe("Font");
  });
});
