import { DevSheetPage } from "@dev-sheet";
import type { DevSheetData } from "@dev-sheet";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getProtocol(host: string): string {
  if (process.env.VERCEL_URL) return "https";
  if (host.includes("localhost")) return "http";
  return "https";
}

async function fetchDevSheetData(): Promise<DevSheetData | null> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = getProtocol(host);
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/dev-sheet`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json?.success ? json.data : null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to fetch dev-sheet data:", error);
    }
    return null;
  }
}

export default async function Page() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_DEV_SHEET !== "true"
  ) {
    return null;
  }

  const data = await fetchDevSheetData();

  return <DevSheetPage data={data} />;
}
