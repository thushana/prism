/**
 * Re-export key Nivo types for convenience
 */

// Bar chart types
export type { BarDatum, BarSvgProps } from "@nivo/bar";

// Line chart types
export type { Serie, LineSvgProps } from "@nivo/line";

// Core types
export type { Theme } from "@nivo/core";

// Helper types
export type {
  TransformToBarDataOptions,
  TransformToLineDataOptions,
  FormatTimeSeriesOptions,
} from "./helpers";

/**
 * Helper type to safely merge chart props with defaults
 * This ensures type safety while allowing proper prop merging
 */
export type MergedChartProps<TProps> = TProps;
