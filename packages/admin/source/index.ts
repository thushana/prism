/**
 * Admin — system sheet page + Prism component demos for admin/sheets routes.
 */

export { SystemSheetPage } from "./system/page";
export type {
  SystemSheetData,
  SystemSheetConfig,
  SystemSheetGitRepoInfo,
  AppStatus,
} from "./system/types";
export { getRelativeTime, formatDateTimeWithRelative } from "./system/data";

export { PrismButtonDemo } from "./prism-button";
export { PrismCardDemo } from "./prism-card";
export { PrismCodeBlockDemo } from "./prism-code-block";
export { PrismColorDemo } from "./prism-color";
export { PrismColorPickerDemo } from "./prism-color-picker";
export { PrismDividerDemo } from "./prism-divider";
export { PrismEmojiDemo } from "./prism-emoji";
export { PrismIconDemo } from "./prism-icon";
export { PrismLayoutDemo } from "./prism-layout";
export { PrismMapDemo } from "./prism-map";
export { PrismPathBarDemo } from "./prism-path-bar";
export { PrismSelectDemo } from "./prism-select";
export { PrismTableDemo } from "./prism-table";
export { PrismTypographyDemo } from "./prism-typography";

export {
  PRISM_ADMIN_COMPONENT_REGISTRY,
  getPrismAdminComponentHubLinks,
  getPrismAdminRegistryEntry,
} from "./registry";
export type {
  PrismAdminComponentSlug,
  PrismAdminRegistryEntry,
  PrismAdminDemoComponent,
  PrismAdminHubLink,
} from "./registry";
