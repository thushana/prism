/**
 * Dev-Sheet - Shared development information page
 *
 * A reusable development info page for Prism apps.
 * Shows environment info, git status, dependencies, and more.
 *
 * @example
 * ```tsx
 * // In your app's app/dev-sheet/page.tsx
 * import { DevSheetPage } from "@prism/core/dev-sheet";
 * import type { DevSheetData } from "@prism/core/dev-sheet";
 * import { headers } from "next/headers";
 *
 * export const dynamic = "force-dynamic";
 *
 * async function fetchDevSheetData(): Promise<DevSheetData | null> {
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
 *     const res = await fetch(`${baseUrl}/api/dev-sheet`, {
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
 *   if (process.env.NODE_ENV === "production" &&
 *       process.env.ENABLE_DEV_SHEET !== "true") {
 *     return null;
 *   }
 *   const data = await fetchDevSheetData();
 *   return <DevSheetPage data={data} />;
 * }
 * ```
 */

export { DevSheetPage, default as default } from "./page";
export { getRelativeTime, formatDateTimeWithRelative } from "./data";
export type { DevSheetData, DevSheetConfig, AppStatus } from "./types";
