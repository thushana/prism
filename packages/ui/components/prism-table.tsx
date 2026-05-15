"use client";

import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@utilities";
import {
  normalizePrismColorSpec,
  prismColorSpecToHex,
  prismSwatchContrastInk,
  PrismColor,
  type PartialPrismColorSpec,
  type PrismPaletteId,
} from "../styles/prism-color";
import {
  resolvePrismSwatchLineCss,
  resolvePrismSwatchLineMuted100Css,
} from "../source/prism-swatch-line";
import type { PrismDividerLineWeight, PrismDividerTone } from "./prism-divider";
import { PrismTypography } from "./prism-typography";

/**
 * Line tones match {@link PrismDivider}: **`default`** = active **`prismColor`** swatch + shade;
 * **`muted`** = that family’s **100** tint; **`rich`** = theme primary; **`white`** / **`black`** fixed.
 * **`swatch`** is a legacy alias of **`default`** (same paint).
 */
export type PrismTableLineTone = PrismDividerTone | "swatch";

/** Column rules: `none` removes vertical borders between cells. */
export type PrismTableColumnLineWeight = PrismDividerLineWeight | "none";

/** Row rules: `none` removes horizontal borders between body rows. */
export type PrismTableRowLineWeight = PrismDividerLineWeight | "none";

/** `full` uses the palette 50 tint; `soft` mixes that tint into the page background for a lighter wash. */
export type PrismTableRowShadeStrength = "full" | "soft";

/** Header row: page-default (`blank`) or tinted fill from `prismColor` with contrast label color. */
export type PrismTableHeaderRowSurface = "blank" | "color";

/** Header cell label paint when {@link PrismTableHeaderRowSurface} is `color` (or forced on blank). */
export type PrismTableHeaderLabelTone = "color" | "white" | "black";

/** Default body cell text when children do not set their own color (local `className` / `style` still wins). */
export type PrismTableBodyTextTone = PrismTableHeaderLabelTone;

/** Row rules: token classes (`solid`) or `linear-gradient` from `prismColor.gradient` (or a two-stop swatch ramp). */
export type PrismTableLineVisual = "solid" | "gradient";

const prismTableRowBorderVariants = cva("", {
  variants: {
    lineWeight: {
      light: "border-b",
      thin: "border-b-2",
      regular: "border-b-[3px]",
      bold: "border-b-4",
      heavy: "border-b-[6px]",
    },
    lineTone: {
      white: "[border-bottom-color:rgb(255_255_255/0.92)]",
      muted: "[border-bottom-color:var(--prism-table-muted-line)]",
      default: "[border-bottom-color:var(--prism-table-line)]",
      rich: "border-primary",
      black: "[border-bottom-color:rgb(0_0_0/0.82)]",
      swatch: "[border-bottom-color:var(--prism-table-line)]",
    },
  },
  defaultVariants: {
    lineWeight: "light",
    lineTone: "default",
  },
});

/** Outer frame around the table: same weight vocabulary as row/column rules (`none` = no frame). */
export type PrismTableOuterLineWeight = PrismTableColumnLineWeight;

/** `square` = flush corners; `rounded` = large radius on the frame. */
export type PrismTableCornerStyle = "square" | "rounded";

export type PrismTableSortOrder = "ascending" | "descending";
export type PrismTableSortComparison = "alphabetical" | "numeric";

/**
 * How the full-width table splits horizontal space (CSS `table-layout`).
 *
 * - **`auto`** — browser auto layout; long cells can widen their column. `numeric` heads/cells keep a
 *   shrink hint (`width: 1%` + `nowrap`).
 * - **`equal`** (default) — `table-layout: fixed` + an inferred `<colgroup>` from the first header row:
 *   every column receives the same percentage width (`100 / colCount`).
 * - **`stretchRemainder`** — fixed layout: {@link PrismTableRootProps.columnStretchColumnIndex} receives
 *   {@link PrismTableRootProps.columnStretchPercent}% of the table; the other columns split the remainder
 *   evenly. (True max-content + “don’t squeeze past a floor” needs JS measurement; this is the usual
 *   percentage approximation.)
 */
export type PrismTableColumnWidthStrategy =
  | "auto"
  | "equal"
  | "stretchRemainder";

type RegisteredHead = {
  sortable: boolean;
  initialSortOrder?: PrismTableSortOrder;
  sortComparison: PrismTableSortComparison;
};

type PrismTableContextValue = {
  prismColor: PartialPrismColorSpec;
  rowLineWeight?: PrismTableRowLineWeight;
  rowLineTone?: PrismTableLineTone;
  columnLineWeight?: PrismTableColumnLineWeight;
  columnLineTone?: PrismTableLineTone;
  rowShading?: "even" | "odd";
  rowShadeBackgroundCss: string | undefined;
  rowBorderClassName: string;
  headerRowSurface: PrismTableHeaderRowSurface;
  headerRowLabelTone: PrismTableHeaderLabelTone;
  headerRowBackgroundCss?: string;
  headerRowLabelColorCss?: string;
  rowLineVisual: PrismTableLineVisual;
  rowLineGradientCss?: string;
  /** Default {@link PrismTableCell} ink via inner wrapper `color` / `text-foreground` when children inherit. */
  bodyTextTone: PrismTableBodyTextTone;
  sortedColumnId: string | null;
  sortedOrder: PrismTableSortOrder | null;
  isControlled: boolean;
  registerHead: (columnId: string, meta: RegisteredHead) => void;
  unregisterHead: (columnId: string) => void;
  onHeaderSortClick: (columnId: string) => void;
  /** True when {@link PrismTableRootProps.tableBorderWeight} is set and not `none` (outer frame). */
  outerFrameBorderActive: boolean;
  /** Mirrors {@link PrismTableRootProps.tableCorners} for child row groups. */
  tableCorners: PrismTableCornerStyle;
  columnWidthStrategy: PrismTableColumnWidthStrategy;
};

