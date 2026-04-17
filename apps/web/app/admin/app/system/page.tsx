import * as React from "react";
import { SystemSheetPage } from "@system-sheet";
import type { SystemSheetData } from "@system-sheet";
import { AdminPageShell } from "authentication";
import { requireAdminPage } from "authentication/admin-page";
import { headers, cookies } from "next/headers";
import { serverLogger as logger } from "@logger/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchSystemSheetData(): Promise<SystemSheetData | null> {
  try {
    const headersList = await headers();
    const cookieStore = await cookies();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.VERCEL_URL
      ? "https"
      : host.includes("localhost")
        ? "http"
        : "https";
    const baseUrl = `${protocol}://${host}`;

    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const res = await fetch(`${baseUrl}/api/system-sheet`, {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
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

export default async function AdminAppSystemPage(): Promise<React.JSX.Element> {
  const gate = await requireAdminPage();
  if (gate) return gate;

  const data = await fetchSystemSheetData();

  if (!data) {
    notFound();
  }

  return (
    <AdminPageShell
      backHref="/admin"
      title="System"
      description="Environment, deployment, and dependency overview."
      showSignOut
    >
      <SystemSheetPage data={data} config={{ nestedUnderAdminPageShell: true }} />
    </AdminPageShell>
  );
}
