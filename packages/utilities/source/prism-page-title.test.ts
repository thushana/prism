import { describe, it, expect } from "vitest";
import { DEFAULT_BROWSER_APP_NAME, PrismPageTitle } from "./prism-page-title";

describe("PrismPageTitle", () => {
  it("app joins page and app name", () => {
    expect(PrismPageTitle.app("Home", "MyApp")).toBe("Home • MyApp");
    expect(PrismPageTitle.app(null, "MyApp")).toBe("MyApp");
  });

  it("journey uses emoji prefix when present", () => {
    expect(
      PrismPageTitle.journey({ name: "North", emoji: "🚂" }, "MyApp")
    ).toBe("🚂 North • MyApp");
    expect(PrismPageTitle.journey({ name: "North", emoji: "" }, "MyApp")).toBe(
      "North • MyApp"
    );
  });

  it("allJourneys", () => {
    expect(PrismPageTitle.allJourneys("TT")).toBe("All journeys • TT");
  });

  it("admin prefixes diamond and joins segments", () => {
    expect(PrismPageTitle.admin("PrismEmoji", "MyApp")).toBe(
      "💎 PrismEmoji • Admin • MyApp"
    );
    expect(PrismPageTitle.admin(null, "MyApp")).toBe("💎 Admin • MyApp");
  });

  it("exports default app constant", () => {
    expect(DEFAULT_BROWSER_APP_NAME).toBe("TimeTraveler");
  });
});
