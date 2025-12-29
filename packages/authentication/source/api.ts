/**
 * API key authentication for API routes
 * Checks x-prism-api-key header against PRISM_KEY_API environment variable
 */

import "server-only";
import { verifyKey } from "./core";

/**
 * Require API authentication via x-prism-api-key header
 * @param request Request object to check for x-prism-api-key header
 * @throws Response with 401 status if authentication fails
 */
export function requireApiAuthentication(request: Request): void {
  const apiKey = request.headers.get("x-prism-api-key");
  const expectedKey = process.env.PRISM_KEY_API;

  if (!expectedKey) {
    throw new Response("Server configuration error", { status: 500 });
  }

  if (!verifyKey(apiKey, expectedKey)) {
    throw new Response("Unauthorized", { status: 401 });
  }
}
