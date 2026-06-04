/**
 * API key authentication via Better Auth API Key plugin.
 */

import "server-only";

import type { PrismAuth } from "./better-auth/server";
import { enforceRateLimit, getClientIp, RATE_LIMIT_API } from "./rate-limit";

const DEFAULT_API_KEY_HEADER = "x-api-key";

export interface ApiAuthenticationOptions {
  headerName?: string;
  permissions?: Record<string, string[]>;
}

export function createApiAuthentication(
  auth: PrismAuth,
  options: ApiAuthenticationOptions = {}
) {
  const headerName = options.headerName ?? DEFAULT_API_KEY_HEADER;

  async function requireApiAuthentication(request: Request): Promise<void> {
    enforceRateLimit(`api:${getClientIp(request)}`, RATE_LIMIT_API);

    const key = request.headers.get(headerName);
    if (!key) {
      throw new Response("Unauthorized", { status: 401 });
    }

    const result = await auth.api.verifyApiKey({
      body: {
        key,
        permissions: options.permissions,
      },
    });

    if (!result.valid) {
      throw new Response("Unauthorized", { status: 401 });
    }
  }

  return { requireApiAuthentication };
}
