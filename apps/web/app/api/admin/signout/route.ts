import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearWebAuthenticationCookie } from "authentication/web";

export async function POST(): Promise<never> {
  const cookieStore = await cookies();
  clearWebAuthenticationCookie(cookieStore);
  redirect("/admin");
}
