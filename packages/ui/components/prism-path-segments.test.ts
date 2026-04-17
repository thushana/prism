import { describe, expect, it } from "vitest";
import {
  buildPrismPathBarAutoSegmentList,
  normalizePathname,
  listAncestorPathPrefixes,
} from "./prism-path-segments";

describe("normalizePathname", () => {
  it("trims, strips query/hash, forces leading slash, drops trailing slash", () => {
    expect(normalizePathname("  /admin/foo/  ")).toBe("/admin/foo");
    expect(normalizePathname("/admin?x=1#h")).toBe("/admin");
    expect(normalizePathname("/")).toBe("/");
  });
});

describe("listAncestorPathPrefixes", () => {
  it("returns empty for single-segment path", () => {
    expect(listAncestorPathPrefixes("/admin")).toEqual([]);
  });

  it("returns cumulative prefixes excluding leaf", () => {
    expect(
      listAncestorPathPrefixes("/admin/prism/components/prism-button")
    ).toEqual(["/admin", "/admin/prism", "/admin/prism/components"]);
  });
});

describe("buildPrismPathBarAutoSegmentList", () => {
  const titleByPathPrefix = {
    "/admin": "Admin",
    "/admin/prism": { label: "Prism" },
    "/admin/prism/components": {
      label: "Components",
      href: "/admin/prism/components",
    },
  } as const;

  it("uses map + pageTitle; Prism has no href; string entry links to prefix", () => {
    expect(
      buildPrismPathBarAutoSegmentList(
        "/admin/prism/components/prism-button",
        titleByPathPrefix,
        "PrismButton"
      )
    ).toEqual([
      { label: "Admin", href: "/admin" },
      { label: "Prism" },
      { label: "Components", href: "/admin/prism/components" },
      { label: "PrismButton" },
    ]);
  });

  it("throws when an ancestor prefix is missing from the map", () => {
    expect(() =>
      buildPrismPathBarAutoSegmentList("/admin/prism/components/prism-button", {}, "X")
    ).toThrow(/titleByPathPrefix/);
  });
});
