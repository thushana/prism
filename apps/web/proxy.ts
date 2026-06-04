/**
 * Next.js proxy – feature-flag query params + optional app-wide auth redirect
 */

import { type NextRequest, NextResponse } from "next/server";
import { getProxy } from "feature-flags";
import { getSessionCookie } from "better-auth/cookies";
import authGate from "@/auth-gate.json";

const flagsProxy = getProxy({ paramPrefix: "flag_" });

const authGateMode: "admin" | "app" = authGate?.mode === "app" ? "app" : "admin";

function applyAuthRedirect(request: NextRequest): NextResponse | null {
  if (authGateMode !== "app") {
    return null;
  }

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return null;
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
  }

  return null;
}

export function proxy(request: NextRequest): NextResponse {
  const authRedirect = applyAuthRedirect(request);
  if (authRedirect) {
    return authRedirect;
  }

  return flagsProxy(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
