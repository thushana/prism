"use client";

import type { JSX } from "react";
import { useMemo, useState } from "react";

import {
  PrismCodeBlock,
  PrismColorPicker,
  PrismTable,
  PrismTableBody,
  PrismTableCell,
  PrismTableHead,
  PrismTableHeader,
  PrismTableRow,
  PrismTypography,
  type PartialPrismColorSpec,
  type PrismTableBodyTextTone,
  type PrismTableColumnLineWeight,
  type PrismTableColumnWidthStrategy,
  type PrismTableCornerStyle,
  type PrismTableHeaderLabelTone,
  type PrismTableHeaderRowSurface,
  type PrismTableLineTone,
  type PrismTableLineVisual,
  type PrismTableOuterLineWeight,
  type PrismTableRowLineWeight,
  type PrismTableSortOrder,
} from "@ui";

type DemoRow = {
  id: string;
  item: string;
  category: string;
  qty: string;
  sortItem: string;
  sortCategory: string;
  sortQty: string;
};

const DEMO_ROWS: DemoRow[] = [
  {
    id: "a",
    item: "Indigo · primary",
    category: "Row lines",
    qty: "500",
    sortItem: "indigo · primary",
    sortCategory: "row lines",
    sortQty: "500",
  },
  {
    id: "b",
    item: "Rose · wash",
    category: "Zebra (rows)",
    qty: "100",
    sortItem: "rose · wash",
    sortCategory: "zebra (rows)",
    sortQty: "100",
  },
  {
    id: "c",
    item: "Zinc · hairline",
    category: "Column lines",
    qty: "400",
    sortItem: "zinc · hairline",
    sortCategory: "column lines",
    sortQty: "400",
  },
  {
    id: "d",
    item: "Amber · header",
    category: "Header row",
    qty: "700",
    sortItem: "amber · header",
    sortCategory: "header row",
    sortQty: "700",
  },
  {
    id: "e",
    item: "Violet · loop",
    category: "Gradient",
    qty: "350",
    sortItem: "violet · loop",
    sortCategory: "gradient",
    sortQty: "350",
  },
];

function sortKeyForColumn(
  row: DemoRow,
  columnId: "item" | "category" | "qty"
): string {
  switch (columnId) {
    case "item":
      return row.sortItem;
    case "category":
      return row.sortCategory;
    case "qty":
      return row.sortQty;
    default:
      return "";
  }
}

function sortDemoRows(
  rows: DemoRow[],
  sortedColumnId: string | null,
  sortedOrder: PrismTableSortOrder | null
): DemoRow[] {
  if (!sortedColumnId || !sortedOrder) return rows;
  const col = sortedColumnId as "item" | "category" | "qty";
  const mult = sortedOrder === "ascending" ? 1 : -1;
  return [...rows].sort(
    (a, b) =>
      sortKeyForColumn(a, col).localeCompare(
        sortKeyForColumn(b, col),
        undefined,
        {
          sensitivity: "base",
          numeric: true,
        }
      ) * mult
  );
}

