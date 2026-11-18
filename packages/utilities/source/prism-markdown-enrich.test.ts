import { describe, expect, it } from "vitest";
import {
  isPrismMarkdownSectionHeading,
  prismMarkdownEnrich,
} from "./prism-markdown-enrich";

const ALAMEDA_BODY = `To: Honorable Mayor and Members of the City Council
From: Gerry Beaudin, City Manager

EXECUTIVE SUMMARY

Alameda Municipal Power (AMP) is removing overhead utilities.

BACKGROUND

This project continues Underground Utility District work.`;

describe("isPrismMarkdownSectionHeading", () => {
  it("accepts ALL-CAPS section titles", () => {
    expect(isPrismMarkdownSectionHeading("EXECUTIVE SUMMARY")).toBe(true);
    expect(isPrismMarkdownSectionHeading("BACKGROUND")).toBe(true);
    expect(isPrismMarkdownSectionHeading("UNAPPROVED")).toBe(true);
    expect(isPrismMarkdownSectionHeading("FISCAL IMPACT:")).toBe(true);
  });

  it("rejects lines with digits, mixed case, or too many words", () => {
    expect(isPrismMarkdownSectionHeading("RESOLUTION NO. 15934")).toBe(false);
    expect(isPrismMarkdownSectionHeading("UUD 38")).toBe(false);
    expect(isPrismMarkdownSectionHeading("Executive Summary")).toBe(false);
    expect(
      isPrismMarkdownSectionHeading("ONE TWO THREE FOUR FIVE SIX SEVEN")
    ).toBe(false);
  });
});

describe("prismMarkdownEnrich", () => {
  it("promotes blank-line-bounded ALL-CAPS lines in document mode", () => {
    const markdown = prismMarkdownEnrich(ALAMEDA_BODY, { mode: "document" });
    expect(markdown).toContain("## EXECUTIVE SUMMARY");
    expect(markdown).toContain("## BACKGROUND");
    expect(markdown).toMatch(/^To: Honorable Mayor/m);
    expect(markdown).toContain("To: Honorable Mayor");
    expect(markdown).toContain("\\\nFrom: Gerry Beaudin");
  });

  it("does not promote headings in title mode", () => {
    const markdown = prismMarkdownEnrich("EXECUTIVE SUMMARY\n\nBody", {
      mode: "title",
    });
    expect(markdown).not.toContain("## ");
    expect(markdown).toContain("EXECUTIVE SUMMARY");
  });

  it("does not promote ALL-CAPS lines that are not blank-line bounded", () => {
    const markdown = prismMarkdownEnrich(
      "Intro line\nEXECUTIVE SUMMARY\nMore prose",
      { mode: "document" }
    );
    expect(markdown).not.toContain("## ");
  });

  it("escapes structure-changing Markdown without over-escaping prose", () => {
    const markdown = prismMarkdownEnrich(
      "City-owned (AMP) site. See *bold* and [x](y)\n\n# hash\n\n1. list\n\n> quote\n\n<script>alert(1)</script>",
      { mode: "document" }
    );
    expect(markdown).toContain("City-owned (AMP) site.");
    expect(markdown).not.toContain("City\\-owned");
    expect(markdown).not.toContain("\\(AMP\\)");
    expect(markdown).toContain("\\*bold\\*");
    expect(markdown).toContain("\\[x\\](y)");
    expect(markdown).toContain("\\# hash");
    expect(markdown).toContain("1\\. list");
    expect(markdown).toContain("\\> quote");
    expect(markdown).toContain("\\<script\\>");
  });

  it("strips leading tabs so WHEREAS lines are not Markdown code blocks", () => {
    const markdown = prismMarkdownEnrich(
      "Intro\n\n\tWHEREAS, City-owned Building 11 is leased;\n\n\tWHEREAS, Poseidon Tech applied;",
      { mode: "document" }
    );
    expect(markdown).toContain("WHEREAS, City-owned Building 11 is leased;");
    expect(markdown).not.toMatch(/^\tWHEREAS/m);
    expect(markdown).not.toContain("City\\-owned");
  });

  it("links Keywords longest-first and case-insensitively in paragraphs only", () => {
    const markdown = prismMarkdownEnrich(
      "UNDERGROUND UTILITY DISTRICT\n\nSee Underground Utility District and Alameda Municipal Power.",
      {
        mode: "document",
        keywords: [
          {
            label: "Underground Utility District",
            href: "/keywords/uud",
          },
          {
            label: "Alameda Municipal Power",
            href: "/keywords/amp",
          },
        ],
      }
    );
    // Heading text stays unlinked (ALL-CAPS line becomes ##).
    expect(markdown).toMatch(/^## UNDERGROUND UTILITY DISTRICT$/m);
    expect(markdown).toContain(
      "[Underground Utility District](</keywords/uud>)"
    );
    expect(markdown).toContain("[Alameda Municipal Power](</keywords/amp>)");
  });

  it("prefers earlier matcher matches over Keywords on overlap", () => {
    const markdown = prismMarkdownEnrich("See Zoom at https://zoom.us/j/1", {
      mode: "title",
      keywords: [{ label: "https://zoom.us/j/1", href: "/keywords/bad" }],
    });
    expect(markdown).toContain("[https://zoom.us/j/1](<https://zoom.us/j/1>)");
    expect(markdown).not.toContain("/keywords/bad");
  });

  it("runs app matchers before the built-in URL matcher", () => {
    const markdown = prismMarkdownEnrich("Call 510-555-1212 please", {
      mode: "title",
      matchers: [() => [{ start: 5, end: 17, href: "tel:5105551212" }]],
    });
    expect(markdown).toContain("[510-555-1212](<tel:5105551212>)");
  });

  it("normalizes CRLF input", () => {
    const markdown = prismMarkdownEnrich("A\r\n\r\nBACKGROUND\r\n\r\nB", {
      mode: "document",
    });
    expect(markdown).toContain("## BACKGROUND");
  });

  it("returns empty string for blank input", () => {
    expect(prismMarkdownEnrich("   ", { mode: "document" })).toBe("");
  });
});
