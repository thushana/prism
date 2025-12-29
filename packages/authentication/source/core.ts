/**
 * Shared core verification function for authentication
 * Used by both API and web authentication
 */

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
  if (!expected) {
    return false;
  }

  if (!provided) {
    return false;
  }

  return provided === expected;
}
