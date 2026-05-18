import { icons, type LucideIcon } from "lucide-react";

/** Lucide React export keys are PascalCase (`Gem`, `LayoutGrid`). */
function toPascalCase(iconName: string): string {
  return iconName
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

/**
 * Resolve a Lucide icon component from its native id (kebab-case or PascalCase, e.g. `gem`, `layout-grid`, `Gem`).
 */
export function resolveLucideIconByName(iconName: string): LucideIcon | null {
  const trimmed = iconName.trim();
  if (!trimmed) return null;
  const pascal = toPascalCase(trimmed);
  if (!pascal) return null;
  const icon = icons[pascal as keyof typeof icons];
  return icon ?? null;
}

function lucideIdCandidates(iconName: string): string[] {
  const trimmed = iconName.trim();
  if (!trimmed) return [];
  const kebab = trimmed.replace(/_/g, "-");
  return kebab === trimmed ? [trimmed] : [trimmed, kebab];
}

/** Native Lucide id (kebab-case when possible) for a picker ligature or typed name. */
export function resolveLucideIdByName(iconName: string): string | null {
  for (const candidate of lucideIdCandidates(iconName)) {
    if (resolveLucideIconByName(candidate)) return candidate;
  }
  return null;
}

/** Material ligature names that resolve to a Lucide icon (for picker filter / grid). */
export function filterMaterialNamesWithLucideMatch(
  names: readonly string[]
): string[] {
  return names.filter((name) => resolveLucideIdByName(name) != null);
}
