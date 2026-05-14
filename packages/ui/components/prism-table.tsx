"use client";

import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@utilities";
import {
  normalizePrismColorSpec,
  type PartialPrismColorSpec,
} from "../styles/prism-color";
import type {
  PrismDividerLineWeight,
  PrismDividerTone,
} from "./prism-divider";
import { PrismTypography } from "./prism-typography";

/** Divider-aligned neutrals plus `swatch` (main Prism hue via `--prism-table-line` on the table root). */
export type PrismTableLineTone = PrismDividerTone | "swatch";

/** `full` uses the palette 50 tint; `soft` mixes that tint into the page background for a lighter wash. */
export type PrismTableRowShadeStrength = "full" | "soft";

const prismTableRowBorderVariants = cva("", {
  variants: {
    lineWeight: {
      hairline: "border-b",
      thin: "border-b-2",
      medium: "border-b-[3px]",
      thick: "border-b-4",
    },
    lineTone: {
      default: "border-foreground/18",
      muted: "border-muted-foreground/45",
      primary: "border-primary",
      swatch: "[border-bottom-color:var(--prism-table-line)]",
    },
  },
  defaultVariants: {
    lineWeight: "hairline",
    lineTone: "default",
  },
});

const prismTableColumnBorderVariants = cva("", {
  variants: {
    lineWeight: {
      hairline: "border-r",
      thin: "border-r-2",
      medium: "border-r-[3px]",
      thick: "border-r-4",
    },
    lineTone: {
      default: "border-foreground/18",
      muted: "border-muted-foreground/45",
      primary: "border-primary",
      swatch: "[border-right-color:var(--prism-table-line)]",
    },
  },
  defaultVariants: {
    lineWeight: "hairline",
    lineTone: "default",
  },
});

export type PrismTableSortOrder = "ascending" | "descending";
export type PrismTableSortComparison = "alphabetical" | "numeric";

type RegisteredHead = {
  sortable: boolean;
  initialSortOrder?: PrismTableSortOrder;
  sortComparison: PrismTableSortComparison;
};

type PrismTableContextValue = {
  prismColor: PartialPrismColorSpec;
  rowLineWeight?: PrismDividerLineWeight;
  rowLineTone?: PrismTableLineTone;
  columnLineWeight?: PrismDividerLineWeight;
  columnLineTone?: PrismTableLineTone;
  rowShading?: "even" | "odd";
  rowShadeBackgroundCss: string | undefined;
  rowBorderClassName: string;
  columnBorderClassName: string;
  sortedColumnId: string | null;
  sortedOrder: PrismTableSortOrder | null;
  isControlled: boolean;
  registerHead: (columnId: string, meta: RegisteredHead) => void;
  unregisterHead: (columnId: string) => void;
  onHeaderSortClick: (columnId: string) => void;
};

const PrismTableContext = React.createContext<PrismTableContextValue | null>(
  null
);

function usePrismTableContext(component: string): PrismTableContextValue {
  const context = React.useContext(PrismTableContext);
  if (!context) {
    throw new Error(`${component} must be used within PrismTable`);
  }
  return context;
}

function resolveSwatchLineCss(
  prismColor: PartialPrismColorSpec
): string | undefined {
  try {
    const normalized = normalizePrismColorSpec(prismColor);
    const family = normalized.swatchPrimary;
    if (!family) return undefined;
    const palette = normalized.palette;
    const base =
      palette === "default"
        ? `var(--color-${family}-400)`
        : `var(--color-${palette}-${family}-400)`;
    return `color-mix(in srgb, ${base} 72%, transparent)`;
  } catch {
    return undefined;
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
    const tint =
      palette === "default"
        ? `var(--color-${family}-50)`
        : `var(--color-${palette}-${family}-50)`;
    if (strength === "soft") {
      return `color-mix(in srgb, ${tint} 14%, var(--background))`;
    }
    return tint;
  } catch {
    return undefined;
  }
}

