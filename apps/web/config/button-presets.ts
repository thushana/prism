/**
 * App-specific PrismButton presets. Register once at app load (see layout.tsx import).
 * Default presets (e.g. gradientIcon, boxButtons) live in @prism/ui.
 */
import { registerPrismButtonPresets } from "ui";

registerPrismButtonPresets({
  // Example: override or add app-specific presets.
  // "cta-primary": { color: "blue", colorVariant: "background-dark", size: "large" },
  // "nav-action": { shapeLineNo: true, colorVariant: "background-no", font: "serif" },
});
