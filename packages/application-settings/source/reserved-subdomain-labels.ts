import type { PrismAppConfig } from "./prism-config-schema";

/**
 * Labels that must never become a consumer app hostname left-of-dot segment.
 * Keep in sync with City Observatory / Prism docs “Reserved subdomain labels”.
 */
export const PRISM_RESERVED_SUBDOMAIN_LABELS = [
  "www",
  "app",
  "api",
  "admin",
  "mail",
  "smtp",
  "ftp",
  "cdn",
  "static",
  "assets",
  "status",
  "docs",
  "support",
  "help",
  "auth",
  "login",
  "signin",
  "account",
  "accounts",
  "localhost",
] as const;

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Effective denylist = Prism defaults ∪ `app.reservedSubdomainLabels` ∪ `app.nameIdentifier`.
 */
export function resolveReservedSubdomainLabels(
  app: Pick<PrismAppConfig, "nameIdentifier" | "reservedSubdomainLabels">
): ReadonlySet<string> {
  const labels = new Set<string>(PRISM_RESERVED_SUBDOMAIN_LABELS);

  for (const label of app.reservedSubdomainLabels ?? []) {
    const normalized = normalizeLabel(label);
    if (normalized.length > 0) {
      labels.add(normalized);
    }
  }

  const nameIdentifier = app.nameIdentifier?.trim();
  if (nameIdentifier) {
    labels.add(normalizeLabel(nameIdentifier));
  }

  return labels;
}
