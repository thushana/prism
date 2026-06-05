/**
 * Next.js proxy – feature-flag query params + optional app-wide auth redirect
 */

import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import prismConfigJson from "./config.prism.json";
import {
  prismConfigBaseSchema,
  resolveAuthenticationGateMode,
} from "application-settings/prism-config-schema";

function applyFlagPrefixOverrides(request: NextRequest): NextResponse {
  const overrides: Record<string, string> = {};

  request.nextUrl.searchParams.forEach((value, key) => {
    if (key.startsWith("flag_")) {
      overrides[key.slice("flag_".length)] = value;
    }
  });

  if (Object.keys(overrides).length === 0) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-prism-flag-overrides", JSON.stringify(overrides));

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

const authGateMode = resolveAuthenticationGateMode(
  prismConfigBaseSchema.parse(prismConfigJson)
);

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

  return applyFlagPrefixOverrides(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