const PrismTableContext = React.createContext<PrismTableContextValue | null>(
  null
);

type PrismTableRowChromeContextValue = {
  /**
   * Body row bottom rule is applied on each {@link PrismTableCell} (not the `tr`) so
   * horizontal lines paint above column guides (inset box-shadow on `td`).
   */
  solidRowBottom: boolean;
  /**
   * When {@link PrismTableRootProps.bodyTextTone} is `color` and this row has zebra fill,
   * swatch-aware `color` for cell wrappers (see {@link prismSwatchContrastInk}).
   */
  swatchAwareBodyInkStyle?: React.CSSProperties;
};

const PrismTableRowChromeContext =
  React.createContext<PrismTableRowChromeContextValue | null>(null);

function usePrismTableRowChrome(): PrismTableRowChromeContextValue | null {
  return React.useContext(PrismTableRowChromeContext);
}

function usePrismTableContext(component: string): PrismTableContextValue {
  const context = React.useContext(PrismTableContext);
  if (!context) {
    throw new Error(`${component} must be used within PrismTable`);
  }
  return context;
}

function documentHtmlIsDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

/**
 * Neutral ramp face used only to classify light vs dark “page-like” surfaces for
 * {@link prismSwatchContrastInk} (not necessarily the real page background).
 */
function neutralSheetSurfaceHexForInk(palette: PrismPaletteId): string {
  const neutral = palette === "tailwind" ? "zinc" : "grey";
  const shade = documentHtmlIsDarkMode() ? 950 : 50;
  return PrismColor.hex({ palette, family: neutral, shade });
}

/** Identity for Prism table slots — relies on explicit `displayName` (no `name` fallback; manglers-safe). */
function isPrismTableSlot(
  child: React.ReactNode,
  slotDisplayName: string
): child is React.ReactElement {
  if (!React.isValidElement(child)) return false;
  return (
    (child.type as { displayName?: string } | undefined)?.displayName ===
    slotDisplayName
  );
}

function isPrismTableRowElement(
  child: React.ReactNode
): child is React.ReactElement {
  return isPrismTableSlot(child, "PrismTableRow");
}

function isPrismTableCellElement(
  child: React.ReactNode
): child is React.ReactElement {
  return isPrismTableSlot(child, "PrismTableCell");
}

export type PrismTableHeaderColumnScan = {
  colCount: number;
};

/** Reads the first {@link PrismTableRow} inside {@link PrismTableHeader} for `<colgroup>` generation. */
function scanTableHeaderColumns(
  tableChildren: React.ReactNode
): PrismTableHeaderColumnScan {
  let colCount = 0;
  let foundSection = false;

  React.Children.forEach(tableChildren, (section) => {
    if (foundSection) return;
    if (!isPrismTableSlot(section, "PrismTableHeader")) return;
    foundSection = true;
    const { children: sectionChildren } = section.props as {
      children?: React.ReactNode;
    };
    let foundRow = false;
    React.Children.forEach(sectionChildren ?? null, (row) => {
      if (foundRow) return;
      if (!isPrismTableSlot(row, "PrismTableRow")) return;
      foundRow = true;
      const { children: rowChildren } = row.props as {
        children?: React.ReactNode;
      };
      React.Children.forEach(rowChildren ?? null, (cell) => {
        if (!isPrismTableSlot(cell, "PrismTableHead")) return;
        colCount += 1;
      });
    });
  });

  return { colCount };
}

