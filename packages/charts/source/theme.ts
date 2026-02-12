import type { Theme } from "@nivo/theming";

/**
 * Get CSS variable value from computed styles.
 * Returns empty string during SSR (server-side rendering).
 */
function getCSSVariable(variable: string): string {
  if (typeof window === "undefined") {
    // SSR: return default values
    return "";
  }
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
}

/**
 * Check if dark mode is active.
 * Reserved for future dark mode theme enhancements.
 */
function _isDarkMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return document.documentElement.classList.contains("dark");
}

/**
 * Get Nivo theme configuration from CSS variables.
 *
 * Maps Tailwind theme CSS variables to Nivo theme format, enabling automatic
 * theme integration without manual configuration. Charts automatically match
 * app theme (light/dark mode) by reading CSS variables at runtime.
 */
export function getNivoTheme(): Theme {
  // Get color values from CSS variables
  // Note: _isDarkMode() is available for future dark mode enhancements
  const foreground = getCSSVariable("--foreground") || "oklch(0.145 0 0)";
  const background = getCSSVariable("--background") || "oklch(1 0 0)";
  const _muted = getCSSVariable("--muted") || "oklch(0.97 0 0)";
  const mutedForeground =
    getCSSVariable("--muted-foreground") || "oklch(0.556 0 0)";
  const border = getCSSVariable("--border") || "oklch(0.922 0 0)";

  // Chart colors (reserved for future multi-series theming)
  const _chart1 = getCSSVariable("--chart-1") || "oklch(0.646 0.222 41.116)";
  const _chart2 = getCSSVariable("--chart-2") || "oklch(0.6 0.118 184.704)";
  const _chart3 = getCSSVariable("--chart-3") || "oklch(0.398 0.07 227.392)";
  const _chart4 = getCSSVariable("--chart-4") || "oklch(0.828 0.189 84.429)";
  const _chart5 = getCSSVariable("--chart-5") || "oklch(0.769 0.188 70.08)";

  const textStyle = (fontSize: number, fill: string): Theme["text"] => ({
    fontFamily: "inherit",
    fontSize,
    fill,
    outlineWidth: 0,
    outlineColor: "transparent",
    outlineOpacity: 0,
  });

  return {
    background: "transparent",
    text: textStyle(11, foreground),
    axis: {
      domain: {
        line: {
          stroke: border,
          strokeWidth: 1,
        },
      },
      legend: {
        text: textStyle(12, foreground),
      },
      ticks: {
        line: {
          stroke: border,
          strokeWidth: 1,
        },
        text: textStyle(11, mutedForeground),
      },
    },
    grid: {
      line: {
        stroke: border,
        strokeWidth: 1,
        strokeDasharray: "2,2",
      },
    },
    crosshair: {
      line: {
        stroke: foreground,
        strokeWidth: 1,
        strokeOpacity: 0.75,
        strokeDasharray: "0",
      },
    },
    legends: {
      hidden: {
        symbol: {},
        text: textStyle(11, mutedForeground),
      },
      title: {
        text: textStyle(11, foreground),
      },
      text: textStyle(11, mutedForeground),
      ticks: {
        line: {},
        text: textStyle(10, mutedForeground),
      },
    },
    annotations: {
      text: {
        fontFamily: "inherit",
        fontSize: 13,
        fill: foreground,
        outlineWidth: 2,
        outlineColor: background,
        outlineOpacity: 1,
      },
      link: {
        stroke: foreground,
        strokeWidth: 1,
        outlineWidth: 2,
        outlineColor: background,
        outlineOpacity: 1,
      },
      outline: {
        stroke: foreground,
        strokeWidth: 2,
        outlineWidth: 2,
        outlineColor: background,
        outlineOpacity: 1,
      },
      symbol: {
        fill: foreground,
        outlineWidth: 2,
        outlineColor: background,
        outlineOpacity: 1,
      },
    },
    labels: {
      text: textStyle(11, foreground),
    },
    markers: {
      lineColor: border,
      lineStrokeWidth: 1,
      text: textStyle(11, foreground),
    },
    dots: {
      text: textStyle(11, foreground),
    },
    tooltip: {
      container: {
        background: background,
        color: foreground,
        fontSize: 12,
        borderRadius: "6px",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
        border: `1px solid ${border}`,
      },
      basic: {},
      chip: {},
      table: {},
      tableCell: {},
      tableCellValue: {},
    },
  };
}

/**
 * Get chart color scheme from CSS variables.
 *
 * Returns array of 5 colors from `--chart-1` through `--chart-5` CSS variables
 * for use in Nivo charts. Falls back to default colors if CSS variables are
 * not defined.
 */
export function getChartColors(): string[] {
  return [
    getCSSVariable("--chart-1") || "oklch(0.646 0.222 41.116)",
    getCSSVariable("--chart-2") || "oklch(0.6 0.118 184.704)",
    getCSSVariable("--chart-3") || "oklch(0.398 0.07 227.392)",
    getCSSVariable("--chart-4") || "oklch(0.828 0.189 84.429)",
    getCSSVariable("--chart-5") || "oklch(0.769 0.188 70.08)",
  ];
}
