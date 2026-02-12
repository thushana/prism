/**
 * Next.js middleware – forwards flag query params to request header for FeatureFlags
 */

import { getMiddleware } from "feature-flags";

export const middleware = getMiddleware({ paramPrefix: "flag_" });

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
