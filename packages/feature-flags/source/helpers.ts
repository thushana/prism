/**
 * FeatureFlags – helpers for option parsing and env/URL handling
 */

/**
 * Parse a flag option string to boolean.
 * Returns true for 'on', false for 'off', undefined when no override.
 */
export function parseFlagOption(
  value: string | undefined
): boolean | undefined {
  if (value === undefined || value === "") return undefined;
  const v = value.toLowerCase();
  if (v === "on") return true;
  if (v === "off") return false;
  return undefined;
}

/**
 * Parse x-prism-flag-overrides header JSON.
 * On invalid JSON or null, returns {}.
 */
export function parseUrlOverrides(
  header: string | null
): Record<string, string> {
  if (header === null || header === "") return {};
  try {
    const parsed = JSON.parse(header) as unknown;
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof k === "string" && typeof v === "string") {
          out[k] = v;
        }
      }
      return out;
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * Read env flags from process.env by prefix and/or explicit keys.
 */
export function getEnvFlags(options: {
  envFlagPrefix?: string;
  envFlagKeys?: string[];
}): Record<string, string> {
  const out: Record<string, string> = {};
  if (options.envFlagKeys) {
    for (const key of options.envFlagKeys) {
      const v = process.env[key];
      if (v !== undefined) out[key] = v;
    }
  }
  if (options.envFlagPrefix) {
    const prefix = options.envFlagPrefix;
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined && key.startsWith(prefix)) {
        out[key] = value;
      }
    }
  }
  return out;
}
