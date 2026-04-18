/**
 * App-specific PrismButton presets. Register once at app load (see layout.tsx import).
 * Default presets (e.g. pillGradient, pillMonochrome, boxButtons) live in @prism/ui.
 */
import { registerPrismButtonPresets } from "ui";

registerPrismButtonPresets({
  // Example: override or add app-specific presets.
  // "cta-primary": { color: "blue", colorVariant: "background-dark", size: "large" },
  // "nav-action": { lineNo: true, colorVariant: "background-no", font: "serif" },
});
