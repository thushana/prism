/**
 * System-Sheet - Shared system information page
 *
 * A reusable system info page for Prism apps.
 * Shows environment info, git status, dependencies, and more.
 *
 * @example
 * ```tsx
 * // In your app's app/admin/system-sheet/page.tsx
 * import { SystemSheetPage } from "@prism/core/system-sheet";
 * import type { SystemSheetData } from "@prism/core/system-sheet";
 * import { headers } from "next/headers";
 *
 * export const dynamic = "force-dynamic";
 *
 * async function fetchSystemSheetData(): Promise<SystemSheetData | null> {
 *   try {
 *     // Construct absolute URL for server component fetch
 *     const headersList = await headers();
 *     const host = headersList.get("host") || "localhost:3001";
 *     const protocol = process.env.VERCEL_URL
 *       ? "https"
 *       : host.includes("localhost")
 *         ? "http"
 *         : "https";
 *     const baseUrl = `${protocol}://${host}`;
 *
 *     const res = await fetch(`${baseUrl}/api/system-sheet`, {
 *       cache: "no-store",
 *     });
 *     if (!res.ok) return null;
 *     const json = await res.json();
 *     return json?.success ? json.data : null;
 *   } catch {
 *     return null;
 *   }
 * }
 *
 * export default async function Page() {
 *   const data = await fetchSystemSheetData();
 *   return <SystemSheetPage data={data} />;
 * }
 * ```
 */

export { SystemSheetPage, default as default } from "./page";
export { getRelativeTime, formatDateTimeWithRelative } from "./data";
export type { SystemSheetData, SystemSheetConfig, AppStatus } from "./types";