function formatPrismTableSnippet(
  prismColor: PartialPrismColorSpec,
  opts: {
    rowLineWeight: PrismTableRowLineWeight;
    rowLineTone: PrismTableLineTone;
    columnLineWeight: PrismTableColumnLineWeight;
    columnLineTone: PrismTableLineTone;
    rowShading?: "even" | "odd";
    rowShadeStrength: "full" | "soft";
    headerRowSurface: PrismTableHeaderRowSurface;
    headerRowLabelTone: PrismTableHeaderLabelTone;
    bodyTextTone: PrismTableBodyTextTone;
    rowLineVisual: PrismTableLineVisual;
    tableBorderWeight?: PrismTableOuterLineWeight;
    tableBorderTone: PrismTableLineTone;
    tableCorners: PrismTableCornerStyle;
    columnWidthStrategy: PrismTableColumnWidthStrategy;
    columnStretchColumnIndex?: number;
    columnStretchPercent?: number;
  }
): string {
  const { swatchPrimary, shade, palette } = prismColor;
  const shadeStr =
    typeof shade === "number" || typeof shade === "string"
      ? String(shade)
      : "500";
  const paletteLine =
    palette && palette !== "default" ? `    palette: "${palette}",\n` : "";
  const rowShadeLine = opts.rowShading
    ? `  rowShading="${opts.rowShading}"\n`
    : "";
  const zebraStrengthLine = opts.rowShading
    ? `  rowShadeStrength="${opts.rowShadeStrength}"\n`
    : "";
  const headerSurfaceLine =
    opts.headerRowSurface === "color" ? `  headerRowSurface="color"\n` : "";
  const headerLabelToneLine =
    opts.headerRowLabelTone !== "color"
      ? `  headerRowLabelTone="${opts.headerRowLabelTone}"\n`
      : "";
  const bodyTextToneLine =
    opts.bodyTextTone !== "color"
      ? `  bodyTextTone="${opts.bodyTextTone}"\n`
      : "";
  const rowVisualLine =
    opts.rowLineVisual === "gradient" ? `  rowLineVisual="gradient"\n` : "";
  const tableBorderBlock =
    opts.tableBorderWeight !== undefined && opts.tableBorderWeight !== "none"
      ? `  tableBorderWeight="${opts.tableBorderWeight}"\n  tableBorderTone="${opts.tableBorderTone}"\n`
      : "";
  const tableCornersLine =
    opts.tableCorners === "rounded" ? `  tableCorners="rounded"\n` : "";
  const columnWidthLine =
    opts.columnWidthStrategy !== "equal"
      ? `  columnWidthStrategy="${opts.columnWidthStrategy}"\n`
      : "";
  const columnStretchBlock =
    opts.columnWidthStrategy === "stretchRemainder"
      ? `  columnStretchColumnIndex={${opts.columnStretchColumnIndex ?? DEMO_STRETCH_COLUMN_INDEX}}\n  columnStretchPercent={${opts.columnStretchPercent ?? 45}}\n`
      : "";
  return `import {
  PrismTable,
  PrismTableBody,
  PrismTableCell,
  PrismTableHead,
  PrismTableHeader,
  PrismTableRow,
} from "@ui";

<PrismTable
  prismColor={{
${paletteLine}    swatchPrimary: "${swatchPrimary}",
    shade: ${shadeStr},
  }}
  rowLineWeight="${opts.rowLineWeight}"
  rowLineTone="${opts.rowLineTone}"
  columnLineWeight="${opts.columnLineWeight}"
  columnLineTone="${opts.columnLineTone}"
${headerSurfaceLine}${headerLabelToneLine}${bodyTextToneLine}${rowVisualLine}${tableBorderBlock}${tableCornersLine}${columnWidthLine}${columnStretchBlock}${rowShadeLine}${zebraStrengthLine}  sortedColumnId={sortedColumnId}
  sortedOrder={sortedOrder}
  onSortedOrderChange={(columnId, nextOrder) => {
    setSortedColumnId(columnId);
    setSortedOrder(nextOrder);
  }}
>
  <PrismTableHeader>
    <PrismTableRow>
      <PrismTableHead
        columnId="item"
        sortable
        initialSortOrder="ascending"
        sortComparison="alphabetical"
      >
        Swatch
      </PrismTableHead>
      <PrismTableHead
        columnId="category"
        sortable
        initialSortOrder="ascending"
        sortComparison="alphabetical"
      >
        Layer
      </PrismTableHead>
      <PrismTableHead
        columnId="qty"
        sortable
        initialSortOrder="descending"
        sortComparison="numeric"
        numeric
      >
        Shade
      </PrismTableHead>
    </PrismTableRow>
  </PrismTableHeader>
  <PrismTableBody>…</PrismTableBody>
</PrismTable>
`;
}

/** Shared row/column rule weights (`none` removes that axis of rules). */
const AXIS_LINE_WEIGHT_OPTIONS: {
  value: PrismTableRowLineWeight;
  label: string;
}[] = [
  { value: "none", label: "none" },
  { value: "hairline", label: "hairline" },
  { value: "thin", label: "thin" },
  { value: "medium", label: "medium" },
  { value: "thick", label: "thick" },
];

