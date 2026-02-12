/**
 * FeatureFlags – getMiddleware copies flag query params into request header
 */

import { type NextRequest, NextResponse } from "next/server";
import type { MiddlewareConfig } from "./types";

export function getMiddleware(config: MiddlewareConfig = {}) {
  return function middleware(request: NextRequest): NextResponse {
    const { searchParams } = request.nextUrl;
    const overrides: Record<string, string> = {};

    if (config.paramPrefix) {
      searchParams.forEach((value, key) => {
        if (key.startsWith(config.paramPrefix!)) {
          const flagKey = key.slice(config.paramPrefix!.length);
          overrides[flagKey] = value;
        }
      });
    } else if (config.allowedKeys?.length) {
      for (const key of config.allowedKeys) {
        const value = searchParams.get(key);
        if (value !== null) {
          overrides[key] = value;
        }
      }
    }

    if (Object.keys(overrides).length > 0) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(
        "x-prism-flag-overrides",
        JSON.stringify(overrides)
      );
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    return NextResponse.next();
  };
}
