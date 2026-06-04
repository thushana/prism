/**
 * Shared core verification function for authentication
 * Used by both API and web authentication
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

/**
 * Verify that a provided key matches the expected key
 * @param provided - The key provided by the user/client
 * @param expected - The expected key from environment variable
 * @returns true if keys match, false otherwise
 */
export function verifyKey(
  provided: string | null | undefined,
  expected: string | undefined
): boolean {
  return secureCompare(provided, expected);
}