/** 0-based column index for `stretchRemainder` in this demo (last column in the sample table). */
const DEMO_STRETCH_COLUMN_INDEX = 2;

/** Playground labels: `color` → API `swatch`, `monotone` → `default` (neutral rule). */
const PLAYGROUND_LINE_TONES: { value: PrismTableLineTone; label: string }[] = [
  { value: "swatch", label: "color" },
  { value: "muted", label: "muted" },
  { value: "default", label: "monotone" },
  { value: "primary", label: "primary" },
  { value: "white", label: "white" },
];

const ZEBRA_AXIS_OPTIONS: { value: "even" | "odd" | "off"; label: string }[] = [
  { value: "even", label: "even" },
  { value: "odd", label: "odd" },
  { value: "off", label: "off" },
];

const ZEBRA_STRENGTH_OPTIONS: { value: "full" | "soft"; label: string }[] = [
  { value: "full", label: "full" },
  { value: "soft", label: "soft" },
];

const HEADER_ROW_SURFACE_OPTIONS: {
  value: PrismTableHeaderRowSurface;
  label: string;
}[] = [
  { value: "blank", label: "blank" },
  { value: "color", label: "color" },
];

const HEADER_LABEL_TONE_OPTIONS: {
  value: PrismTableHeaderLabelTone;
  label: string;
}[] = [
  { value: "color", label: "color" },
  { value: "white", label: "white" },
  { value: "black", label: "black" },
];

const BODY_TEXT_TONE_OPTIONS: {
  value: PrismTableBodyTextTone;
  label: string;
}[] = HEADER_LABEL_TONE_OPTIONS;

const LINE_VISUAL_OPTIONS: { value: PrismTableLineVisual; label: string }[] = [
  { value: "solid", label: "solid" },
  { value: "gradient", label: "gradient" },
];

const TABLE_CORNER_OPTIONS: {
  value: PrismTableCornerStyle;
  label: string;
}[] = [
  { value: "square", label: "square" },
  { value: "rounded", label: "rounded" },
];

const COLUMN_WIDTH_STRATEGY_OPTIONS: {
  value: PrismTableColumnWidthStrategy;
  label: string;
}[] = [
  { value: "equal", label: "equal (default)" },
  { value: "auto", label: "auto" },
  { value: "stretchRemainder", label: "stretch remainder" },
];

/** Code sample panel uses a fixed tint so it does not follow the live table color picker. */
const CODE_SAMPLE_PRISM_COLOR: PartialPrismColorSpec = {
  palette: "default",
  swatchPrimary: "slate",
  shade: 600,
};

