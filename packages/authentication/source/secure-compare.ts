/**
 * Server-side timing-safe string comparison for authentication secrets.
 */

import { createHash, timingSafeEqual } from "crypto";

/**
 * Constant-time string comparison via SHA-256 digests.
 * Avoids leaking key length or prefix through timing side channels.
 */
export function secureCompare(
  provided: string | null | undefined,
  expected: string | undefined
): boolean {
  if (!expected || !provided) {
    return false;
  }

  const providedDigest = createHash("sha256").update(provided).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();

  return timingSafeEqual(providedDigest, expectedDigest);
}
