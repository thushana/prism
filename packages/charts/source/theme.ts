import type { Theme } from "@nivo/core";

/**
 * Get CSS variable value from computed styles
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
 * Check if dark mode is active
 */
function isDarkMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return document.documentElement.classList.contains("dark");
}

/**
 * Get Nivo theme configuration from CSS variables
 * Reads from Tailwind theme CSS variables and maps them to Nivo theme format
 */
export function getNivoTheme(): Theme {
  // Get color values from CSS variables
  // Note: isDarkMode() is available for future dark mode enhancements
  const foreground = getCSSVariable("--foreground") || "oklch(0.145 0 0)";
  const background = getCSSVariable("--background") || "oklch(1 0 0)";
  const muted = getCSSVariable("--muted") || "oklch(0.97 0 0)";
  const mutedForeground =
    getCSSVariable("--muted-foreground") || "oklch(0.556 0 0)";
  const border = getCSSVariable("--border") || "oklch(0.922 0 0)";

  // Chart colors
  const chart1 = getCSSVariable("--chart-1") || "oklch(0.646 0.222 41.116)";
  const chart2 = getCSSVariable("--chart-2") || "oklch(0.6 0.118 184.704)";
  const chart3 = getCSSVariable("--chart-3") || "oklch(0.398 0.07 227.392)";
  const chart4 = getCSSVariable("--chart-4") || "oklch(0.828 0.189 84.429)";
  const chart5 = getCSSVariable("--chart-5") || "oklch(0.769 0.188 70.08)";

  return {
    background: "transparent",
    text: {
      fontSize: 11,
      fill: foreground,
      outlineWidth: 0,
      outlineColor: "transparent",
    },
    axis: {
      domain: {
        line: {
          stroke: border,
          strokeWidth: 1,
        },
      },
      legend: {
        text: {
          fontSize: 12,
          fill: foreground,
          outlineWidth: 0,
          outlineColor: "transparent",
        },
      },
      ticks: {
        line: {
          stroke: border,
          strokeWidth: 1,
        },
        text: {
          fontSize: 11,
          fill: mutedForeground,
          outlineWidth: 0,
          outlineColor: "transparent",
        },
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
      },
    },
    legends: {
      title: {
        text: {
          fontSize: 11,
          fill: foreground,
          outlineWidth: 0,
          outlineColor: "transparent",
        },
      },
      text: {
        fontSize: 11,
        fill: mutedForeground,
        outlineWidth: 0,
        outlineColor: "transparent",
      },
      ticks: {
        line: {},
        text: {
          fontSize: 10,
          fill: mutedForeground,
          outlineWidth: 0,
          outlineColor: "transparent",
        },
      },
    },
    annotations: {
      text: {
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
 * Get chart color scheme from CSS variables
 * Returns array of chart colors for use in Nivo charts
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