function clampNumber(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function buildEqualColumnPercents(colCount: number): number[] {
  if (colCount <= 0) return [];
  const each = 100 / colCount;
  return Array.from({ length: colCount }, () => each);
}

/** One column gets `stretchPct`% of the row; siblings split the remainder evenly. */
function buildStretchRemainderPercents(
  colCount: number,
  stretchColumnIndex: number,
  stretchPct: number
): number[] {
  if (colCount <= 0) return [];
  if (colCount === 1) return [100];
  const idx = clampNumber(stretchColumnIndex, 0, colCount - 1);
  const s = clampNumber(stretchPct, 12, 88);
  const rest = (100 - s) / (colCount - 1);
  return Array.from({ length: colCount }, (_, i) => (i === idx ? s : rest));
}

function buildColgroupPercents(
  strategy: PrismTableColumnWidthStrategy,
  scan: PrismTableHeaderColumnScan,
  stretchColumnIndex: number | undefined,
  stretchPercent: number | undefined
): number[] | null {
  if (scan.colCount <= 0) return null;
  if (strategy === "equal") {
    return buildEqualColumnPercents(scan.colCount);
  }
  if (strategy === "stretchRemainder") {
    const idx =
      stretchColumnIndex !== undefined ? stretchColumnIndex : scan.colCount - 1;
    return buildStretchRemainderPercents(
      scan.colCount,
      idx,
      stretchPercent ?? 45
    );
  }
  return null;
}

function resolveTableLineToneCss(
  tone: PrismTableLineTone | undefined,
  prismColor: PartialPrismColorSpec
): string {
  switch (tone ?? "default") {
    case "swatch":
    case "default":
      return (
        resolvePrismSwatchLineCss(prismColor) ?? "hsl(var(--foreground) / 0.18)"
      );
    case "muted":
      return (
        resolvePrismSwatchLineMuted100Css(prismColor) ??
        "hsl(var(--muted-foreground) / 0.45)"
      );
    case "rich":
      return "hsl(var(--primary))";
    case "white":
      return "rgb(255 255 255 / 0.92)";
    case "black":
      return "rgb(0 0 0 / 0.82)";
    default:
      return "hsl(var(--foreground) / 0.18)";
  }
}

function resolveRowShadeBackgroundCss(
  prismColor: PartialPrismColorSpec,
  strength: PrismTableRowShadeStrength
): string | undefined {
  try {
    const normalized = normalizePrismColorSpec(prismColor);
    const family = normalized.swatchPrimary;
    if (!family) return undefined;
    const palette = normalized.palette;
    const tintHex = PrismColor.hex({ palette, family, shade: 50 });
    if (strength === "soft") {
      return `color-mix(in srgb, ${tintHex} 20%, var(--background))`;
    }
    return tintHex;
  } catch {
    return undefined;
  }
}

function lineWeightToPx(
  weight: PrismDividerLineWeight | PrismTableRowLineWeight | undefined
): number {
  if (weight === "none") return 0;
  switch (weight ?? "light") {
    case "light":
      return 1;
    case "thin":
      return 2;
    case "regular":
      return 3;
    case "bold":
      return 4;
    case "heavy":
      return 6;
    default:
      return 1;
  }
}

function gradientShadeArg(
  prismColor: PartialPrismColorSpec,
  normalized: ReturnType<typeof normalizePrismColorSpec>
): number | { light: number; dark: number } {
  const gShade = prismColor.gradient?.shade;
  if (gShade !== undefined && gShade !== null) return gShade;
  if (typeof normalized.shade === "number") return normalized.shade;
  return 500;
}

function resolveTableLineGradientCss(
  prismColor: PartialPrismColorSpec,
  direction: "horizontal" | "vertical"
): string | undefined {
  try {
    const n = normalizePrismColorSpec(prismColor);
    const palette = n.palette;
    const primary = PrismColor.Loop.normalize(
      palette,
      n.swatchPrimary ?? "blue"
    );
    const g = prismColor.gradient;
    const swatches =
      g?.swatches && g.swatches.length > 0
        ? g.swatches.map((s) => PrismColor.Loop.normalize(palette, s))
        : [primary, PrismColor.Loop.step(palette, primary, 1)];
    const { light } = PrismColor.gradient.linearStrings({
      palette,
      swatches,
      direction,
      shade: gradientShadeArg(prismColor, n),
      stopResolution: "resolved",
    });
    return light === "none" ? undefined : light;
  } catch {
    return undefined;
  }
}

function resolveHeaderRowAppearance(prismColor: PartialPrismColorSpec): {
  background: string;
  labelColor: string;
} {
  try {
    const n = normalizePrismColorSpec(prismColor);
    const palette = n.palette;
    const primary = PrismColor.Loop.normalize(
      palette,
      n.swatchPrimary ?? "blue"
    );
    const g = prismColor.gradient;
    let surfaceCss: string;
    if (g?.swatches && g.swatches.length > 0) {
      const { light } = PrismColor.gradient.linearStrings({
        palette,
        swatches: g.swatches.map((s) => PrismColor.Loop.normalize(palette, s)),
        direction: g.direction ?? "horizontal",
        shade: gradientShadeArg(prismColor, n),
        stopResolution: "resolved",
      });
      surfaceCss = light === "none" ? prismColorSpecToHex(prismColor) : light;
    } else {
      const num =
        typeof n.shade === "number"
          ? n.shade
          : typeof n.shade === "string"
            ? 400
            : 400;
      surfaceCss = PrismColor.hex({
        palette,
        family: primary,
        shade: Math.min(600, Math.max(320, num)),
      });
    }

    let labelSample = surfaceCss;
    if (surfaceCss.trim().startsWith("linear-gradient")) {
      const firstFamily = PrismColor.Loop.normalize(
        palette,
        g?.swatches?.[0] ?? primary
      );
      const shadeForSample =
        typeof (g?.shade ?? n.shade) === "number"
          ? (g?.shade ?? n.shade)
          : typeof n.shade === "number"
            ? n.shade
            : 450;
      labelSample = PrismColor.hex({
        palette,
        family: firstFamily,
        shade: typeof shadeForSample === "number" ? shadeForSample : 400,
      });
    }

    const labelColor = prismSwatchContrastInk({
      palette,
      surfaceCss: labelSample,
      swatchFamily: primary,
    });
    return { background: surfaceCss, labelColor };
  } catch {
    return {
      background: "var(--muted)",
      labelColor: "var(--foreground)",
    };
  }
}

function resolveHeaderLabelStyle(table: {
  headerRowSurface: PrismTableHeaderRowSurface;
  headerRowLabelTone: PrismTableHeaderLabelTone;
  headerRowLabelColorCss?: string;
  prismColor: PartialPrismColorSpec;
}): React.CSSProperties | undefined {
  const tone = table.headerRowLabelTone ?? "color";
  if (tone === "white") return { color: "#ffffff" };
  if (tone === "black") return { color: "#0a0a0a" };
  if (
    tone === "color" &&
    table.headerRowSurface === "color" &&
    table.headerRowLabelColorCss
  ) {
    return { color: table.headerRowLabelColorCss };
  }
  if (tone === "color" && table.headerRowSurface === "blank") {
    try {
      const n = normalizePrismColorSpec(table.prismColor);
      const palette = n.palette;
      const primary = PrismColor.Loop.normalize(
        palette,
        n.swatchPrimary ?? "blue"
      );
      const pageProxy = neutralSheetSurfaceHexForInk(palette);
      return {
        color: prismSwatchContrastInk({
          palette,
          surfaceCss: pageProxy,
          swatchFamily: primary,
        }),
      };
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Default ink for body/footer cells: set **`color`** on the inner wrapper so plain text and
 * {@link PrismTypography} without a **`color`** prop inherit. Per-cell overrides: pass **`color`**
 * on typography, or **`className` / `style`** on **`PrismTableCell`** / children.
 */
function bodyCellToneWrapperPaint(tone: PrismTableBodyTextTone | undefined): {
  className?: string;
  style?: React.CSSProperties;
} {
  switch (tone ?? "color") {
    case "white":
      return { style: { color: "#ffffff" } };
    case "black":
      return { style: { color: "#0a0a0a" } };
    default:
      return { className: "text-foreground" };
  }
}

export type PrismTableRootProps = React.ComponentProps<"div"> & {
  prismColor: PartialPrismColorSpec;
  rowLineWeight?: PrismTableRowLineWeight;
  rowLineTone?: PrismTableLineTone;
  /**
   * Column dividers: weight and tone only (solid / tokens / swatch). Painted on body/footer `td` only,
   * as inset `box-shadow`, so vertical guides sit under row borders (and can cross zebra fills).
   */
  columnLineWeight?: PrismTableColumnLineWeight;
  columnLineTone?: PrismTableLineTone;
  rowShading?: "even" | "odd";
  /** Zebra fill strength for `rowShading`. Default `full`. */
  rowShadeStrength?: PrismTableRowShadeStrength;
  /**
   * Header row: `blank` (default) matches page chrome; `color` fills the header from `prismColor`
   * (solid swatch face, or `prismColor.gradient` when set). Label ink uses {@link prismSwatchContrastInk}
   * when {@link PrismTableHeaderLabelTone} is `color`.
   */
  headerRowSurface?: PrismTableHeaderRowSurface;
  /**
   * Header label ink: `color` uses {@link prismSwatchContrastInk} from the filled header face, or from
   * the active swatch against a light/dark page proxy when the header row is `blank`; `white` / `black` force that ink.
   */
  headerRowLabelTone?: PrismTableHeaderLabelTone;
  /**
   * Default body/footer cell ink when children inherit (omit **`color`** on {@link PrismTypography}).
   * `color` uses theme foreground when zebra is off; with zebra on, every body row uses the same
   * {@link prismSwatchContrastInk} as the tinted rows (tint **50** vs paper **white** in light mode).
   * `white` / `black` force that ink. Local **`color`** on a child still wins.
   */
  bodyTextTone?: PrismTableBodyTextTone;
  /** Row dividers: class-based (`solid`, default) or `linear-gradient` from `prismColor`. */
  rowLineVisual?: PrismTableLineVisual;
  /**
   * Border around the whole table (wrapper). Weight/tone follow the same tokens as row/column rules.
   * Omit or `none` for no outer frame.
   */
  tableBorderWeight?: PrismTableOuterLineWeight;
  /** Line tone for {@link PrismTableRootProps.tableBorderWeight}. Ignored when there is no outer border. */
  tableBorderTone?: PrismTableLineTone;
  /** Corner radius of the outer table frame. */
  tableCorners?: PrismTableCornerStyle;
  /**
   * Column width strategy (see {@link PrismTableColumnWidthStrategy}). Default **`equal`**.
   */
  columnWidthStrategy?: PrismTableColumnWidthStrategy;
  /**
   * When {@link PrismTableRootProps.columnWidthStrategy} is **`stretchRemainder`**, 0-based column index
   * that receives {@link PrismTableRootProps.columnStretchPercent}. Default: last column.
   */
  columnStretchColumnIndex?: number;
  /**
   * When {@link PrismTableRootProps.columnWidthStrategy} is **`stretchRemainder`**, percent of total
   * table width for {@link PrismTableRootProps.columnStretchColumnIndex} (12–88). Default **45**.
   */
  columnStretchPercent?: number;
  sortedColumnId?: string | null;
  sortedOrder?: PrismTableSortOrder | null;
  onSortedOrderChange?: (
    columnId: string,
    sortedOrder: PrismTableSortOrder
  ) => void;
  children: React.ReactNode;
};

function PrismTable({
  className,
  prismColor,
  rowLineWeight,
  rowLineTone,
  columnLineWeight,
  columnLineTone,
  rowShading,
  rowShadeStrength = "full",
  headerRowSurface = "blank",
  headerRowLabelTone = "color",
  bodyTextTone = "color",
  rowLineVisual = "solid",
  tableBorderWeight,
  tableBorderTone = "default",
  tableCorners = "square",
  columnWidthStrategy = "equal",
  columnStretchColumnIndex,
  columnStretchPercent = 45,
  sortedColumnId: sortedColumnIdControlled,
  sortedOrder: sortedOrderControlled,
  onSortedOrderChange,
  children,
  style,
  ...rest
}: PrismTableRootProps): React.JSX.Element {
  const isControlled =
    sortedColumnIdControlled !== undefined &&
    sortedOrderControlled !== undefined;

  const [sortedColumnIdInternal, setSortedColumnIdInternal] = React.useState<
    string | null
  >(null);
  const [sortedOrderInternal, setSortedOrderInternal] =
    React.useState<PrismTableSortOrder | null>(null);

  const registrationsRef = React.useRef<Map<string, RegisteredHead>>(new Map());
  const [registrationEpoch, setRegistrationEpoch] = React.useState(0);

  const registerHead = React.useCallback(
    (columnId: string, meta: RegisteredHead) => {
      registrationsRef.current.set(columnId, meta);
      setRegistrationEpoch((n) => n + 1);
    },
    []
  );

  const unregisterHead = React.useCallback((columnId: string) => {
    registrationsRef.current.delete(columnId);
    setRegistrationEpoch((n) => n + 1);
  }, []);

  const sortedColumnId = isControlled
    ? (sortedColumnIdControlled ?? null)
    : sortedColumnIdInternal;
  const sortedOrder = isControlled
    ? (sortedOrderControlled ?? null)
    : sortedOrderInternal;

  React.useLayoutEffect(() => {
    if (isControlled) return;
    if (sortedColumnIdInternal !== null || sortedOrderInternal !== null) {
      return;
    }
    for (const [columnId, meta] of registrationsRef.current) {
      if (meta.sortable && meta.initialSortOrder !== undefined) {
        setSortedColumnIdInternal(columnId);
        setSortedOrderInternal(meta.initialSortOrder);
        return;
      }
    }
  }, [
    isControlled,
    registrationEpoch,
    sortedColumnIdInternal,
    sortedOrderInternal,
  ]);

  const onHeaderSortClick = React.useCallback(
    (columnId: string) => {
      const meta = registrationsRef.current.get(columnId);
      if (!meta?.sortable) return;

      const nextColumn = columnId;
      let nextOrder: PrismTableSortOrder;

      if (sortedColumnId === columnId && sortedOrder !== null) {
        nextOrder = sortedOrder === "ascending" ? "descending" : "ascending";
      } else {
        nextOrder = meta.initialSortOrder ?? "ascending";
      }

      if (isControlled) {
        onSortedOrderChange?.(nextColumn, nextOrder);
      } else {
        setSortedColumnIdInternal(nextColumn);
        setSortedOrderInternal(nextOrder);
        onSortedOrderChange?.(nextColumn, nextOrder);
      }
    },
    [isControlled, onSortedOrderChange, sortedColumnId, sortedOrder]
  );

  const columnScan = scanTableHeaderColumns(children);
  const colgroupPercents = buildColgroupPercents(
    columnWidthStrategy,
    columnScan,
    columnStretchColumnIndex,
    columnStretchPercent
  );

  const useFixedColumnLayout =
    (columnWidthStrategy === "equal" ||
      columnWidthStrategy === "stretchRemainder") &&
    Boolean(colgroupPercents && colgroupPercents.length > 0);

  const pickerTableLineCss =
    resolvePrismSwatchLineCss(prismColor) ?? "hsl(var(--foreground) / 0.18)";
  const pickerMuted100LineCss =
    resolvePrismSwatchLineMuted100Css(prismColor) ??
    "hsl(var(--muted-foreground) / 0.45)";

  const rowShadeBackgroundCss =
    rowShading !== undefined
      ? (resolveRowShadeBackgroundCss(prismColor, rowShadeStrength) ??
        "var(--muted)")
      : undefined;

  const rowBorderClassName =
    rowLineWeight === "none"
      ? ""
      : prismTableRowBorderVariants({
          lineWeight: rowLineWeight,
          lineTone: rowLineTone,
        });

  const outerFrameBorderActive =
    tableBorderWeight !== undefined && tableBorderWeight !== "none";

  const outerCornerClassName =
    tableCorners === "rounded" ? "rounded-lg overflow-hidden" : "";

  const headerRowTint =
    headerRowSurface === "color"
      ? resolveHeaderRowAppearance(prismColor)
      : undefined;

  const rowLineGradientCss =
    rowLineVisual === "gradient"
      ? resolveTableLineGradientCss(prismColor, "horizontal")
      : undefined;

  const contextValue = React.useMemo(
    (): PrismTableContextValue => ({
      prismColor,
      rowLineWeight,
      rowLineTone,
      columnLineWeight,
      columnLineTone,
      rowShading,
      rowShadeBackgroundCss,
      rowBorderClassName,
      headerRowSurface,
      headerRowLabelTone,
      headerRowBackgroundCss: headerRowTint?.background,
      headerRowLabelColorCss: headerRowTint?.labelColor,
      rowLineVisual,
      rowLineGradientCss,
      bodyTextTone,
      sortedColumnId,
      sortedOrder,
      isControlled,
      registerHead,
      unregisterHead,
      onHeaderSortClick,
      outerFrameBorderActive,
      tableCorners,
      columnWidthStrategy,
    }),
    [
      prismColor,
      rowLineWeight,
      rowLineTone,
      columnLineWeight,
      columnLineTone,
      rowShading,
      rowShadeBackgroundCss,
      rowBorderClassName,
      headerRowSurface,
      headerRowLabelTone,
      headerRowTint,
      rowLineVisual,
      rowLineGradientCss,
      bodyTextTone,
      sortedColumnId,
      sortedOrder,
      isControlled,
      registerHead,
      unregisterHead,
      onHeaderSortClick,
      outerFrameBorderActive,
      tableCorners,
      columnWidthStrategy,
    ]
  );

  const rootStyle = React.useMemo((): React.CSSProperties => {
    const merged: React.CSSProperties = { ...(style ?? {}) };
    Object.assign(merged, {
      "--prism-table-line": pickerTableLineCss,
      "--prism-table-muted-line": pickerMuted100LineCss,
    } as React.CSSProperties);
    const outerActive =
      tableBorderWeight !== undefined && tableBorderWeight !== "none";
    if (outerActive) {
      const px = lineWeightToPx(tableBorderWeight as PrismDividerLineWeight);
      Object.assign(merged, {
        borderStyle: "solid",
        borderWidth: `${px}px`,
        borderColor: resolveTableLineToneCss(tableBorderTone, prismColor),
      } as React.CSSProperties);
    }
    return merged;
  }, [
    style,
    pickerTableLineCss,
    pickerMuted100LineCss,
    prismColor,
    tableBorderWeight,
    tableBorderTone,
  ]);

  return (
    <PrismTableContext.Provider value={contextValue}>
      <div
        data-slot="table-root"
        className={cn(
          "relative w-full min-w-0 overflow-x-auto",
          outerCornerClassName,
          className
        )}
        style={rootStyle}
        {...rest}
      >
        <table
          className={cn(
            "w-full border-separate border-spacing-0 caption-bottom text-sm",
            useFixedColumnLayout && "[&_th]:min-w-0 [&_td]:min-w-0 table-fixed",
            columnWidthStrategy === "auto" && "table-auto"
          )}
        >
          {colgroupPercents && colgroupPercents.length > 0 ? (
            <colgroup>
              {colgroupPercents.map((pct, i) => (
                <col key={i} style={{ width: `${pct}%` }} />
              ))}
            </colgroup>
          ) : null}
          {children}
        </table>
      </div>
    </PrismTableContext.Provider>
  );
}

export type PrismTableCaptionProps = React.ComponentProps<"caption">;

function PrismTableCaption({
  className,
  ...props
}: PrismTableCaptionProps): React.JSX.Element {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export type PrismTableHeaderProps = React.ComponentProps<"thead">;

function PrismTableHeader({
  className,
  style,
  children,
  ...props
}: PrismTableHeaderProps): React.JSX.Element {
  const table = usePrismTableContext("PrismTableHeader");
  const mergedStyle: React.CSSProperties = { ...(style ?? {}) };
  if (
    table.headerRowSurface === "color" &&
    table.headerRowBackgroundCss !== undefined
  ) {
    mergedStyle.background = table.headerRowBackgroundCss;
  }

  let headerBottomClassName: string;
  if (table.headerRowSurface === "color") {
    headerBottomClassName = cn(
      "border-b",
      "border-black/10 dark:border-white/10"
    );
  } else if (table.rowLineWeight === "none") {
    headerBottomClassName = "border-b border-border";
  } else if (table.rowLineVisual === "gradient" && table.rowLineGradientCss) {
    headerBottomClassName = "";
    const bw = lineWeightToPx(
      (table.rowLineWeight ?? "light") as PrismDividerLineWeight
    );
    Object.assign(mergedStyle, {
      backgroundImage: table.rowLineGradientCss,
      backgroundSize: `100% ${bw}px`,
      backgroundPosition: "bottom",
      backgroundRepeat: "no-repeat",
    });
  } else {
    headerBottomClassName = table.rowBorderClassName;
  }

  const wrappedChildren = React.Children.map(children, (child) => {
    if (!isPrismTableSlot(child, "PrismTableRow")) return child;
    return React.cloneElement(
      child as React.ReactElement<{ rowGroup?: "header" | "body" }>,
      { rowGroup: "header" }
    );
  });

  return (
    <thead
      data-slot="table-header"
      className={cn(
        headerBottomClassName,
        table.tableCorners === "rounded" && "rounded-t-lg overflow-hidden",
        className
      )}
      style={mergedStyle}
      {...props}
    >
      {wrappedChildren}
    </thead>
  );
}

export type PrismTableBodyProps = React.ComponentProps<"tbody">;

function PrismTableBody({
  className,
  children,
  ...props
}: PrismTableBodyProps): React.JSX.Element {
  const table = usePrismTableContext("PrismTableBody");
  const { rowShading, rowShadeBackgroundCss } = table;

  const childArr = React.Children.toArray(children);
  let lastBodyRowIndex = -1;
  for (let i = childArr.length - 1; i >= 0; i--) {
    if (isPrismTableRowElement(childArr[i])) {
      lastBodyRowIndex = i;
      break;
    }
  }

  const wrapped = React.Children.map(children, (child, index) => {
    if (!isPrismTableRowElement(child)) return child;
    const shadeThisRow =
      rowShading === "even"
        ? index % 2 === 0
        : rowShading === "odd"
          ? index % 2 === 1
          : false;
    return React.cloneElement(child, {
      rowIndex: index,
      isLastBodyRow: index === lastBodyRowIndex,
      rowShadeActive: shadeThisRow,
      rowShadeBackgroundCss,
    } as Partial<React.ComponentProps<typeof PrismTableRow>>);
  });

  return (
    <tbody data-slot="table-body" className={cn(className)} {...props}>
      {wrapped}
    </tbody>
  );
}

PrismTableHeader.displayName = "PrismTableHeader";
PrismTableBody.displayName = "PrismTableBody";

export type PrismTableFooterProps = React.ComponentProps<"tfoot">;

/**
 * Footer row group: minimal chrome only. Does not yet participate in
 * {@link PrismTableRootProps} row/column rules, zebra, or body text tone.
 */
function PrismTableFooter({
  className,
  ...props
}: PrismTableFooterProps): React.JSX.Element {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr:last-child>td]:border-b-0",
        className
      )}
      {...props}
    />
  );
}

export type PrismTableRowProps = React.ComponentProps<"tr"> & {
  rowIndex?: number;
  /** Set by {@link PrismTableBody} on the last data row. */
  isLastBodyRow?: boolean;
  rowShadeActive?: boolean;
  rowShadeBackgroundCss?: string | undefined;
  /**
   * `header` skips row-line rules (weight, tone, solid, gradient). {@link PrismTableHeader}
   * injects this on direct `PrismTableRow` children so header chrome stays separate from body row lines.
   */
  rowGroup?: "header" | "body";
};

function PrismTableRow({
  className,
  style,
  rowIndex: rowIndexProp,
  isLastBodyRow = false,
  rowShadeActive,
  rowShadeBackgroundCss,
  rowGroup = "body",
  children,
  ...props
}: PrismTableRowProps): React.JSX.Element {
  const table = usePrismTableContext("PrismTableRow");
  const isHeaderRow = rowGroup === "header";
  const rowLineOff = table.rowLineWeight === "none" || isHeaderRow;
  const suppressBottomRule =
    rowGroup === "body" && table.outerFrameBorderActive && isLastBodyRow;
  const rowStyle: React.CSSProperties = { ...(style ?? {}) };
  const zebraActive =
    !isHeaderRow && (table.rowShading === "even" || table.rowShading === "odd");
  if (rowShadeActive && rowShadeBackgroundCss) {
    rowStyle.backgroundColor = rowShadeBackgroundCss;
  }

  const useRowGradient =
    !isHeaderRow &&
    !rowLineOff &&
    !suppressBottomRule &&
    table.rowLineVisual === "gradient" &&
    Boolean(table.rowLineGradientCss);
  if (useRowGradient) {
    const bw = lineWeightToPx(table.rowLineWeight);
    /** `border-image` on `tr` is unreliable in table layout; paint the rule as a bottom background strip. */
    Object.assign(rowStyle, {
      backgroundImage: table.rowLineGradientCss,
      backgroundSize: `100% ${bw}px`,
      backgroundPosition: "bottom",
      backgroundRepeat: "no-repeat",
    });
  }

  const showSolidRowLine =
    !isHeaderRow && !rowLineOff && !useRowGradient && !suppressBottomRule;

  let swatchAwareBodyInkStyle: React.CSSProperties | undefined;
  if (!isHeaderRow && table.bodyTextTone === "color" && zebraActive) {
    try {
      const n = normalizePrismColorSpec(table.prismColor);
      const family = n.swatchPrimary;
      if (family) {
        const palette = n.palette;
        const primary = PrismColor.Loop.normalize(palette, family);
        const surfaceHex =
          rowShadeActive && rowShadeBackgroundCss
            ? PrismColor.hex({ palette, family: primary, shade: 50 })
            : neutralSheetSurfaceHexForInk(palette);
        swatchAwareBodyInkStyle = {
          color: prismSwatchContrastInk({
            palette,
            surfaceCss: surfaceHex,
            swatchFamily: primary,
          }),
        };
      }
    } catch {
      swatchAwareBodyInkStyle = undefined;
    }
  }

  const childArray = React.Children.toArray(children);
  let lastCellIdx = -1;
  for (let i = childArray.length - 1; i >= 0; i--) {
    if (isPrismTableCellElement(childArray[i])) {
      lastCellIdx = i;
      break;
    }
  }

  const rowChildren =
    rowGroup === "header"
      ? children
      : React.Children.map(children, (child, index) => {
          if (!isPrismTableCellElement(child)) return child;
          const columnRuleAfter =
            table.columnLineWeight !== "none" && index !== lastCellIdx;
          if (!columnRuleAfter) return child;
          return React.cloneElement(
            child as React.ReactElement<{ columnRuleAfter?: boolean }>,
            { columnRuleAfter: true }
          );
        });

  return (
    <PrismTableRowChromeContext.Provider
      value={{ solidRowBottom: showSolidRowLine, swatchAwareBodyInkStyle }}
    >
      <tr
        data-slot="table-row"
        data-row-index={rowIndexProp}
        data-row-group={rowGroup}
        className={cn(
          "transition-colors",
          zebraActive && !rowShadeActive && "bg-white dark:bg-background",
          className
        )}
        style={rowStyle}
        {...props}
      >
        {rowChildren}
      </tr>
    </PrismTableRowChromeContext.Provider>
  );
}

PrismTableRow.displayName = "PrismTableRow";

/** Default: uppercase black label. `plain` uses body-weight text for tables that need quieter headers. */
export type PrismTableHeadTypography = "emphasized" | "plain";

export type PrismTableHeadProps =
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    columnId: string;
    sortable?: boolean;
    initialSortOrder?: PrismTableSortOrder;
    sortComparison?: PrismTableSortComparison;
    headerTypography?: PrismTableHeadTypography;
    /** Right-align with tabular figures — pair with monospace body text for numeric columns. */
    numeric?: boolean;
  };

