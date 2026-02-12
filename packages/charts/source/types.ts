/**
 * Re-export key Nivo types for convenience.
 * These types are used throughout the charts package and exported for consumers.
 */

import type { LineSeries } from "@nivo/line";

// Bar chart types
export type { BarDatum, BarSvgProps } from "@nivo/bar";

// Line chart types (Nivo 0.99: Serie was renamed to LineSeries)
export type { LineSeries, LineSvgProps } from "@nivo/line";
/** @deprecated Use LineSeries */
export type Serie = LineSeries;

// Theme from @nivo/theming (Nivo 0.99)
export type { Theme } from "@nivo/theming";

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
