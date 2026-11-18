import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PrismMarkdown, prismMarkdownHeadingAnchors } from "./prism-markdown";

describe("prismMarkdownHeadingAnchors", () => {
  it("matches prefixed heading ids used by PrismMarkdown", () => {
    expect(
      prismMarkdownHeadingAnchors(
        "EXECUTIVE SUMMARY\n\nBody\n\nBACKGROUND\n\nMore",
        "item-17-"
      )
    ).toEqual([
      { label: "EXECUTIVE SUMMARY", id: "item-17-executive-summary" },
      { label: "BACKGROUND", id: "item-17-background" },
    ]);
  });
});

describe("prismMarkdownHeadingAnchors with subsections", () => {
  it("keeps ids aligned with the renderer when ### shares a slug with ##", () => {
    const text = "Background\nIntro\nBACKGROUND\nMore";
    const [anchor] = prismMarkdownHeadingAnchors(text, "x-");
    const html = renderToStaticMarkup(
      <PrismMarkdown text={text} mode="document" headingIdPrefix="x-" />
    );
    expect(anchor?.id).toBe("x-background-1");
    expect(html).toContain(`id="${anchor?.id}"`);
  });
});

describe("PrismMarkdown", () => {
  it("renders prefixed heading ids and escapes raw HTML", () => {
    const html = renderToStaticMarkup(
      <PrismMarkdown
        text={"EXECUTIVE SUMMARY\n\nHello <script>alert(1)</script>"}
        mode="document"
        headingIdPrefix="item-42-"
      />
    );
    expect(html).toContain('id="item-42-executive-summary"');
    expect(html).toContain("EXECUTIVE SUMMARY");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders Title Case lines as black sans h3", () => {
    const html = renderToStaticMarkup(
      <PrismMarkdown
        text={
          "ALTERNATIVES\nNo Viable Alternative Sites\nBody\nConclusion\nDone."
        }
        mode="document"
        headingIdPrefix="item-7-"
      />
    );
    expect(html).toContain('id="item-7-no-viable-alternative-sites"');
    expect(html).toContain('id="item-7-conclusion"');
    expect(html).toContain("No Viable Alternative Sites");
    expect(html).toContain("Conclusion");
    expect(html).toMatch(/<h3\b/);
  });

  it("renders a copy-link control on headings", () => {
    const html = renderToStaticMarkup(
      <PrismMarkdown
        text={"EXECUTIVE SUMMARY\nBody"}
        mode="document"
        headingIdPrefix="5-f-"
      />
    );
    expect(html).toContain('aria-label="Copy link to heading"');
    expect(html).toContain('id="5-f-executive-summary"');
  });

  it("keeps tel: links but drops javascript: links", () => {
    const html = renderToStaticMarkup(
      <PrismMarkdown
        text="Call 510-555-1212 or javascript:alert(1)"
        mode="title"
        matchers={[
          () => [
            { start: 5, end: 17, href: "tel:5105551212" },
            { start: 21, end: 40, href: "javascript:alert(1)" },
          ],
        ]}
      />
    );
    expect(html).toContain('href="tel:5105551212"');
    expect(html).not.toMatch(/href="javascript:/i);
  });

  it("renders anchors as spans when disableLinks is set", () => {
    const html = renderToStaticMarkup(
      <PrismMarkdown
        text="See https://example.com/join"
        mode="title"
        disableLinks
      />
    );
    expect(html).not.toMatch(/<a\s/);
    expect(html).toContain("https://example.com/join");
  });
});