export type PrismTableRootProps = React.ComponentProps<"div"> & {
  prismColor: PartialPrismColorSpec;
  rowLineWeight?: PrismDividerLineWeight;
  rowLineTone?: PrismTableLineTone;
  columnLineWeight?: PrismDividerLineWeight;
  columnLineTone?: PrismTableLineTone;
  rowShading?: "even" | "odd";
  /** Zebra fill strength when `rowShading` is set. Default `full`. */
  rowShadeStrength?: PrismTableRowShadeStrength;
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

  const registrationsRef = React.useRef<Map<string, RegisteredHead>>(
    new Map()
  );
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
        nextOrder =
          sortedOrder === "ascending" ? "descending" : "ascending";
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

  const swatchLineCss =
    rowLineTone === "swatch" || columnLineTone === "swatch"
      ? (resolveSwatchLineCss(prismColor) ?? "color-mix(in srgb, var(--primary) 55%, transparent)")
      : undefined;

  const rowShadeBackgroundCss =
    rowShading !== undefined
      ? (resolveRowShadeBackgroundCss(prismColor, rowShadeStrength) ??
        "var(--muted)")
      : undefined;

  const rowBorderClassName = prismTableRowBorderVariants({
    lineWeight: rowLineWeight,
    lineTone: rowLineTone,
  });
  const columnBorderClassName = prismTableColumnBorderVariants({
    lineWeight: columnLineWeight,
    lineTone: columnLineTone,
  });

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
      columnBorderClassName,
      sortedColumnId,
      sortedOrder,
      isControlled,
      registerHead,
      unregisterHead,
      onHeaderSortClick,
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
      columnBorderClassName,
      sortedColumnId,
      sortedOrder,
      isControlled,
      registerHead,
      unregisterHead,
      onHeaderSortClick,
    ]
  );

  const rootStyle = React.useMemo((): React.CSSProperties => {
    const merged: React.CSSProperties = { ...(style ?? {}) };
    if (swatchLineCss) {
      Object.assign(merged, {
        "--prism-table-line": swatchLineCss,
      } as React.CSSProperties);
    }
    return merged;
  }, [style, swatchLineCss]);

  return (
    <PrismTableContext.Provider value={contextValue}>
      <div
        data-slot="table-root"
        className={cn("relative w-full overflow-x-auto", className)}
        style={rootStyle}
        {...rest}
      >
        <table className="w-full caption-bottom text-sm [&_td:last-child]:border-r-0 [&_th:last-child]:border-r-0">
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
  ...props
}: PrismTableHeaderProps): React.JSX.Element {
  return (
    <thead data-slot="table-header" className={cn(className)} {...props} />
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

  const wrapped = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;
    const displayName =
      (child.type as { displayName?: string } | undefined)?.displayName ??
      (child.type as { name?: string }).name;
    if (displayName !== "PrismTableRow") {
      return child;
    }
    const shadeThisRow =
      rowShading === "even"
        ? index % 2 === 0
        : rowShading === "odd"
          ? index % 2 === 1
          : false;
    return React.cloneElement(child, {
      rowIndex: index,
      rowShadeActive: shadeThisRow,
      rowShadeBackgroundCss,
    } as Partial<React.ComponentProps<typeof PrismTableRow>>);
  });

  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-b-0", className)}
      {...props}
    >
      {wrapped}
    </tbody>
  );
}

export type PrismTableFooterProps = React.ComponentProps<"tfoot">;

function PrismTableFooter({
  className,
  ...props
}: PrismTableFooterProps): React.JSX.Element {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

export type PrismTableRowProps = React.ComponentProps<"tr"> & {
  rowIndex?: number;
  rowShadeActive?: boolean;
  rowShadeBackgroundCss?: string | undefined;
};

function PrismTableRow({
  className,
  style,
  rowIndex: rowIndexProp,
  rowShadeActive,
  rowShadeBackgroundCss,
  ...props
}: PrismTableRowProps): React.JSX.Element {
  const table = usePrismTableContext("PrismTableRow");
  const rowStyle: React.CSSProperties = { ...style };
  if (rowShadeActive && rowShadeBackgroundCss) {
    rowStyle.backgroundColor = rowShadeBackgroundCss;
  }

  return (
    <tr
      data-slot="table-row"
      data-row-index={rowIndexProp}
      className={cn(
        "border-b transition-colors",
        table.rowBorderClassName,
        className
      )}
      style={rowStyle}
      {...props}
    />
  );
}

PrismTableRow.displayName = "PrismTableRow";

/** Default: uppercase black label. `plain` uses body-weight text for tables that need quieter headers. */
export type PrismTableHeadTypography = "emphasized" | "plain";

export type PrismTableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  columnId: string;
  sortable?: boolean;
  initialSortOrder?: PrismTableSortOrder;
  sortComparison?: PrismTableSortComparison;
  headerTypography?: PrismTableHeadTypography;
};

function PrismTableHead({
  className,
  columnId,
  sortable = false,
  initialSortOrder,
  sortComparison = "alphabetical",
  headerTypography = "emphasized",
  children,
  scope = "col",
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

  const headerLabel =
    headerTypography === "plain" ? (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
        {children}
      </span>
    ) : (
      <PrismTypography
        role="label"
        size="medium"
        as="span"
        fontWeight="black"
        textTransform="uppercase"
        textWrap="nowrap"
        color={{ semanticText: "foreground" }}
        className="inline-flex items-center gap-1 tracking-wide"
      >
        {children}
      </PrismTypography>
    );

  if (!sortable) {
    return (
      <th
        data-slot="table-head"
        scope={scope}
        className={cn(
          "min-h-14 px-3 py-3 text-left align-middle [&:has([role=checkbox])]:pr-0",
          table.columnBorderClassName,
          className
        )}
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
      className={cn(
        "min-h-14 px-3 py-3 text-left align-middle [&:has([role=checkbox])]:pr-0",
        table.columnBorderClassName,
        className
      )}
      {...rest}
    >
      <button
        type="button"
        className={cn(
          "-mx-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-left hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

export type PrismTableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

function PrismTableCell({
  className,
  ...props
}: PrismTableCellProps): React.JSX.Element {
  const table = usePrismTableContext("PrismTableCell");
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-3 align-middle [&:has([role=checkbox])]:pr-0",
        table.columnBorderClassName,
        className
      )}
      {...props}
    />
  );
}

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
