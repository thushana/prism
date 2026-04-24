import type { ComponentType } from "react";
import { PrismBadgeDemo } from "./prism-badge";
import { PrismButtonDemo } from "./prism-button";
import { PrismCardDemo } from "./prism-card";
import { PrismCodeBlockDemo } from "./prism-code-block";
import { PrismColorDemo } from "./prism-color";
import { PrismColorPickerDemo } from "./prism-color-picker";
import { PrismDividerDemo } from "./prism-divider";
import { PrismIconDemo } from "./prism-icon";
import { PrismLayoutDemo } from "./prism-layout";
import { PrismPathBarDemo } from "./prism-path-bar";
import { PrismTypographyDemo } from "./prism-typography";

export type PrismAdminComponentSlug =
  | "prism-badge"
  | "prism-button"
  | "prism-card"
  | "prism-code-block"
  | "prism-color"
  | "prism-color-picker"
  | "prism-divider"
  | "prism-icon"
  | "prism-layout"
  | "prism-path-bar"
  | "prism-typography";

/** Demos are static; the dynamic route renders them with no props. */
export type PrismAdminDemoComponent = ComponentType;

export type PrismAdminRegistryEntry = {
  title: string;
  description: string;
  Demo: PrismAdminDemoComponent;
};

export const PRISM_ADMIN_COMPONENT_REGISTRY = {
  "prism-badge": {
    title: "PrismBadge",
    description: "Badges: variants and link slot.",
    Demo: PrismBadgeDemo,
  },
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
  "prism-path-bar": {
    title: "PrismPathBar",
    description: "Breadcrumbs: mapped path or fixed segments.",
    Demo: PrismPathBarDemo,
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