function PrismTableHead({
  className,
  columnId,
  sortable = false,
  initialSortOrder,
  sortComparison = "alphabetical",
  headerTypography = "emphasized",
  numeric = false,
  children,
  scope = "col",
  style: thStyle,
  ...rest
}: PrismTableHeadProps): React.JSX.Element {
  const { registerHead, unregisterHead, ...table } =
    usePrismTableContext("PrismTableHead");

  React.useLayoutEffect(() => {
    registerHead(columnId, {
      sortable,
      initialSortOrder,
      sortComparison,
    });
    return () => {
      unregisterHead(columnId);
    };
  }, [
    columnId,
    initialSortOrder,
    sortComparison,
    sortable,
    registerHead,
    unregisterHead,
  ]);

  const isSorted = table.sortedColumnId === columnId;
  const ariaSort: React.AriaAttributes["aria-sort"] = !sortable
    ? undefined
    : isSorted && table.sortedOrder === "ascending"
      ? "ascending"
      : isSorted && table.sortedOrder === "descending"
        ? "descending"
        : "none";

  const headerFill = table.headerRowSurface === "color";
  const labelStyle = resolveHeaderLabelStyle(table);

  const headerLabel =
    headerTypography === "plain" ? (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium",
          !labelStyle && "text-foreground"
        )}
        style={labelStyle}
      >
        {children}
      </span>
    ) : (
      <PrismTypography
        role="label"
        size="regular"
        as="span"
        fontWeight="heavy"
        textTransform="uppercase"
        textWrap="nowrap"
        color={labelStyle ? undefined : { semanticText: "foreground" }}
        style={labelStyle}
        className="inline-flex items-center gap-1 tracking-wide"
      >
        {children}
      </PrismTypography>
    );

  const thCls = cn(
    "min-h-14 px-3 py-3 align-middle [&:has([role=checkbox])]:pr-0",
    numeric &&
      (table.columnWidthStrategy === "auto"
        ? "w-[1%] whitespace-nowrap text-right tabular-nums"
        : "whitespace-nowrap text-right tabular-nums"),
    !numeric && "text-left",
    className
  );

  if (!sortable) {
    return (
      <th
        data-slot="table-head"
        scope={scope}
        className={thCls}
        style={thStyle}
        {...rest}
      >
        {headerLabel}
      </th>
    );
  }

  return (
    <th
      data-slot="table-head"
      scope={scope}
      aria-sort={ariaSort}
      className={thCls}
      style={thStyle}
      {...rest}
    >
      <button
        type="button"
        className={cn(
          "-mx-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          table.tableCorners === "rounded" && "focus-visible:ring-inset",
          headerFill
            ? "hover:bg-black/10 dark:hover:bg-white/10"
            : "hover:bg-muted/60",
          numeric ? "ms-auto max-w-full text-right" : "text-left"
        )}
        onClick={() => {
          table.onHeaderSortClick(columnId);
        }}
      >
        {headerLabel}
        <span className="sr-only">
          {isSorted && table.sortedOrder === "ascending"
            ? "sorted ascending, activate to sort descending"
            : isSorted && table.sortedOrder === "descending"
              ? "sorted descending, activate to sort ascending"
              : "activate to sort"}
        </span>
      </button>
    </th>
  );
}

