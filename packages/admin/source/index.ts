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

export { PrismBadgeDemo } from "./prism-badge";
export { PrismButtonDemo } from "./prism-button";
export { PrismCardDemo } from "./prism-card";
export { PrismCodeBlockDemo } from "./prism-code-block";
export { PrismColorPickerDemo } from "./prism-color-picker";
export { PrismDividerDemo } from "./prism-divider";
export { PrismIconDemo } from "./prism-icon";
export { PrismLayoutDemo } from "./prism-layout";
export { PrismPathBarDemo } from "./prism-path-bar";
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
