import { describe, it, expect } from "vitest";
import {
  defaultMargins,
  defaultAxisConfig,
  defaultTooltipConfig,
  getDefaultBarChartProps,
  getDefaultLineChartProps,
  getDefaultColors,
} from "./defaults";

describe("Defaults", () => {
  describe("defaultMargins", () => {
    it("should have all required margin properties", () => {
      expect(defaultMargins).toHaveProperty("top");
      expect(defaultMargins).toHaveProperty("right");
      expect(defaultMargins).toHaveProperty("bottom");
      expect(defaultMargins).toHaveProperty("left");
    });

    it("should have numeric margin values", () => {
      expect(typeof defaultMargins.top).toBe("number");
      expect(typeof defaultMargins.right).toBe("number");
      expect(typeof defaultMargins.bottom).toBe("number");
      expect(typeof defaultMargins.left).toBe("number");
    });
  });

  describe("defaultAxisConfig", () => {
    it("should have all required axis properties", () => {
      expect(defaultAxisConfig).toHaveProperty("tickSize");
      expect(defaultAxisConfig).toHaveProperty("tickPadding");
      expect(defaultAxisConfig).toHaveProperty("tickRotation");
      expect(defaultAxisConfig).toHaveProperty("legendOffset");
    });
  });

  describe("defaultTooltipConfig", () => {
    it("should enable tooltips by default", () => {
      expect(defaultTooltipConfig.enable).toBe(true);
    });
  });

  describe("getDefaultBarChartProps", () => {
    it("should return default props object", () => {
      const props = getDefaultBarChartProps();

      expect(props).toHaveProperty("margin");
      expect(props).toHaveProperty("axisBottom");
      expect(props).toHaveProperty("axisLeft");
      expect(props).toHaveProperty("animate");
      expect(props).toHaveProperty("isInteractive");
    });

    it("should have margin configuration", () => {
      const props = getDefaultBarChartProps();

      expect(props.margin).toEqual(defaultMargins);
    });

    it("should have axis configurations", () => {
      const props = getDefaultBarChartProps();

      expect(props.axisBottom).toHaveProperty("legend");
      expect(props.axisLeft).toHaveProperty("legend");
    });
  });

  describe("getDefaultLineChartProps", () => {
    it("should return default props object", () => {
      const props = getDefaultLineChartProps();

      expect(props).toHaveProperty("margin");
      expect(props).toHaveProperty("axisBottom");
      expect(props).toHaveProperty("axisLeft");
      expect(props).toHaveProperty("animate");
      expect(props).toHaveProperty("isInteractive");
    });

    it("should have margin configuration", () => {
      const props = getDefaultLineChartProps();

      expect(props.margin).toEqual(defaultMargins);
    });

    it("should have line-specific configurations", () => {
      const props = getDefaultLineChartProps();

      expect(props).toHaveProperty("lineWidth");
      expect(props).toHaveProperty("curve");
      expect(props).toHaveProperty("useMesh");
    });
  });

  describe("getDefaultColors", () => {
    it("should return an array of colors", () => {
      const colors = getDefaultColors();

      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBeGreaterThan(0);
    });
  });
});
