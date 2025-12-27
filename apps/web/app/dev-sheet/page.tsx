import { DevSheetPage } from "@dev-sheet";
import type { DevSheetData } from "@dev-sheet";
import { getDevSheetData } from "../api/dev-sheet/route";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_DEV_SHEET !== "true"
  ) {
    return null;
  }

  let data: DevSheetData | null = null;
  try {
    data = await getDevSheetData();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to get dev-sheet data:", error);
    }
  }

  return <DevSheetPage data={data} />;
}
