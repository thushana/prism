import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/library/authentication/authentication";

export async function POST(): Promise<never> {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/sign-in");
}
