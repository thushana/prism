import { z } from "zod";

export {
  APP_CONFIG_FILE_NAME,
  LEGACY_APP_CONFIG_FILE_NAME,
  LEGACY_APP_JSON_FILE_NAME,
  LEGACY_PRISM_CONFIG_FILE_NAME,
  PRISM_CONFIG_FILE_NAME,
} from "./config-file-names";

/** Chrome every Prism app supplies under `config.prism.json` → `app`. */
export const prismAppConfigSchema = z.object({
  displayName: z.string().min(1),
  description: z.string(),
  icon: z.string().optional(),
});

export type PrismAppConfig = z.infer<typeof prismAppConfigSchema>;

/** Standard Prism platform config shape (all consumer apps). */
export const prismConfigBaseSchema = z.object({
  app: prismAppConfigSchema,
  deployments: z
    .object({
      dev: z
        .object({
          port: z.number().int().min(1).max(65535).optional(),
        })
        .optional(),
    })
    .optional(),
});

export type PrismConfigBase = z.infer<typeof prismConfigBaseSchema>;
