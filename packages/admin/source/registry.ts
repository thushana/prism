import type { ComponentType } from "react";
import { PrismButtonDemo } from "./prism-button";
import { PrismCardDemo } from "./prism-card";
import { PrismCodeBlockDemo } from "./prism-code-block";
import { PrismColorDemo } from "./prism-color";
import { PrismColorPickerDemo } from "./prism-color-picker";
import { PrismDividerDemo } from "./prism-divider";
import { PrismEmojiDemo } from "./prism-emoji";
import { PrismIconDemo } from "./prism-icon";
import { PrismLayoutDemo } from "./prism-layout";
import { PrismMapDemo } from "./prism-map";
import { PrismPathBarDemo } from "./prism-path-bar";
import { PrismSelectDemo } from "./prism-select";
import { PrismTableDemo } from "./prism-table";
import { PrismTypographyDemo } from "./prism-typography";

export type PrismAdminComponentSlug =
  | "prism-button"
  | "prism-card"
  | "prism-code-block"
  | "prism-color"
  | "prism-color-picker"
  | "prism-divider"
  | "prism-emoji"
  | "prism-icon"
  | "prism-layout"
  | "prism-map"
  | "prism-path-bar"
  | "prism-select"
  | "prism-table"
  | "prism-typography";

/** Demos are static; the dynamic route renders them with no props. */
export type PrismAdminDemoComponent = ComponentType;

export type PrismAdminRegistryEntry = {
  title: string;
  description: string;
  Demo: PrismAdminDemoComponent;
};

export const PRISM_ADMIN_COMPONENT_REGISTRY = {
  "prism-button": {
    title: "PrismButton",
    description: "Buttons: presets, controls, variant grid.",
    Demo: PrismButtonDemo,
  },
  "prism-card": {
    title: "PrismCard",
    description: "Cards: composition and footer actions.",
    Demo: PrismCardDemo,
  },
  "prism-code-block": {
    title: "PrismCodeBlock",
    description:
      "Read-only string → Prism panel: optional highlight, line numbers, palette, copy.",
    Demo: PrismCodeBlockDemo,
  },
  "prism-color": {
    title: "PrismColor",
    description:
      "One picker commits the full color spec; live JSON, ColorLoop chips, gradient previews, PrismCodeBlock.",
    Demo: PrismColorDemo,
  },
  "prism-color-picker": {
    title: "PrismColorPicker",
    description: "Dropdown palette and color picker for PrismColor.",
    Demo: PrismColorPickerDemo,
  },
  "prism-divider": {
    title: "PrismDivider",
    description:
      "Divider: line weight, tone, gradient, rounded bar, emblem controls.",
    Demo: PrismDividerDemo,
  },
  "prism-emoji": {
    title: "PrismEmoji",
    description:
      "Emoji: native or Google Noto (color WebP / animated GIF) from CDN; PrismSize and inline inherit.",
    Demo: PrismEmojiDemo,
  },
  "prism-icon": {
    title: "PrismIcon",
    description: "Icons: sizing, weights, filled state.",
    Demo: PrismIconDemo,
  },
  "prism-layout": {
    title: "PrismLayout",
    description: "Layout: column widths and edge-to-edge bands.",
    Demo: PrismLayoutDemo,
  },
  "prism-map": {
    title: "PrismMap",
    description:
      "Dual-vendor map (Google + Mapbox) with encoded-polyline routes.",
    Demo: PrismMapDemo,
  },
  "prism-path-bar": {
    title: "PrismPathBar",
    description: "Breadcrumbs: mapped path or fixed segments.",
    Demo: PrismPathBarDemo,
  },
  "prism-select": {
    title: "PrismSelect",
    description:
      "Select: PrismButton trigger + popover options (not the OS select).",
    Demo: PrismSelectDemo,
  },
  "prism-table": {
    title: "PrismTable",
    description:
      "Composable table: Prism-tinted grid lines, zebra shading, sortable headers.",
    Demo: PrismTableDemo,
  },
  "prism-typography": {
    title: "PrismTypography",
    description: "Typography: rhythm, weights, motion.",
    Demo: PrismTypographyDemo,
  },
} satisfies Record<PrismAdminComponentSlug, PrismAdminRegistryEntry>;

export type PrismAdminHubLink = {
  title: string;
  href: string;
  description: string;
};

export function getPrismAdminComponentHubLinks(): PrismAdminHubLink[] {
  return (
    Object.entries(PRISM_ADMIN_COMPONENT_REGISTRY) as [
      PrismAdminComponentSlug,
      PrismAdminRegistryEntry,
    ][]
  )
    .map(([slug, meta]) => ({
      title: meta.title,
      href: `/admin/prism/components/${slug}`,
      description: meta.description,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getPrismAdminRegistryEntry(
  slug: string
): PrismAdminRegistryEntry | undefined {
  return PRISM_ADMIN_COMPONENT_REGISTRY[slug as PrismAdminComponentSlug];
}
