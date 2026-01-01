/**
 * Charts Package - Nivo charting library wrappers
 *
 * Provides thin wrapper components around Nivo charts to eliminate boilerplate:
 * - Automatic theme integration from CSS variables (no manual theme config)
 * - Sensible defaults (margins, axes, tooltips work out-of-the-box)
 * - Data transformation utilities (convert app data to Nivo formats)
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
