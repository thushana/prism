/** Server-only runtime packages filtered from sync allowlist for static consumers. */
export const SERVER_ONLY_RUNTIME_PACKAGES = [
  "drizzle-orm",
  "dotenv",
  "flags",
] as const;

/** Server-only dev packages filtered from sync allowlist for static consumers. */
export const SERVER_ONLY_DEV_PACKAGES = ["drizzle-kit"] as const;

export function filterDependencyNamesForBuildOutput<
  T extends readonly string[],
>(packageNames: T, buildOutput: "static" | "server"): T[number][] {
  if (buildOutput === "server") {
    return [...packageNames];
  }

  const serverOnly = new Set<string>([
    ...SERVER_ONLY_RUNTIME_PACKAGES,
    ...SERVER_ONLY_DEV_PACKAGES,
  ]);

  return packageNames.filter((name) => !serverOnly.has(name));
}
