/**
 * Re-export key Nivo types for convenience.
 * These types are used throughout the charts package and exported for consumers.
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
 * Helper type to safely merge chart props with defaults.
 *
 * Ensures type safety while allowing proper prop merging in chart components.
 * User props take precedence over defaults.
 */
export type MergedChartProps<TProps> = TProps;
