import { z } from "zod";
import {
  prismAppConfigSchema,
  type PrismAppConfig,
} from "./prism-config-schema";

/** @deprecated Use prismAppConfigSchema — chrome lives under config.prism.json → app */
export const applicationAppConfigBaseSchema = prismAppConfigSchema;

export type ApplicationAppConfigBase = PrismAppConfig;

/** @deprecated Use prismAppConfigSchema */
export const applicationSettingsSchema = prismAppConfigSchema;

export type ApplicationSettings = PrismAppConfig;
