/**
 * FeatureFlags – getProxy returns a request handler that copies flag query params into request header
 */

import { type NextRequest, NextResponse } from "next/server";
import type { ProxyConfig } from "./types";

export function getProxy(config: ProxyConfig = {}) {
  return function proxy(request: NextRequest): NextResponse {
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
      requestHeaders.set("x-prism-flag-overrides", JSON.stringify(overrides));
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    return NextResponse.next();
  };
}
