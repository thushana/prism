/**
 * Read-only metadata chips (outline / secondary). Prefer these over a separate badge component;
 * use `PrismButton` for actions.
 */
export const PRISM_META_CHIP_OUTLINE_CLASS =
  "inline-flex max-w-full shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-xs font-medium text-foreground";

export const PRISM_META_CHIP_SECONDARY_CLASS =
  "inline-flex max-w-full shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-transparent bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground";

/** Use on the chip when it sits inside `<a>` (system sheet links, etc.). */
export const PRISM_META_CHIP_INTERACTIVE_CLASS =
  "cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground";
