import fs from "fs";
import path from "path";
import {
  isStaticBuild,
  prismConfigBaseSchema,
  resolveBuildOutput,
  type PrismBuildOutput,
} from "../packages/application-settings/source/prism-config-schema";

export { resolveBuildOutput, type PrismBuildOutput };

/** Read `build.output` from `config.prism.json` under an app root (default `server`). */
export function readBuildOutputFromAppRoot(appRoot: string): PrismBuildOutput {
  const configPath = path.join(appRoot, "config.prism.json");
  if (!fs.existsSync(configPath)) {
    return "server";
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, "utf8")) as unknown;
  const result = prismConfigBaseSchema.safeParse(parsed);
  if (!result.success) {
    return "server";
  }

  return resolveBuildOutput(result.data);
}

export function isStaticBuildAppRoot(appRoot: string): boolean {
  const configPath = path.join(appRoot, "config.prism.json");
  if (!fs.existsSync(configPath)) {
    return false;
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, "utf8")) as unknown;
  const result = prismConfigBaseSchema.safeParse(parsed);
  if (!result.success) {
    return false;
  }

  return isStaticBuild(result.data);
}
