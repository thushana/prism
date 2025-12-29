import * as React from "react";
import { SystemSheetPage } from "@system-sheet";
import type { SystemSheetData } from "@system-sheet";
import { headers } from "next/headers";
import { serverLogger as logger } from "@logger/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchSystemSheetData(): Promise<SystemSheetData | null> {
  try {
    // Construct absolute URL for server component fetch
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.VERCEL_URL
      ? "https"
      : host.includes("localhost")
        ? "http"
        : "https";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/system-sheet`, {
      cache: "no-store",
    });

    if (!res.ok) {
      logger.warn("Failed to fetch system-sheet data", {
        status: res.status,
        statusText: res.statusText,
      });
      return null;
    }

    const json = await res.json();
    return json?.success ? json.data : null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to get system-sheet data", { error: errorMessage });
    return null;
  }
}

export default async function Page(): Promise<React.JSX.Element> {
  const data = await fetchSystemSheetData();

  if (!data) {
    notFound();
  }

  return <SystemSheetPage data={data} />;
}
