"use client";

import * as React from "react";
import { ResponsiveLine, type LineSvgProps } from "@nivo/line";
import { getNivoTheme } from "./theme";
import { getDefaultLineChartProps } from "./defaults";
import type { MergedChartProps } from "./types";

export interface LineChartProps extends Omit<LineSvgProps, "theme"> {
  /**
   * Optional theme override. If not provided, uses theme from CSS variables.
   */
  theme?: LineSvgProps["theme"];
}

/**
 * LineChart - Thin wrapper around Nivo ResponsiveLine
 *
 * Automatically applies theme from CSS variables and sensible defaults.
 * All Nivo ResponsiveLine props are supported and can override defaults.
 *
 * @example
 * ```tsx
 * <LineChart
 *   data={data}
 *   margin={{ top: 20 }} // Override default margin
 * />
 * ```
 */
export function LineChart({
  theme,
  ...props
}: LineChartProps): React.JSX.Element {
  const defaultProps = getDefaultLineChartProps();
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
  } satisfies MergedChartProps<LineSvgProps>;

  return <ResponsiveLine {...mergedProps} />;
}
