/**
 * Browser / document title helpers for Prism-hosted apps.
 * Pure string builders only — callers supply `appName` (e.g. from application settings).
 */

/** Default trailing app label when settings omit a display name. */
export const DEFAULT_BROWSER_APP_NAME = "TimeTraveler";

function joinTitle(parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length > 0)
    .join(" • ");
}

/**
 * Tab / window titles: `page • app`, journey rows, admin shell, etc.
 */
export const PrismPageTitle = {
  /** e.g. `Settings • MyApp` */
  app(pageTitle?: string | null, appName: string = DEFAULT_BROWSER_APP_NAME): string {
    return joinTitle([pageTitle, appName]);
  },

  /** e.g. `🚂 Northern Line • MyApp` */
  journey(
    journey: Pick<{ name: string; emoji?: string | null }, "name" | "emoji">,
    appName: string = DEFAULT_BROWSER_APP_NAME
  ): string {
    const emoji = journey.emoji?.trim();
    const route = emoji ? `${emoji} ${journey.name}` : journey.name;
    return joinTitle([route, appName]);
  },

  /** Aggregate journey index */
  allJourneys(appName: string = DEFAULT_BROWSER_APP_NAME): string {
    return joinTitle(["All journeys", appName]);
  },

  /** e.g. `💎 PrismEmoji • Admin • MyApp` */
  admin(pageTitle: string | null | undefined, appName: string): string {
    const trimmed = pageTitle?.trim();
    const core = joinTitle([
      trimmed && trimmed.length > 0 ? trimmed : null,
      "Admin",
      appName,
    ]);
    return `💎 ${core}`;
  },
} as const;
