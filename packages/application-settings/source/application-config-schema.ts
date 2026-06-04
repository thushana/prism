import { z } from "zod";
import {
  APP_CONFIG_FILE_NAME,
  LEGACY_APP_CONFIG_FILE_NAME,
} from "./config-file-names";

export { APP_CONFIG_FILE_NAME, LEGACY_APP_CONFIG_FILE_NAME };

/** @deprecated Use APP_CONFIG_FILE_NAME */
export const APPLICATION_CONFIG_FILE_NAME = APP_CONFIG_FILE_NAME;

export {
  applicationAppConfigBaseSchema,
  type ApplicationAppConfigBase,
} from "./application-settings-schema";

/** Generic read helper — host apps validate full shape in `library/config/schema.ts`. */
export const applicationConfigBaseSchema = z.object({});

export type ApplicationConfigBase = z.infer<typeof applicationConfigBaseSchema>;
