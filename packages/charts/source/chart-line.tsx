"use client";

import * as React from "react";
import { ResponsiveLine, type LineSvgProps, type LineSeries } from "@nivo/line";
import { getNivoTheme } from "./theme";
import { getDefaultLineChartProps } from "./defaults";
export interface LineChartProps
  extends Omit<LineSvgProps<LineSeries>, "theme" | "height" | "width"> {
  /**
   * Optional theme override. If not provided, uses theme from CSS variables.
   */
  theme?: LineSvgProps<LineSeries>["theme"];
  /** Optional; ResponsiveLine fills from container. */
  height?: number;
  width?: number;
}

/**
 * LineChart - Thin wrapper around Nivo ResponsiveLine
 *
 * Eliminates boilerplate by automatically applying theme from CSS variables
 * and sensible defaults. All Nivo ResponsiveLine props are supported and can
 * override defaults. User props take precedence over defaults.
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
  } as LineSvgProps<LineSeries>;

  return <ResponsiveLine {...mergedProps} />;
}
