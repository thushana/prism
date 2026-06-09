import { z } from "zod";

export {
  APP_CONFIG_FILE_NAME,
  LEGACY_APP_CONFIG_FILE_NAME,
  LEGACY_APP_JSON_FILE_NAME,
  LEGACY_PRISM_CONFIG_FILE_NAME,
  PRISM_CONFIG_FILE_NAME,
} from "./config-file-names";

const NAME_IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const prismAppConfigInputSchema = z
  .object({
    /** Stable slug for URLs and tooling (e.g. `porch-scope`). */
    nameIdentifier: z.string().regex(NAME_IDENTIFIER_PATTERN).optional(),
    /** Human-facing app name (e.g. `Porch Scope`). */
    nameDisplay: z.string().min(1).optional(),
    /** @deprecated Use `nameDisplay`. */
    displayName: z.string().min(1).optional(),
    description: z.string(),
    icon: z.string().optional(),
  })
  .superRefine((data, context) => {
    if (!data.nameDisplay?.trim() && !data.displayName?.trim()) {
      context.addIssue({
        code: "custom",
        message: "app.nameDisplay (or legacy app.displayName) is required",
        path: ["nameDisplay"],
      });
    }
  })
  .transform((data) => ({
    nameIdentifier: data.nameIdentifier,
    nameDisplay: (data.nameDisplay ?? data.displayName)!.trim(),
    description: data.description,
    icon: data.icon,
  }));

/** Chrome every Prism app supplies under `config.prism.json` → `app`. */
export const prismAppConfigSchema = prismAppConfigInputSchema;

export type PrismAppConfig = z.infer<typeof prismAppConfigSchema>;

/** `admin` — only `/admin/*` is gated; `app` — proxy redirects unauthenticated users to sign-in. */
export const prismAuthenticationGateModeSchema = z.enum(["admin", "app"]);

export type PrismAuthenticationGateMode = z.infer<
  typeof prismAuthenticationGateModeSchema
>;

export const prismAuthenticationConfigSchema = z
  .object({
    gateMode: prismAuthenticationGateModeSchema.default("admin"),
    /** Where to send users after a successful sign-in (default `/`). */
    signInPathDropOff: z.string().startsWith("/").default("/"),
  })
  .optional();

export type PrismAuthenticationConfig = z.infer<
  typeof prismAuthenticationConfigSchema
>;

export const prismBuildOutputSchema = z.enum(["static", "server"]);

export type PrismBuildOutput = z.infer<typeof prismBuildOutputSchema>;

export const prismBuildConfigSchema = z
  .object({
    output: prismBuildOutputSchema.default("server"),
  })
  .optional();

export type PrismBuildConfig = z.infer<typeof prismBuildConfigSchema>;

/** Standard Prism platform config shape (all consumer apps). */
export const prismConfigBaseSchema = z.object({
  app: prismAppConfigSchema,
  build: prismBuildConfigSchema,
  authentication: prismAuthenticationConfigSchema,
  deployments: z
    .object({
      dev: z
        .object({
          /** Full dev hostname (default: `{app.nameIdentifier}.localhost`). */
          host: z.string().min(1).optional(),
          port: z.number().int().min(1).max(65535).optional(),
        })
        .optional(),
    })
    .optional(),
});

export type PrismConfigBase = z.infer<typeof prismConfigBaseSchema>;

/** Resolve gate mode from `config.prism.json` → `authentication` (default `admin`). */
export function resolveAuthenticationGateMode(
  config: Pick<PrismConfigBase, "authentication">
): PrismAuthenticationGateMode {
  return config.authentication?.gateMode === "app" ? "app" : "admin";
}

/** Resolve post-sign-in redirect from `config.prism.json` → `authentication` (default `/`). */
export function resolveSignInPathDropOff(
  config: Pick<PrismConfigBase, "authentication">
): string {
  return config.authentication?.signInPathDropOff ?? "/";
}

/** Resolve build output from `config.prism.json` → `build` (default `server`). */
export function resolveBuildOutput(
  config: Pick<PrismConfigBase, "build">
): PrismBuildOutput {
  return config.build?.output ?? "server";
}

export function isStaticBuild(config: Pick<PrismConfigBase, "build">): boolean {
  return resolveBuildOutput(config) === "static";
}
