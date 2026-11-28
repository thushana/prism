import { readFileSync } from "node:fs";
import path from "node:path";
import type { PrismConfigBase } from "./prism-config-schema";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const WORKTREE_DEV_PORT_SPAN = 999;

export interface DevDeploymentContext {
  /** npm `name` from the Next.js app `package.json` (e.g. `web`). */
  appPackageName?: string;
  /** npm `name` from the monorepo root `package.json` (e.g. `porch-scope`). */
  monorepoPackageName?: string;
  /**
   * Absolute checkout root (monorepo root with `workspaces`, else app root).
   * Used to detect worktree labels and hash stable ports.
   */
  checkoutRoot?: string;
  /** Absolute Next.js app root — `.cursor/dev-port` is read from here. */
  appRoot?: string;
}

export interface DevDeployment {
  nameIdentifier: string;
  /** Subdomain label for linked worktrees; omitted on the main checkout. */
  worktreeLabel?: string;
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

/** Coerce a directory basename into a slug, or `undefined` if empty/invalid. */
export function coerceDevSlug(value: string): string | undefined {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return undefined;
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

function isLoopbackOrLocalhostFamily(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  );
}

/**
 * In dev, prefer the computed Prism `*.localhost` deployment URL when `.env`
 * still points at loopback / another `*.localhost` origin (including a different
 * worktree host or port).
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
    const canonicalIsPrismLocalhost = canonical.hostname.endsWith(".localhost");

    if (
      isLoopbackOrLocalhostFamily(env.hostname) &&
      canonicalIsPrismLocalhost
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

/**
 * Worktree subdomain label from the checkout directory basename.
 * Main checkout (basename === nameIdentifier) → `undefined`.
 * `city-observatory-pdf` + nameIdentifier `city-observatory` → `pdf`.
 */
export function resolveWorktreeLabel(
  checkoutRoot: string | undefined,
  nameIdentifier: string
): string | undefined {
  if (!checkoutRoot) {
    return undefined;
  }

  const basenameSlug = coerceDevSlug(path.basename(path.resolve(checkoutRoot)));
  if (!basenameSlug || basenameSlug === nameIdentifier) {
    return undefined;
  }

  const prefix = `${nameIdentifier}-`;
  if (basenameSlug.startsWith(prefix)) {
    const rest = basenameSlug.slice(prefix.length);
    return rest && SLUG_PATTERN.test(rest) ? rest : undefined;
  }

  return basenameSlug;
}

function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Stable worktree port in `[configPort + 1, configPort + 999]`. */
export function hashWorktreeDevPort(
  checkoutRoot: string,
  configPort: number
): number {
  const resolved = path.resolve(checkoutRoot);
  return configPort + 1 + (fnv1a32(resolved) % WORKTREE_DEV_PORT_SPAN);
}

/**
 * Port override order: `PORT` env → `{appRoot}/.cursor/dev-port` → fallback.
 */
export function resolveDevPortOverride(
  appRoot: string | undefined,
  fallbackPort: number
): number {
  const portEnv = process.env.PORT?.trim();
  if (portEnv && /^\d+$/.test(portEnv)) {
    return Number(portEnv);
  }

  if (appRoot) {
    try {
      const fromFile = readFileSync(
        path.join(appRoot, ".cursor", "dev-port"),
        "utf8"
      ).trim();
      if (/^\d+$/.test(fromFile)) {
        return Number(fromFile);
      }
    } catch {
      // missing or unreadable
    }
  }

  return fallbackPort;
}

export function resolveDevHost(
  config: PrismConfigBase,
  context: DevDeploymentContext = {}
): string {
  const configured = config.deployments?.dev?.host?.trim();
  if (configured) {
    return configured;
  }

  const nameIdentifier = resolveNameIdentifier(config, context);
  const worktreeLabel = resolveWorktreeLabel(
    context.checkoutRoot,
    nameIdentifier
  );
  if (worktreeLabel) {
    return `${worktreeLabel}.${nameIdentifier}.localhost`;
  }
  return buildDevLocalhostHost(nameIdentifier);
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
  const worktreeLabel = resolveWorktreeLabel(
    context.checkoutRoot,
    nameIdentifier
  );
  const host = resolveDevHost(config, context);
  const configPort = resolveDevPort(config, portFallback);
  const computedPort =
    worktreeLabel && context.checkoutRoot
      ? hashWorktreeDevPort(context.checkoutRoot, configPort)
      : configPort;
  const port = resolveDevPortOverride(context.appRoot, computedPort);
  const url = buildDevAppUrl(host, port);

  return {
    nameIdentifier,
    ...(worktreeLabel ? { worktreeLabel } : {}),
    host,
    port,
    url,
    origins: buildDevAppOrigins(host, port),
  };
}
