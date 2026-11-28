import path from "node:path";
import { fileURLToPath } from "node:url";
import appConfigJson from "../../config.app.json";
import prismConfigJson from "../../config.prism.json";
import { loadDevDeploymentFromDirectory } from "application-settings/load-prism-config-sync";
import {
  prismConfigBaseSchema,
  resolveAuthenticationGateMode,
  resolveSignInPathDropOff,
} from "application-settings/prism-config-schema";
import { appConfigSchema, type AppConfig } from "./schema";

export const appConfig: AppConfig = appConfigSchema.parse(appConfigJson);

export const prismConfig = prismConfigBaseSchema.parse(prismConfigJson);

/** Prism-standard app chrome (from config.prism.json → app). */
export const prismApp = prismConfig.app;

const appRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

export const devDeployment = loadDevDeploymentFromDirectory(appRoot);

export const DEV_PORT = devDeployment.port;
export const DEV_HOST = devDeployment.host;
export const DEV_APP_URL = devDeployment.url;
export const DEV_APP_ORIGINS = devDeployment.origins;

export const SIGN_IN_PATH_DROP_OFF = resolveSignInPathDropOff(prismConfig);

export const AUTH_GATE_MODE = resolveAuthenticationGateMode(prismConfig);
