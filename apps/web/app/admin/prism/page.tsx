import { redirect } from "next/navigation";
import { requireAdminPage } from "@/library/authentication/authentication-gates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPrismPage() {
  const gate = await requireAdminPage();
  if (gate) return gate;
  redirect("/admin/prism/components");
}
