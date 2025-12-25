import { DevSheetPage } from "dev-sheet";
import type { DevSheetData } from "dev-sheet";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchDevSheetData(): Promise<DevSheetData | null> {
  try {
    // Construct absolute URL for server component fetch
    // In server components, relative URLs don't work with fetch()
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3001";
    const protocol = process.env.VERCEL_URL
      ? "https"
      : host.includes("localhost")
        ? "http"
        : "https";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/dev-sheet`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json?.success ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * Admin Dev-Sheet Page
 *
 * Uses the shared DevSheetPage component from @prism/core/dev-sheet
 * The API route at /api/dev-sheet provides the data
 */
export default async function Page() {
  // Hide in production unless explicitly enabled
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_DEV_SHEET !== "true"
  ) {
    return null;
  }

  const data = await fetchDevSheetData();

  return <DevSheetPage data={data} />;
}
