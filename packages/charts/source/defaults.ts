import type { BarDatum, BarSvgProps } from "@nivo/bar";
import type { LineSvgProps, Serie } from "@nivo/line";
import { getChartColors } from "./theme";

/**
 * Default margins for charts
 */
export const defaultMargins = {
  top: 50,
  right: 130,
  bottom: 50,
  left: 60,
};

/**
 * Default axis configuration
 */
export const defaultAxisConfig = {
  tickSize: 5,
  tickPadding: 5,
  tickRotation: 0,
  legendOffset: -12,
};

/**
 * Default tooltip configuration
 */
export const defaultTooltipConfig = {
  enable: true,
};

/**
 * Default responsive behavior
 * Note: sliceTooltip can be customized per chart instance
 */
export const defaultResponsiveConfig = {
  enableSlices: false,
};

/**
 * Default props for BarChart component
 * These can be overridden by passing props directly to the component
 */
export function getDefaultBarChartProps(): Partial<BarSvgProps<BarDatum>> {
  return {
    margin: defaultMargins,
    axisBottom: {
      ...defaultAxisConfig,
      legend: "Category",
      legendPosition: "middle",
    },
    axisLeft: {
      ...defaultAxisConfig,
      legend: "Value",
      legendPosition: "middle",
    },
    padding: 0.3,
    valueScale: { type: "linear" },
    indexScale: { type: "band", round: true },
    colors: { scheme: "nivo" },
    colorBy: "id",
    borderRadius: 0,
    borderWidth: 0,
    borderColor: {
      from: "color",
      modifiers: [["darker", 1.6]],
    },
    enableLabel: true,
    labelSkipWidth: 12,
    labelSkipHeight: 12,
    labelTextColor: {
      from: "color",
      modifiers: [["darker", 1.6]],
    },
    legends: [
      {
        dataFrom: "keys",
        anchor: "bottom-right",
        direction: "column",
        justify: false,
        translateX: 120,
        translateY: 0,
        itemsSpacing: 2,
        itemWidth: 100,
        itemHeight: 20,
        itemDirection: "left-to-right",
        itemOpacity: 0.85,
        symbolSize: 20,
        effects: [
          {
            on: "hover",
            style: {
              itemOpacity: 1,
            },
          },
        ],
      },
    ],
    animate: true,
    motionConfig: "gentle",
    isInteractive: true,
    ...defaultTooltipConfig,
  };
}

/**
 * Default props for LineChart component
 * These can be overridden by passing props directly to the component
 */
export function getDefaultLineChartProps(): Partial<LineSvgProps> {
  return {
    margin: defaultMargins,
    axisBottom: {
      ...defaultAxisConfig,
      legend: "X Axis",
      legendPosition: "middle",
      legendOffset: 46,
    },
    axisLeft: {
      ...defaultAxisConfig,
      legend: "Y Axis",
      legendPosition: "middle",
      legendOffset: -50,
    },
    pointSize: 10,
    pointColor: { theme: "background" },
    pointBorderWidth: 2,
    pointBorderColor: { from: "serieColor" },
    pointLabelYOffset: -12,
    enableSlices: "x",
    useMesh: true,
    enableGridX: true,
    enableGridY: true,
    colors: { scheme: "nivo" },
    lineWidth: 2,
    curve: "linear",
    animate: true,
    motionConfig: "gentle",
    isInteractive: true,
    enableCrosshair: true,
    ...defaultTooltipConfig,
  };
}

/**
 * Get default color scheme for charts
 * Uses chart colors from theme
 */
export function getDefaultColors(): string[] {
  return getChartColors();
}
