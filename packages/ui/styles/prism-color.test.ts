import { describe, expect, it } from "vitest";
import {
  getPrismDefaultColorNameForIndex,
  nextPrismDefaultColorName,
  normalizePrismColorSpec,
  PRISM_DEFAULT_COLOR_LOOP,
  PRISM_DEFAULT_COLOR_NAMES,
  PRISM_TAILWIND_COLOR_LOOP,
  PrismColor,
  resolveCodeBlockColor,
} from "./prism-color";
import { tailwindColorValues } from "./tailwind-color-values";

describe("PrismColor.Loop", () => {
  it("families('default') matches known order", () => {
    expect(PrismColor.Loop.families("default")[0]).toBe("red");
    expect(PrismColor.Loop.families("default").at(-1)).toBe("grey");
  });

  it("step walks the ColorLoop with wrap", () => {
    expect(PrismColor.Loop.step("default", "grey", 1)).toBe("red");
    expect(PrismColor.Loop.step("default", "red", -1)).toBe("grey");
  });
});

describe("resolveCodeBlockColor", () => {
  it("defaults to blue, range 2", () => {
    const r = resolveCodeBlockColor(undefined);
    expect(r.primary).toBe("blue");
    expect(r.colorLoopRange).toBe(2);
  });

  it("range 0 is center only (string=property=number family = primary)", () => {
    const r = resolveCodeBlockColor({
      swatchPrimary: "purple",
      colorLoop: { center: "purple", range: 0 },
    });
    expect(r.colorLoopRange).toBe(0);
    const map = PrismColor.syntax.tokenStyles({
      swatchPrimary: "purple",
      colorLoop: { center: "purple", range: 0 },
    });
    expect(map.string.light).toBe(map.keyword.light);
  });
});

describe("PrismColor.var", () => {
  it("emits default (unprefixed) var", () => {
    expect(PrismColor.var({ family: "deep-purple", shade: 600 })).toBe(
      "var(--color-deep-purple-600)",
    );
  });

  it("emits tailwind-prefixed var", () => {
    expect(
      PrismColor.var({ palette: "tailwind", family: "violet", shade: 500 }),
    ).toBe("var(--color-tailwind-violet-500)");
  });
});

describe("PrismColor.hex (tailwind)", () => {
  it("returns a tailwind oklch string from tailwind-color-values", () => {
    const v = PrismColor.hex({
      palette: "tailwind",
      family: "violet",
      shade: 500,
    });
    expect(v.startsWith("oklch(")).toBe(true);
  });

  it("hexAtIndex uses tailwind loop when palette is tailwind", () => {
    const v = PrismColor.hexAtIndex({
      palette: "tailwind",
      index: 0,
      shade: 400,
    });
    expect(v.startsWith("oklch(")).toBe(true);
  });
});

describe("PRISM_DEFAULT_COLOR_LOOP", () => {
  it("has same length as previous code-block ring", () => {
    expect(PRISM_DEFAULT_COLOR_LOOP.length).toBe(19);
  });

  it("matches PRISM_DEFAULT_COLOR_NAMES length", () => {
    expect(PRISM_DEFAULT_COLOR_NAMES.length).toBe(PRISM_DEFAULT_COLOR_LOOP.length);
  });

  it("aligns camelCase names with kebab-case loop by index", () => {
    for (let i = 0; i < PRISM_DEFAULT_COLOR_LOOP.length; i++) {
      const kebab = PRISM_DEFAULT_COLOR_LOOP[i]!;
      const camel = PRISM_DEFAULT_COLOR_NAMES[i]!;
      const kebabFromCamel = camel.replace(/([A-Z])/g, "-$1").toLowerCase();
      expect(kebabFromCamel).toBe(kebab);
    }
  });
});

describe("PRISM_TAILWIND_COLOR_LOOP", () => {
  it("matches generated tailwindColorValues family key order", () => {
    expect(PRISM_TAILWIND_COLOR_LOOP).toEqual(
      Object.keys(tailwindColorValues),
    );
  });
});

describe("default palette ColorName helpers", () => {
  it("getPrismDefaultColorNameForIndex wraps", () => {
    expect(getPrismDefaultColorNameForIndex(0)).toBe("red");
    expect(getPrismDefaultColorNameForIndex(PRISM_DEFAULT_COLOR_NAMES.length)).toBe(
      "red",
    );
  });

  it("nextPrismDefaultColorName advances and wraps", () => {
    expect(nextPrismDefaultColorName("blueGrey")).toBe("grey");
    expect(nextPrismDefaultColorName("grey")).toBe("red");
  });
});

describe("normalizePrismColorSpec", () => {
  it("fills palette, shade 500, tier full, surface defaults", () => {
    const n = normalizePrismColorSpec(undefined);
    expect(n.palette).toBe("default");
    expect(n.shade).toBe(500);
    expect(n.tier).toBe("full");
    expect(n.surface.blur).toBe("none");
    expect(n.surface.elevated).toBe(false);
  });

  it("normalizes swatch against the loop", () => {
    const n = normalizePrismColorSpec({ swatchPrimary: "PURPLE" });
    expect(n.swatchPrimary).toBe("purple");
  });
});

describe("PrismColor.gradient.linearStrings", () => {
  it("builds two theme strings with even stops", () => {
    const g = PrismColor.gradient.linearStrings({
      swatches: ["purple", "pink"],
      direction: "horizontal",
      shade: { light: 100, dark: 800 },
    });
    expect(g.light).toContain("var(--color-purple-100)");
    expect(g.light).toContain("var(--color-pink-100)");
    expect(g.dark).toContain("var(--color-purple-800)");
    expect(g.dark).toContain("to right");
  });

  it("uses numeric shade pair when a single number is passed", () => {
    const g = PrismColor.gradient.linearStrings({
      swatches: ["blue"],
      direction: "angled",
      shade: 400,
    });
    expect(g.light).toContain("400");
    expect(g.dark).toContain("500");
  });
});

describe("PrismColor.hex (default)", () => {
  it("returns a hex string for Material purple 600", () => {
    const v = PrismColor.hex({ family: "purple", shade: 600 });
    expect(v).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
