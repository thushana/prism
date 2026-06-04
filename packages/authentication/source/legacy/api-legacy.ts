/**
 * @deprecated Use createApiAuthentication from @authentication/api with your app auth instance.
 */

import "server-only";

import { enforceRateLimit, getClientIp, RATE_LIMIT_API } from "../rate-limit";
import { secureCompare } from "../secure-compare";

/**
 * Legacy shared-secret API auth (x-prism-api-key + PRISM_KEY_API).
 */
export function requireApiAuthentication(request: Request): void {
  const apiKey = request.headers.get("x-prism-api-key");
  const expectedKey = process.env.PRISM_KEY_API;

  if (!expectedKey) {
    throw new Response("Server configuration error", { status: 500 });
  }

  enforceRateLimit(`api:${getClientIp(request)}`, RATE_LIMIT_API);

  if (!secureCompare(apiKey, expectedKey)) {
    throw new Response("Unauthorized", { status: 401 });
  }
}
