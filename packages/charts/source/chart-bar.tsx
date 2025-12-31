"use client";

import * as React from "react";
import { ResponsiveBar, type BarSvgProps, type BarDatum } from "@nivo/bar";
import { getNivoTheme } from "./theme";
import { getDefaultBarChartProps } from "./defaults";
import type { MergedChartProps } from "./types";

export interface BarChartProps extends Omit<BarSvgProps<BarDatum>, "theme"> {
  /**
   * Optional theme override. If not provided, uses theme from CSS variables.
   */
  theme?: BarSvgProps<BarDatum>["theme"];
}

/**
 * BarChart - Thin wrapper around Nivo ResponsiveBar
 *
 * Automatically applies theme from CSS variables and sensible defaults.
 * All Nivo ResponsiveBar props are supported and can override defaults.
 *
 * @example
 * ```tsx
 * <BarChart
 *   data={data}
 *   keys={['value1', 'value2']}
 *   indexBy="category"
 *   margin={{ top: 20 }} // Override default margin
 * />
 * ```
 */
export function BarChart({
  theme,
  ...props
}: BarChartProps): React.JSX.Element {
  const defaultProps = getDefaultBarChartProps();
  const nivoTheme = theme || getNivoTheme();

  // Merge defaults with user props (user props take precedence)
  const mergedProps = {
    ...defaultProps,
    ...props,
    // Merge nested objects like axisBottom, axisLeft
    axisBottom: {
      ...defaultProps.axisBottom,
      ...props.axisBottom,
    },
    axisLeft: {
      ...defaultProps.axisLeft,
      ...props.axisLeft,
    },
    margin: {
      ...defaultProps.margin,
      ...props.margin,
    },
    theme: nivoTheme,
  } satisfies MergedChartProps<BarSvgProps<BarDatum>>;

  return <ResponsiveBar {...mergedProps} />;
}