PrismTableHead.displayName = "PrismTableHead";

export type PrismTableCellProps =
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    /** When true, paints the trailing column guide (set by {@link PrismTableRow} on body/footer rows). */
    columnRuleAfter?: boolean;
    /** Right-align with tabular figures for numeric / mono columns. */
    numeric?: boolean;
  };

function PrismTableCell({
  className,
  numeric = false,
  columnRuleAfter = false,
  style: tdStyle,
  children,
  ...props
}: PrismTableCellProps): React.JSX.Element {
  const table = usePrismTableContext("PrismTableCell");
  const rowChrome = usePrismTableRowChrome();
  const rowBottomClass =
    rowChrome?.solidRowBottom && table.rowBorderClassName
      ? table.rowBorderClassName
      : "";

  const columnShadow: React.CSSProperties =
    columnRuleAfter && table.columnLineWeight !== "none"
      ? {
          boxShadow: `inset -${lineWeightToPx(
            (table.columnLineWeight ?? "light") as PrismDividerLineWeight
          )}px 0 0 0 ${resolveTableLineToneCss(
            table.columnLineTone,
            table.prismColor
          )}`,
        }
      : {};

  const mergedStyle: React.CSSProperties = {
    ...columnShadow,
    ...tdStyle,
  };

  const tonePaint = bodyCellToneWrapperPaint(table.bodyTextTone);
  const rowInk =
    table.bodyTextTone === "color"
      ? rowChrome?.swatchAwareBodyInkStyle
      : undefined;
  const wrapperStyle: React.CSSProperties = {
    ...tonePaint.style,
    ...rowInk,
  };
  const swatchBodyInkActive =
    typeof rowInk?.color === "string" && rowInk.color.length > 0;

  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-3 align-middle [&:has([role=checkbox])]:pr-0",
        numeric &&
          (table.columnWidthStrategy === "auto"
            ? "w-[1%] whitespace-nowrap text-right tabular-nums"
            : "whitespace-nowrap text-right tabular-nums"),
        rowBottomClass,
        className
      )}
      style={mergedStyle}
      {...props}
    >
      <div
        className={cn("min-w-0", !swatchBodyInkActive && tonePaint.className)}
        style={wrapperStyle}
      >
        {children}
      </div>
    </td>
  );
}

PrismTableCell.displayName = "PrismTableCell";

export {
  PrismTable,
  PrismTableCaption,
  PrismTableHeader,
  PrismTableBody,
  PrismTableFooter,
  PrismTableRow,
  PrismTableHead,
  PrismTableCell,
};
