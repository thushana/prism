import { describe, it, expect, beforeEach, vi } from "vitest";
import { getNivoTheme, getChartColors } from "./theme";

describe("Theme", () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe("getNivoTheme", () => {
    it("should return a theme object with required properties", () => {
      const theme = getNivoTheme();

      expect(theme).toHaveProperty("background");
      expect(theme).toHaveProperty("text");
      expect(theme).toHaveProperty("axis");
      expect(theme).toHaveProperty("grid");
      expect(theme).toHaveProperty("tooltip");
    });

    it("should have text configuration", () => {
      const theme = getNivoTheme();

      expect(theme.text).toBeDefined();
      if (theme.text) {
        expect(theme.text).toHaveProperty("fontSize");
        expect(theme.text).toHaveProperty("fill");
        expect(typeof theme.text.fontSize).toBe("number");
      }
    });

    it("should have axis configuration", () => {
      const theme = getNivoTheme();

      expect(theme.axis).toHaveProperty("domain");
      expect(theme.axis).toHaveProperty("legend");
      expect(theme.axis).toHaveProperty("ticks");
    });

    it("should have tooltip configuration", () => {
      const theme = getNivoTheme();

      expect(theme.tooltip).toBeDefined();
      if (theme.tooltip) {
        expect(theme.tooltip).toHaveProperty("container");
        expect(theme.tooltip.container).toHaveProperty("background");
        expect(theme.tooltip.container).toHaveProperty("color");
      }
    });
  });

  describe("getChartColors", () => {
    it("should return an array of 5 colors", () => {
      const colors = getChartColors();

      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBe(5);
    });

    it("should return valid color strings", () => {
      const colors = getChartColors();

      colors.forEach((color) => {
        expect(typeof color).toBe("string");
        expect(color.length).toBeGreaterThan(0);
      });
    });
  });
});
