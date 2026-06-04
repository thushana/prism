import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function POST(): Promise<never> {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/sign-in");
}
