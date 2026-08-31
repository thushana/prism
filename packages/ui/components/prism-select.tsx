"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import clsx from "clsx";
import { PrismButton, type PrismButtonProps } from "./prism-button";
import { PrismTypography } from "./prism-typography";
import type { PartialPrismColorSpec } from "../styles/prism-color";
import type { PrismSize } from "../source/prism-size";
import type { PrismSpacing } from "../source/prism-spacing";

export type PrismSelectOption = {
  value: string;
  label: string;
};

type PrismSelectChromeProps = {
  /**
   * Overline label above the trigger (e.g. Neighborhood / Status).
   * Omit or set `showTitle={false}` for a control-only select.
   */
  title?: string;
  options: readonly PrismSelectOption[];
  /** Prism color for trigger and option chrome (same model as {@link PrismButton}). */
  color: PartialPrismColorSpec;
  disabled?: boolean;
  className?: string;
  showTitle?: boolean;
  id?: string;
  size?: PrismSize;
  spacing?: PrismSpacing;
  shape?: PrismButtonProps["shape"];
  line?: PrismButtonProps["line"];
  paint?: PrismButtonProps["paint"];
  font?: PrismButtonProps["font"];
  textCase?: PrismButtonProps["textCase"];
  gap?: PrismButtonProps["gap"];
  iconPosition?: PrismButtonProps["iconPosition"];
  /** Material glyph on the trigger (default `expand_more`). */
  materialSymbol?: string;
  disableMotion?: boolean;
  disableGrow?: boolean;
  disableColorChange?: boolean;
  disableIconMotion?: boolean;
  inverted?: boolean;
};

export type PrismSelectSingleProps = PrismSelectChromeProps & {
  multiple?: false;
  value: string;
  onValueChange: (value: string) => void;
};

export type PrismSelectMultipleProps = PrismSelectChromeProps & {
  multiple: true;
  value: readonly string[];
  onValueChange: (value: string[]) => void;
};

export type PrismSelectProps =
  PrismSelectSingleProps | PrismSelectMultipleProps;

const DEFAULT_TRIGGER_CHROME = {
  paint: "backgroundNone",
  shape: "rectangleRounded",
  variant: "icon",
  line: "full",
  size: "regular",
  spacing: "compact",
  disableGrow: true,
  iconPosition: "left",
  materialSymbol: "expand_more",
} as const satisfies Partial<PrismButtonProps> & { materialSymbol: string };

function triggerLabelForSelection(
  options: readonly PrismSelectOption[],
  selectedValues: readonly string[],
  multiple: boolean
): string {
  if (!multiple) {
    return (
      options.find((option) => option.value === selectedValues[0])?.label ??
      "Select"
    );
  }
  if (selectedValues.length === 0) {
    return "All";
  }
  if (selectedValues.length === options.length && options.length > 0) {
    return "All";
  }
  if (selectedValues.length === 1) {
    return (
      options.find((option) => option.value === selectedValues[0])?.label ??
      "1 selected"
    );
  }
  return `${selectedValues.length} selected`;
}

/**
 * Select control that matches {@link PrismButton} chrome: outlined trigger +
 * custom popover option list (not the OS `<select>`).
 *
 * Set `multiple` for checkbox-style multi-select (popover stays open; empty
 * selection means “All” for the trigger label).
 */
export function PrismSelect(props: PrismSelectProps) {
  const {
    title,
    options,
    color,
    disabled = false,
    className,
    showTitle = true,
    id,
    size = DEFAULT_TRIGGER_CHROME.size,
    spacing = DEFAULT_TRIGGER_CHROME.spacing,
    shape = DEFAULT_TRIGGER_CHROME.shape,
    line = DEFAULT_TRIGGER_CHROME.line,
    paint = DEFAULT_TRIGGER_CHROME.paint,
    font,
    textCase,
    gap,
    iconPosition = DEFAULT_TRIGGER_CHROME.iconPosition,
    materialSymbol = DEFAULT_TRIGGER_CHROME.materialSymbol,
    disableMotion,
    disableGrow = DEFAULT_TRIGGER_CHROME.disableGrow,
    disableColorChange,
    disableIconMotion,
    inverted,
  } = props;
  const multiple = props.multiple === true;
  const selectedValues = multiple
    ? props.value
    : props.value === undefined
      ? []
      : [props.value];

  const [open, setOpen] = React.useState(false);
  const listId = React.useId();
  const triggerId = id ?? listId;
  const triggerLabel = triggerLabelForSelection(
    options,
    selectedValues,
    multiple
  );
  const accessibleName = title ?? triggerLabel;
  const renderTitle = Boolean(showTitle && title);

  const triggerChrome = {
    color,
    paint,
    shape,
    variant: DEFAULT_TRIGGER_CHROME.variant,
    line,
    size,
    spacing,
    font,
    textCase,
    gap,
    disableMotion,
    disableGrow,
    disableColorChange,
    disableIconMotion,
    inverted,
  } as const;

  function toggleMultiValue(nextValue: string) {
    if (!multiple) return;
    const selected = new Set(props.value);
    if (selected.has(nextValue)) {
      selected.delete(nextValue);
    } else {
      selected.add(nextValue);
    }
    // Preserve option order in the emitted array.
    props.onValueChange(
      options
        .map((option) => option.value)
        .filter((value) => selected.has(value))
    );
  }

  return (
    <div className={clsx("flex flex-col gap-1", className)}>
      {renderTitle ? (
        <PrismTypography
          role="overline"
          size="regular"
          color={{ semanticText: "monochrome" }}
          as="span"
        >
          {title}
        </PrismTypography>
      ) : null}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <PrismButton
            {...triggerChrome}
            id={triggerId}
            type="button"
            label={triggerLabel}
            materialSymbol={materialSymbol}
            iconPosition={iconPosition}
            toggled={open}
            disabled={disabled}
            className="w-full !justify-start"
            aria-label={accessibleName}
            aria-expanded={open}
            aria-controls={listId}
            aria-haspopup="listbox"
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            id={listId}
            role="listbox"
            aria-multiselectable={multiple || undefined}
            aria-labelledby={triggerId}
            side="bottom"
            align="start"
            sideOffset={8}
            collisionPadding={12}
            className="z-50 flex max-h-[min(20rem,70vh)] min-w-[var(--radix-popover-trigger-width)] flex-col items-stretch gap-1 overflow-y-auto rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none"
          >
            {options.map((option) => {
              const active = selectedValues.includes(option.value);
              return (
                <PrismButton
                  key={option.value === "" ? "__empty" : option.value}
                  {...triggerChrome}
                  paint="backgroundNone"
                  line="none"
                  type="button"
                  role="option"
                  aria-selected={active}
                  label={option.label}
                  toggled={active}
                  className="w-full !justify-start"
                  onClick={() => {
                    if (multiple) {
                      toggleMultiValue(option.value);
                      return;
                    }
                    props.onValueChange(option.value);
                    setOpen(false);
                  }}
                />
              );
            })}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
