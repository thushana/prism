import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PrismMarkdown } from "./prism-markdown";

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
