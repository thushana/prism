import { z } from "zod";

/**
 * App-level settings from the repository root `app.json` (Prism convention).
 * Used for display name, chrome copy, and optional icon token (e.g. Lucide name).
 */
export const applicationSettingsSchema = z.object({
  /** Shown in admin section labels and similar chrome (not the npm package name). */
  displayName: z.string().min(1),
  /** Short product / app description (e.g. admin home subtitle). */
  description: z.string(),
  /**
   * Optional icon token for shell UI (e.g. Lucide export name as string: `train-front`).
   * Consumers map this to a component when they render icons.
   */
  icon: z.string().optional(),
});

export type ApplicationSettings = z.infer<typeof applicationSettingsSchema>;
