/**
 * Next.js proxy – forwards flag query params to request header for FeatureFlags
 */

import { getProxy } from "feature-flags";

export const proxy = getProxy({ paramPrefix: "flag_" });

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
