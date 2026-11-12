import { describe, expect, it } from "vitest";
import {
  PRISM_RESERVED_SUBDOMAIN_LABELS,
  resolveReservedSubdomainLabels,
} from "./reserved-subdomain-labels";

describe("resolveReservedSubdomainLabels", () => {
  it("includes every Prism default label", () => {
    const labels = resolveReservedSubdomainLabels({});
    for (const label of PRISM_RESERVED_SUBDOMAIN_LABELS) {
      expect(labels.has(label)).toBe(true);
    }
  });

  it("merges app extras and nameIdentifier (case-insensitive)", () => {
    const labels = resolveReservedSubdomainLabels({
      nameIdentifier: "City-Observatory",
      reservedSubdomainLabels: ["Observer", " jurisdictions "],
    });

    expect(labels.has("observer")).toBe(true);
    expect(labels.has("jurisdictions")).toBe(true);
    expect(labels.has("city-observatory")).toBe(true);
    expect(labels.has("www")).toBe(true);
  });

  it("ignores empty reserved labels after trim", () => {
    const labels = resolveReservedSubdomainLabels({
      reservedSubdomainLabels: ["  ", "api"],
    });
    expect(labels.has("api")).toBe(true);
    expect([...labels].some((label) => label.length === 0)).toBe(false);
  });
});