/** Admin playground for {@link PrismTable}: borders, zebra shading, and controlled sort. */
export function PrismTableDemo(): JSX.Element {
  const [prismColor, setPrismColor] = useState<PartialPrismColorSpec>({
    palette: "default",
    swatchPrimary: "indigo",
    shade: 500,
  });
  const [rowLineWeight, setRowLineWeight] =
    useState<PrismTableRowLineWeight>("thin");
  const [columnLineWeight, setColumnLineWeight] =
    useState<PrismTableColumnLineWeight>("hairline");
  const [rowLineTone, setRowLineTone] = useState<PrismTableLineTone>("swatch");
  const [columnLineTone, setColumnLineTone] =
    useState<PrismTableLineTone>("swatch");
  const [rowShading, setRowShading] = useState<"even" | "odd" | "off">("even");
  const [rowShadeStrength, setRowShadeStrength] = useState<"full" | "soft">(
    "soft"
  );
  const [headerRowSurface, setHeaderRowSurface] =
    useState<PrismTableHeaderRowSurface>("blank");
  const [headerRowLabelTone, setHeaderRowLabelTone] =
    useState<PrismTableHeaderLabelTone>("color");
  const [rowLineVisual, setRowLineVisual] =
    useState<PrismTableLineVisual>("solid");
  const [bodyTextTone, setBodyTextTone] =
    useState<PrismTableBodyTextTone>("color");
  const [tableBorderWeight, setTableBorderWeight] =
    useState<PrismTableOuterLineWeight>("none");
  const [tableBorderTone, setTableBorderTone] =
    useState<PrismTableLineTone>("swatch");
  const [tableCorners, setTableCorners] =
    useState<PrismTableCornerStyle>("square");
  const [columnWidthStrategy, setColumnWidthStrategy] =
    useState<PrismTableColumnWidthStrategy>("equal");
  const [sortedColumnId, setSortedColumnId] = useState<string | null>("item");
  const [sortedOrder, setSortedOrder] =
    useState<PrismTableSortOrder>("ascending");

  const sortedRows = useMemo(
    () => sortDemoRows(DEMO_ROWS, sortedColumnId, sortedOrder),
    [sortedColumnId, sortedOrder]
  );

  const rowShadingProp = rowShading === "off" ? undefined : rowShading;
  const shadeStrengthDisabled = rowShading === "off";

  const tableBorderWeightProp =
    tableBorderWeight === "none" ? undefined : tableBorderWeight;

  const generatedSnippet = useMemo(
    () =>
      formatPrismTableSnippet(prismColor, {
        rowLineWeight,
        rowLineTone,
        columnLineWeight,
        columnLineTone,
        rowShading: rowShadingProp,
        rowShadeStrength,
        headerRowSurface,
        headerRowLabelTone,
        bodyTextTone,
        rowLineVisual,
        tableBorderWeight: tableBorderWeightProp,
        tableBorderTone,
        tableCorners,
        columnWidthStrategy,
        columnStretchColumnIndex:
          columnWidthStrategy === "stretchRemainder"
            ? DEMO_STRETCH_COLUMN_INDEX
            : undefined,
        columnStretchPercent:
          columnWidthStrategy === "stretchRemainder" ? 45 : undefined,
      }),
    [
      prismColor,
      rowLineWeight,
      rowLineTone,
      columnLineWeight,
      columnLineTone,
      rowShadingProp,
      rowShadeStrength,
      headerRowSurface,
      headerRowLabelTone,
      bodyTextTone,
      rowLineVisual,
      tableBorderWeightProp,
      tableBorderTone,
      tableCorners,
      columnWidthStrategy,
    ]
  );

  return (
    <div className="relative isolate space-y-10">
      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Customize
        </PrismTypography>
        <form
          className="flex flex-col gap-8"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="min-w-0 space-y-3">
            <PrismTypography
              role="overline"
              size="medium"
              className="block tracking-[0.14em] text-neutral-950 dark:text-neutral-50"
            >
              Color
            </PrismTypography>
            <div className="grid w-full min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:items-start">
              <fieldset className="min-w-0 space-y-2">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Swatch
                  </PrismTypography>
                </legend>
                <PrismColorPicker
                  color={prismColor}
                  onColorChange={setPrismColor}
                />
              </fieldset>

              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Body text
                  </PrismTypography>
                </legend>
                {BODY_TEXT_TONE_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-body-text-tone"
                      value={value}
                      checked={bodyTextTone === value}
                      onChange={() => setBodyTextTone(value)}
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        bodyTextTone === value
                          ? undefined
                          : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <PrismTypography
              role="overline"
              size="medium"
              className="block tracking-[0.14em] text-neutral-950 dark:text-neutral-50"
            >
              Header
            </PrismTypography>
            <div className="grid w-full min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:items-start">
              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Row color
                  </PrismTypography>
                </legend>
                {HEADER_ROW_SURFACE_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-header-surface"
                      value={value}
                      checked={headerRowSurface === value}
                      onChange={() => setHeaderRowSurface(value)}
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        headerRowSurface === value
                          ? undefined
                          : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>

              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Label color
                  </PrismTypography>
                </legend>
                {HEADER_LABEL_TONE_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-header-label-tone"
                      value={value}
                      checked={headerRowLabelTone === value}
                      onChange={() => setHeaderRowLabelTone(value)}
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        headerRowLabelTone === value
                          ? undefined
                          : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <PrismTypography
              role="overline"
              size="medium"
              className="block tracking-[0.14em] text-neutral-950 dark:text-neutral-50"
            >
              Rows
            </PrismTypography>
            <div className="grid w-full min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:items-start">
              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Line weight
                  </PrismTypography>
                </legend>
                {AXIS_LINE_WEIGHT_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-row-line-weight"
                      value={value}
                      checked={rowLineWeight === value}
                      onChange={() => setRowLineWeight(value)}
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        rowLineWeight === value
                          ? undefined
                          : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>

              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Line tone
                  </PrismTypography>
                </legend>
                {PLAYGROUND_LINE_TONES.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-row-line-tone"
                      value={value}
                      checked={rowLineTone === value}
                      onChange={() => setRowLineTone(value)}
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        rowLineTone === value
                          ? undefined
                          : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>

              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Line look
                  </PrismTypography>
                </legend>
                {LINE_VISUAL_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-row-line-visual"
                      value={value}
                      checked={rowLineVisual === value}
                      onChange={() => setRowLineVisual(value)}
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        rowLineVisual === value
                          ? undefined
                          : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>

              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Zebra
                  </PrismTypography>
                </legend>
                {ZEBRA_AXIS_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-row-zebra"
                      value={value}
                      checked={rowShading === value}
                      onChange={() => setRowShading(value)}
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        rowShading === value
                          ? undefined
                          : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>

              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Zebra strength
                  </PrismTypography>
                </legend>
                {ZEBRA_STRENGTH_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className={
                      shadeStrengthDisabled
                        ? "flex items-center gap-2 cursor-not-allowed"
                        : "flex cursor-pointer items-center gap-2"
                    }
                  >
                    <input
                      type="radio"
                      name="prism-table-zebra-strength"
                      value={value}
                      checked={rowShadeStrength === value}
                      onChange={() => setRowShadeStrength(value)}
                      disabled={shadeStrengthDisabled}
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        shadeStrengthDisabled
                          ? { semanticText: "muted" }
                          : rowShadeStrength === value
                            ? undefined
                            : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <PrismTypography
              role="overline"
              size="medium"
              className="block tracking-[0.14em] text-neutral-950 dark:text-neutral-50"
            >
              Columns
            </PrismTypography>
            <div className="grid w-full min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:items-start">
              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Line weight
                  </PrismTypography>
                </legend>
                {AXIS_LINE_WEIGHT_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-column-line-weight"
                      value={value}
                      checked={columnLineWeight === value}
                      onChange={() =>
                        setColumnLineWeight(value as PrismTableColumnLineWeight)
                      }
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        columnLineWeight === value
                          ? undefined
                          : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>

              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Line tone
                  </PrismTypography>
                </legend>
                {PLAYGROUND_LINE_TONES.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-column-line-tone"
                      value={value}
                      checked={columnLineTone === value}
                      onChange={() => setColumnLineTone(value)}
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        columnLineTone === value
                          ? undefined
                          : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>

              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Width strategy
                  </PrismTypography>
                </legend>
                {COLUMN_WIDTH_STRATEGY_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-column-width-strategy"
                      value={value}
                      checked={columnWidthStrategy === value}
                      onChange={() => setColumnWidthStrategy(value)}
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        columnWidthStrategy === value
                          ? undefined
                          : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
                {columnWidthStrategy === "stretchRemainder" ? (
                  <PrismTypography
                    role="body"
                    size="small"
                    color={{ semanticText: "muted" }}
                    className="pt-1"
                  >
                    Demo: column index {DEMO_STRETCH_COLUMN_INDEX} at 45% width.
                  </PrismTypography>
                ) : null}
              </fieldset>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <PrismTypography
              role="overline"
              size="medium"
              className="block tracking-[0.14em] text-neutral-950 dark:text-neutral-50"
            >
              Table border
            </PrismTypography>
            <div className="grid w-full min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:items-start">
              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Line weight
                  </PrismTypography>
                </legend>
                {AXIS_LINE_WEIGHT_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-outer-line-weight"
                      value={value}
                      checked={tableBorderWeight === value}
                      onChange={() =>
                        setTableBorderWeight(value as PrismTableOuterLineWeight)
                      }
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        tableBorderWeight === value
                          ? undefined
                          : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>

              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Line tone
                  </PrismTypography>
                </legend>
                {PLAYGROUND_LINE_TONES.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-outer-line-tone"
                      value={value}
                      checked={tableBorderTone === value}
                      onChange={() => setTableBorderTone(value)}
                      disabled={tableBorderWeight === "none"}
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        tableBorderWeight === "none"
                          ? { semanticText: "muted" }
                          : tableBorderTone === value
                            ? undefined
                            : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>

              <fieldset className="min-w-0 space-y-1.5">
                <legend className="mb-2">
                  <PrismTypography role="overline" size="small">
                    Corners
                  </PrismTypography>
                </legend>
                {TABLE_CORNER_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="prism-table-outer-corners"
                      value={value}
                      checked={tableCorners === value}
                      onChange={() => setTableCorners(value)}
                      className="border-input"
                    />
                    <PrismTypography
                      role="label"
                      size="medium"
                      font="mono"
                      color={
                        tableCorners === value
                          ? undefined
                          : { semanticText: "muted" }
                      }
                      className="wrap-break-word"
                    >
                      {label}
                    </PrismTypography>
                  </label>
                ))}
              </fieldset>
            </div>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Example
        </PrismTypography>
        <div className="min-w-0 overflow-x-auto py-1">
          <PrismTable
            prismColor={prismColor}
            headerRowSurface={headerRowSurface}
            headerRowLabelTone={headerRowLabelTone}
            rowLineWeight={rowLineWeight}
            rowLineTone={rowLineTone}
            rowLineVisual={rowLineVisual}
            bodyTextTone={bodyTextTone}
            columnLineWeight={columnLineWeight}
            columnLineTone={columnLineTone}
            columnWidthStrategy={columnWidthStrategy}
            columnStretchColumnIndex={
              columnWidthStrategy === "stretchRemainder"
                ? DEMO_STRETCH_COLUMN_INDEX
                : undefined
            }
            columnStretchPercent={
              columnWidthStrategy === "stretchRemainder" ? 45 : undefined
            }
            tableBorderWeight={tableBorderWeightProp}
            tableBorderTone={tableBorderTone}
            tableCorners={tableCorners}
            rowShading={rowShadingProp}
            rowShadeStrength={rowShadeStrength}
            sortedColumnId={sortedColumnId}
            sortedOrder={sortedOrder}
            onSortedOrderChange={(columnId, nextOrder) => {
              setSortedColumnId(columnId);
              setSortedOrder(nextOrder);
            }}
          >
            <PrismTableHeader>
              <PrismTableRow>
                <PrismTableHead
                  columnId="item"
                  sortable
                  initialSortOrder="ascending"
                  sortComparison="alphabetical"
                >
                  Swatch
                </PrismTableHead>
                <PrismTableHead
                  columnId="category"
                  sortable
                  initialSortOrder="ascending"
                  sortComparison="alphabetical"
                >
                  Layer
                </PrismTableHead>
                <PrismTableHead
                  columnId="qty"
                  sortable
                  initialSortOrder="descending"
                  sortComparison="numeric"
                  numeric
                >
                  Shade
                </PrismTableHead>
              </PrismTableRow>
            </PrismTableHeader>
            <PrismTableBody>
              {sortedRows.map((row) => (
                <PrismTableRow key={row.id}>
                  <PrismTableCell>
                    <PrismTypography role="body" size="small">
                      {row.item}
                    </PrismTypography>
                  </PrismTableCell>
                  <PrismTableCell>
                    <PrismTypography role="body" size="small">
                      {row.category}
                    </PrismTypography>
                  </PrismTableCell>
                  <PrismTableCell numeric>
                    <PrismTypography role="body" size="small" font="mono">
                      {row.qty}
                    </PrismTypography>
                  </PrismTableCell>
                </PrismTableRow>
              ))}
            </PrismTableBody>
          </PrismTable>
        </div>
      </section>

      <section className="space-y-4">
        <PrismTypography role="title" size="large" font="sans" as="h2">
          Code sample
        </PrismTypography>
        <PrismCodeBlock
          className="font-mono"
          mode="card"
          disableLineNumbers={false}
          disableLanguageLabel={false}
          color={CODE_SAMPLE_PRISM_COLOR}
          language="tsx"
        >
          {generatedSnippet}
        </PrismCodeBlock>
      </section>
    </div>
  );
}
