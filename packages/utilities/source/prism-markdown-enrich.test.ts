import { describe, expect, it } from "vitest";
import {
  isPrismMarkdownSectionHeading,
  isPrismMarkdownTitleHeading,
  prismMarkdownDocumentHeadings,
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

  it("rejects resolution vote-tally labels", () => {
    expect(isPrismMarkdownSectionHeading("AYES:")).toBe(false);
    expect(isPrismMarkdownSectionHeading("NOES:")).toBe(false);
    expect(isPrismMarkdownSectionHeading("ABSENT:")).toBe(false);
    expect(isPrismMarkdownSectionHeading("ABSTENTIONS:")).toBe(false);
    expect(isPrismMarkdownSectionHeading("NAYS")).toBe(false);
  });
});

describe("isPrismMarkdownTitleHeading", () => {
  it("accepts Title Case and sentence-case topic labels", () => {
    expect(isPrismMarkdownTitleHeading("Conclusion")).toBe(true);
    expect(isPrismMarkdownTitleHeading("No Viable Alternative Sites")).toBe(
      true
    );
    expect(isPrismMarkdownTitleHeading("Staff Recommendation:")).toBe(true);
    expect(isPrismMarkdownTitleHeading("Food and beverage")).toBe(true);
    expect(isPrismMarkdownTitleHeading("Tenant improvements")).toBe(true);
    expect(isPrismMarkdownTitleHeading("Event center and screening")).toBe(
      true
    );
    expect(isPrismMarkdownTitleHeading("Maintenance and parking lot")).toBe(
      true
    );
  });

  it("rejects ALL-CAPS, prose sentences, and mixed mid-line capitals", () => {
    expect(isPrismMarkdownTitleHeading("ALTERNATIVES")).toBe(false);
    expect(isPrismMarkdownTitleHeading("AYES:")).toBe(false);
    expect(isPrismMarkdownTitleHeading("NOES:")).toBe(false);
    expect(isPrismMarkdownTitleHeading("CEQA")).toBe(false);
    expect(
      isPrismMarkdownTitleHeading(
        "The Roots have demonstrated that no other suitable site is available."
      )
    ).toBe(false);
    expect(isPrismMarkdownTitleHeading("Close to Alameda Airport")).toBe(false);
    expect(isPrismMarkdownTitleHeading("Conclusion.")).toBe(false);
  });

  it("rejects resolution signature labels", () => {
    expect(isPrismMarkdownTitleHeading("Approved as to form:")).toBe(false);
    expect(isPrismMarkdownTitleHeading("Approved as to form")).toBe(false);
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

  it("promotes ALL-CAPS lines even with a single newline before body", () => {
    const markdown = prismMarkdownEnrich(
      "Intro line\n\nCLIMATE IMPACT\nThere are no identifiable climate impacts.\n\nRECOMMENDATION\nIntroduce an Ordinance.",
      { mode: "document" }
    );
    expect(markdown).toContain("## CLIMATE IMPACT");
    expect(markdown).toContain("## RECOMMENDATION");
    expect(markdown).toContain("There are no identifiable climate impacts.");
  });

  it("does not promote ALL-CAPS mid-line prose", () => {
    const markdown = prismMarkdownEnrich(
      "See the EXECUTIVE SUMMARY section for details.",
      { mode: "document" }
    );
    expect(markdown).not.toContain("## ");
  });

  it("promotes Title Case and sentence-case labels to ### subsections", () => {
    const markdown = prismMarkdownEnrich(
      "ALTERNATIVES\nBody\nNo Viable Alternative Sites\nIncluded in the CEQA checklist.\nConclusion\nThe Roots have demonstrated suitability.\nFood and beverage\nExclusive rights outside Jim's areas.\nTenant improvements\nCourse modifications require approval.",
      { mode: "document" }
    );
    expect(markdown).toContain("## ALTERNATIVES");
    expect(markdown).toContain("### No Viable Alternative Sites");
    expect(markdown).toContain("### Conclusion");
    expect(markdown).toContain("### Food and beverage");
    expect(markdown).toContain("### Tenant improvements");
    expect(markdown).toContain("Included in the CEQA checklist.");
    expect(markdown).not.toMatch(/^### Included/m);
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

  it("keeps resolution vote tallies and signature lines as body text", () => {
    const markdown = prismMarkdownEnrich(
      "RECREATION AND PARKS COMMISSION\n\nAYES:\n\nNOES:\n\nABSENT:\n\nABSTENTIONS:\n\nApproved as to form:\n\nCITY ATTORNEY",
      { mode: "document" }
    );
    expect(markdown).toContain("## RECREATION AND PARKS COMMISSION");
    expect(markdown).toContain("AYES:");
    expect(markdown).toContain("NOES:");
    expect(markdown).toContain("ABSENT:");
    expect(markdown).toContain("ABSTENTIONS:");
    expect(markdown).toContain("Approved as to form:");
    expect(markdown).not.toMatch(/^## AYES/m);
    expect(markdown).not.toMatch(/^## NOES/m);
    expect(markdown).not.toMatch(/^## ABSENT/m);
    expect(markdown).not.toMatch(/^## ABSTENTIONS/m);
    expect(markdown).not.toMatch(/^### Approved as to form/m);
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

describe("prismMarkdownDocumentHeadings", () => {
  it("lists ## headings only, including single-newline sections", () => {
    expect(
      prismMarkdownDocumentHeadings(
        "Intro\n\nEXECUTIVE SUMMARY\n\nBody\nBACKGROUND\nMore\nCLIMATE IMPACT\nNone.\nRECOMMENDATION\nAdopt.\nConclusion\nDone."
      )
    ).toEqual([
      "EXECUTIVE SUMMARY",
      "BACKGROUND",
      "CLIMATE IMPACT",
      "RECOMMENDATION",
    ]);
  });
});
