# Charts Package Documentation

The `packages/charts` package provides React chart components built on top of [Nivo](https://nivo.rocks/), a powerful data visualization library. The package includes thin wrapper components with automatic theme integration, sensible defaults, and data transformation utilities.

## Package Structure

```
packages/charts/
├── source/
│   ├── chart-bar.tsx      # Bar chart component
│   ├── chart-line.tsx   # Line chart component (for time series)
│   ├── theme.ts          # Theme configuration from CSS variables
│   ├── defaults.ts       # Default configurations
│   ├── helpers.ts        # Data transformation utilities
│   ├── types.ts          # TypeScript type exports
│   └── index.ts          # Main exports
├── vitest.config.ts      # Test configuration
└── vitest.setup.ts       # Test setup
```

## Installation

The charts package is automatically available in all apps via npm workspaces. No installation needed - just import:

```typescript
import { BarChart, LineChart } from "@charts";
import { transformToBarData, formatTimeSeries } from "@charts";
```

## Components

### BarChart

A responsive bar chart component with automatic theme integration.

**Import:**

```typescript
import { BarChart } from "@charts";
```

**Props:**

All [Nivo ResponsiveBar props](https://nivo.rocks/bar/) are supported. The component automatically applies:
- Theme from CSS variables
- Sensible defaults (margins, axis configs, tooltips)
- Responsive behavior

**Example:**

```tsx
const data = [
  { category: "A", value1: 10, value2: 20 },
  { category: "B", value1: 15, value2: 25 },
  { category: "C", value1: 12, value2: 18 },
];

<BarChart
  data={data}
  keys={["value1", "value2"]}
  indexBy="category"
  margin={{ top: 20 }} // Override default margin
/>
```

### LineChart

A responsive line chart component ideal for time series data.

**Import:**

```typescript
import { LineChart } from "@charts";
```

**Props:**

All [Nivo ResponsiveLine props](https://nivo.rocks/line/) are supported. The component automatically applies:
- Theme from CSS variables
- Sensible defaults (margins, axis configs, tooltips)
- Responsive behavior

**Example:**

```tsx
const data = [
  {
    id: "sales",
    data: [
      { x: "2024-01-01", y: 100 },
      { x: "2024-01-02", y: 150 },
      { x: "2024-01-03", y: 120 },
    ],
  },
];

<LineChart
  data={data}
  margin={{ top: 20 }} // Override default margin
/>
```

## Data Transformation Helpers

### transformToBarData

Transform app data to Nivo bar chart format.

```typescript
import { transformToBarData } from "@charts";

const appData = [
  { category: "A", sales: 100, revenue: 1000 },
  { category: "B", sales: 150, revenue: 1500 },
];

const barData = transformToBarData(appData, {
  indexBy: "category",
  keys: ["sales", "revenue"],
});

<BarChart data={barData} keys={["sales", "revenue"]} indexBy="category" />
```

### transformToLineData

Transform app data to Nivo line chart format.

```typescript
import { transformToLineData } from "@charts";

const appData = [
  { date: "2024-01-01", sales: 100, revenue: 1000 },
  { date: "2024-01-02", sales: 150, revenue: 1500 },
];

const lineData = transformToLineData(appData, {
  xField: "date",
  yFields: ["sales", "revenue"],
});

<LineChart data={lineData} />
```

### formatTimeSeries

Convenience wrapper for time series data with date handling.

```typescript
import { formatTimeSeries } from "@charts";

const timeSeriesData = [
  { timestamp: "2024-01-01T00:00:00Z", temperature: 20, humidity: 60 },
  { timestamp: "2024-01-02T00:00:00Z", temperature: 22, humidity: 65 },
];

const formattedData = formatTimeSeries(timeSeriesData, {
  dateField: "timestamp",
  valueFields: ["temperature", "humidity"],
  parseDate: (val) => new Date(val),
  formatDate: (date) => date.toISOString().split("T")[0],
});

<LineChart data={formattedData} />
```

## Theme Customization

The charts package automatically reads theme colors from CSS variables defined in your Tailwind theme. The theme supports both light and dark modes.

### CSS Variables Used

The following CSS variables are read from your theme:

- `--foreground` - Text color
- `--background` - Background color
- `--muted` - Muted background
- `--muted-foreground` - Muted text
- `--border` - Border color
- `--chart-1` through `--chart-5` - Chart color palette

### Custom Theme

You can override the theme by passing a custom theme prop:

```typescript
import { BarChart, getNivoTheme } from "@charts";

const customTheme = {
  ...getNivoTheme(),
  text: {
    ...getNivoTheme().text,
    fill: "#ff0000", // Custom text color
  },
};

<BarChart data={data} keys={["value"]} indexBy="category" theme={customTheme} />
```

### Chart Colors

Get chart colors from your theme:

```typescript
import { getChartColors } from "@charts";

const colors = getChartColors(); // Returns array of 5 colors from CSS variables
```

## Defaults

The package provides sensible defaults that can be overridden:

### Margins

Default: `{ top: 50, right: 130, bottom: 50, left: 60 }`

```tsx
<BarChart
  data={data}
  keys={["value"]}
  indexBy="category"
  margin={{ top: 20, right: 50, bottom: 20, left: 50 }} // Override
/>
```

### Axis Configuration

Default axis configuration includes:
- Tick size: 5
- Tick padding: 5
- Legend offset: -12

```tsx
<BarChart
  data={data}
  keys={["value"]}
  indexBy="category"
  axisBottom={{
    legend: "Custom Label",
    legendPosition: "middle",
  }}
/>
```

## Advanced Usage

### Custom Data Transformation

```typescript
import { transformToBarData } from "@charts";

const transformed = transformToBarData(rawData, {
  indexBy: "category",
  keys: ["value1", "value2"],
  transform: (item) => ({
    ...item,
    value1: item.value1 * 100, // Apply transformation
  }),
});
```

### Multiple Series in Line Chart

```typescript
const data = [
  {
    id: "series1",
    data: [
      { x: "2024-01-01", y: 10 },
      { x: "2024-01-02", y: 15 },
    ],
  },
  {
    id: "series2",
    data: [
      { x: "2024-01-01", y: 20 },
      { x: "2024-01-02", y: 25 },
    ],
  },
];

<LineChart data={data} />
```

## TypeScript Support

The package includes full TypeScript support with exported types:

```typescript
import type {
  BarChartProps,
  LineChartProps,
  BarDatum,
  Serie,
  TransformToBarDataOptions,
  FormatTimeSeriesOptions,
} from "@charts";
```

## Resources

- [Nivo Documentation](https://nivo.rocks/)
- [Nivo Bar Chart Examples](https://nivo.rocks/bar/)
- [Nivo Line Chart Examples](https://nivo.rocks/line/)
