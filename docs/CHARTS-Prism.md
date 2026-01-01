# Charts Package

The `packages/charts` package provides thin wrapper components around [Nivo](https://nivo.rocks/) charts with automatic theme integration, sensible defaults, and data transformation utilities.

## Mental Model

The charts package exists to eliminate boilerplate when using Nivo charts in Prism apps. Instead of configuring themes, margins, and axis settings for every chart, components automatically:

- **Read theme from CSS variables** - Charts match your app's color scheme without manual configuration
- **Apply sensible defaults** - Margins, axis configs, and tooltips work out-of-the-box
- **Support full Nivo API** - All Nivo props are supported and can override defaults
- **Transform common data formats** - Convert app data structures to Nivo's expected formats

## What It Provides

### Components

- **`BarChart`** - Wrapper around Nivo `ResponsiveBar` for categorical data visualization
- **`LineChart`** - Wrapper around Nivo `ResponsiveLine` for time series and continuous data

Both components merge user props with defaults (user props take precedence) and automatically apply theme from CSS variables. See [`source/chart-bar.tsx`](../packages/charts/source/chart-bar.tsx) and [`source/chart-line.tsx`](../packages/charts/source/chart-line.tsx) for implementation.

### Data Transformation Helpers

- **`transformToBarData`** - Converts app data arrays to Nivo bar chart format
- **`transformToLineData`** - Converts app data arrays to Nivo line chart format  
- **`formatTimeSeries`** - Convenience wrapper for time series with date parsing/formatting

These helpers eliminate the need to manually reshape data. See [`source/helpers.ts`](../packages/charts/source/helpers.ts) for implementation and TypeScript types.

### Theme Integration

The package reads CSS variables from your Tailwind theme at runtime:
- `--foreground`, `--background`, `--muted`, `--muted-foreground`, `--border` for chart styling
- `--chart-1` through `--chart-5` for the color palette

Theme is automatically applied - no configuration needed. See [`source/theme.ts`](../packages/charts/source/theme.ts) for the mapping logic.

## Design Decisions

### Why Nivo?

Nivo provides a comprehensive, well-maintained charting library with TypeScript support and responsive behavior. It's built on D3 but abstracts away the complexity.

### Why Thin Wrappers?

Instead of building custom charts, we wrap Nivo to:
- Leverage Nivo's battle-tested visualization logic
- Maintain full API compatibility (all Nivo props work)
- Reduce maintenance burden (Nivo handles updates)
- Keep the package small and focused

### Why CSS Variable Theme?

Reading theme from CSS variables means:
- Charts automatically match app theme (light/dark mode)
- No prop drilling or context needed
- Works with Tailwind's theme system
- Can be overridden per-chart if needed

### Why Defaults?

Sensible defaults eliminate the need to configure margins, axis labels, and tooltips for every chart. Defaults are defined in [`source/defaults.ts`](../packages/charts/source/defaults.ts) and can be overridden via props.

## Package Structure

```
packages/charts/
├── source/
│   ├── chart-bar.tsx      # BarChart component
│   ├── chart-line.tsx     # LineChart component
│   ├── theme.ts           # CSS variable → Nivo theme mapping
│   ├── defaults.ts        # Default configurations
│   ├── helpers.ts         # Data transformation utilities
│   ├── types.ts           # TypeScript type exports
│   └── index.ts           # Public API exports
```

## Usage

Import components and helpers from `@charts`:

```typescript
import { BarChart, LineChart, transformToBarData, formatTimeSeries } from "@charts";
```

All Nivo props are supported. See component source files for JSDoc examples, and refer to [Nivo documentation](https://nivo.rocks/) for prop details.

TypeScript types are exported - use your IDE's autocomplete or see [`source/types.ts`](../packages/charts/source/types.ts) and [`source/index.ts`](../packages/charts/source/index.ts).

## Resources

- [Nivo Documentation](https://nivo.rocks/)
- [Nivo Bar Chart Examples](https://nivo.rocks/bar/)
- [Nivo Line Chart Examples](https://nivo.rocks/line/)
