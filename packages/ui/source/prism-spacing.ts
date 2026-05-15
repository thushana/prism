/**
 * Shared vertical inset / inner-padding ladder for {@link PrismDivider} root padding
 * and {@link PrismButton} padding multipliers. Same five names everywhere.
 */
export type PrismSpacing =
  | "tight"
  | "compact"
  | "regular"
  | "comfortable"
  | "airy";

/** Multiplier applied to the button base padding recipe (see {@link PrismButton}). */
export const PRISM_BUTTON_SPACING_MULTIPLIER: Record<PrismSpacing, number> = {
  tight: 0.45,
  compact: 0.65,
  regular: 1,
  comfortable: 1.12,
  airy: 1.28,
};
