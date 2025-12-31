/**
 * Charts Package - Nivo charting library wrappers
 *
 * Provides thin wrapper components around Nivo charts with:
 * - Automatic theme integration from CSS variables
 * - Sensible defaults
 * - Data transformation utilities
 */

// Chart components
export { BarChart } from "./chart-bar";
export type { BarChartProps } from "./chart-bar";
export { LineChart } from "./chart-line";
export type { LineChartProps } from "./chart-line";

// Theme utilities
export { getNivoTheme, getChartColors } from "./theme";

// Defaults
export {
  defaultMargins,
  defaultAxisConfig,
  defaultTooltipConfig,
  defaultResponsiveConfig,
  getDefaultBarChartProps,
  getDefaultLineChartProps,
  getDefaultColors,
} from "./defaults";

// Data transformation helpers
export {
  transformToBarData,
  transformToLineData,
  formatTimeSeries,
} from "./helpers";
export type {
  TransformToBarDataOptions,
  TransformToLineDataOptions,
  FormatTimeSeriesOptions,
} from "./helpers";

// Re-export types
export type {
  BarDatum,
  BarSvgProps,
  Serie,
  LineSvgProps,
  Theme,
} from "./types";
