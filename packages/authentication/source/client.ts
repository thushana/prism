"use client";

import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";

/**
 * Browser auth client must call the same origin as the page (e.g.
 * `porch-scope.localhost`), not a different host from `BETTER_AUTH_URL`
 * (e.g. `localhost`) or cookies and fetch will fail cross-origin.
 */
export function resolveAuthClientBaseURL(configured?: string): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return configured ?? "";
}

export function createPrismAuthClient(baseURL?: string) {
  return createAuthClient({
    baseURL: resolveAuthClientBaseURL(baseURL),
    plugins: [passkeyClient()],
  });
}

export type PrismAuthClient = ReturnType<typeof createPrismAuthClient>;
