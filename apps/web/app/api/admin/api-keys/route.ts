import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isAdminUser } from "authentication/better-auth/session";

export async function POST(request: Request): Promise<Response> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.session || !isAdminUser(session.user)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string };

  const result = await auth.api.createApiKey({
    body: {
      name: body.name ?? "API key",
      userId: session.user.id,
    },
  });

  if (!result.key) {
    return Response.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }

  return Response.json({ key: result.key });
}
