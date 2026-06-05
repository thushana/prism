import type { PrismConfigBase } from "./prism-config-schema";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface DevDeploymentContext {
  /** npm `name` from the Next.js app `package.json` (e.g. `web`). */
  appPackageName?: string;
  /** npm `name` from the monorepo root `package.json` (e.g. `porch-scope`). */
  monorepoPackageName?: string;
}

export interface DevDeployment {
  nameIdentifier: string;
  host: string;
  port: number;
  url: string;
  origins: readonly string[];
}

export function normalizeDevSlug(value: string): string {
  const slug = value.trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `application-settings: invalid dev slug "${value}" (use lowercase letters, numbers, and hyphens).`
    );
  }
  return slug;
}

/** Default hostname for local dev: `{slug}.localhost`. */
export function buildDevLocalhostHost(slug: string): string {
  return `${normalizeDevSlug(slug)}.localhost`;
}

export function buildDevAppUrl(host: string, port: number): string {
  return `http://${host}:${port}`;
}

/** Origins allowed for local API CORS (canonical host + legacy localhost). */
export function buildDevAppOrigins(
  host: string,
  port: number
): readonly string[] {
  const origins = new Set<string>([buildDevAppUrl(host, port)]);
  if (host !== "localhost" && !host.startsWith("localhost:")) {
    origins.add(`http://localhost:${port}`);
  }
  return [...origins];
}

/** Better Auth `trustedOrigins`: canonical URL plus local dev alternates. */
export function resolveTrustedAuthOrigins(
  canonicalUrl: string,
  devOrigins: readonly string[] = []
): string[] {
  return [...new Set([canonicalUrl, ...devOrigins])];
}

function urlsSharePort(left: URL, right: URL): boolean {
  return left.port === right.port;
}

/**
 * In dev, upgrade legacy `http://localhost:{port}` env values to the Prism dev URL
 * (`http://{nameIdentifier}.localhost:{port}`) so WebAuthn RP ID matches the browser.
 */
export function resolvePrismBetterAuthUrl(
  configuredUrl: string | undefined,
  devAppUrl: string,
  isProduction: boolean
): string {
  const fallback = devAppUrl.trim();
  const configured = configuredUrl?.trim();
  if (!configured) {
    return fallback;
  }
  if (isProduction) {
    return configured;
  }

  try {
    const env = new URL(configured);
    const canonical = new URL(fallback);
    const envIsLoopback =
      env.hostname === "localhost" || env.hostname === "127.0.0.1";
    const canonicalIsPrismLocalhost = canonical.hostname.endsWith(".localhost");

    if (
      envIsLoopback &&
      canonicalIsPrismLocalhost &&
      urlsSharePort(env, canonical)
    ) {
      return fallback;
    }
  } catch {
    return configured;
  }

  return configured;
}

export function resolveNameIdentifier(
  config: PrismConfigBase,
  context: DevDeploymentContext = {}
): string {
  const configured = config.app.nameIdentifier?.trim();
  if (configured) {
    return normalizeDevSlug(configured);
  }

  const monorepo = context.monorepoPackageName?.trim();
  if (monorepo && monorepo !== "web") {
    return normalizeDevSlug(monorepo.replace(/^@/, "").split("/").pop()!);
  }

  const appPackage = context.appPackageName?.trim();
  if (appPackage && appPackage !== "web") {
    return normalizeDevSlug(appPackage.replace(/^@/, "").split("/").pop()!);
  }

  if (monorepo) {
    return normalizeDevSlug(monorepo.replace(/^@/, "").split("/").pop()!);
  }

  if (appPackage) {
    return normalizeDevSlug(appPackage.replace(/^@/, "").split("/").pop()!);
  }

  return "app";
}

export function resolveDevHost(
  config: PrismConfigBase,
  context: DevDeploymentContext = {}
): string {
  const configured = config.deployments?.dev?.host?.trim();
  if (configured) {
    return configured;
  }
  return buildDevLocalhostHost(resolveNameIdentifier(config, context));
}

/** @deprecated Use `resolveNameIdentifier`. */
export const resolveDevSlug = resolveNameIdentifier;

export function resolveDevPort(
  config: PrismConfigBase,
  fallback = 3000
): number {
  return config.deployments?.dev?.port ?? fallback;
}

export function resolveDevDeployment(
  config: PrismConfigBase,
  context: DevDeploymentContext = {},
  portFallback = 3000
): DevDeployment {
  const nameIdentifier = resolveNameIdentifier(config, context);
  const host = resolveDevHost(config, context);
  const port = resolveDevPort(config, portFallback);
  const url = buildDevAppUrl(host, port);

  return {
    nameIdentifier,
    host,
    port,
    url,
    origins: buildDevAppOrigins(host, port),
  };
}
