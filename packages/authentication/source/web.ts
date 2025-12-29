/**
 * Cookie-based web authentication for pages
 * Uses signed cookies to prevent tampering
 */

import "server-only";
import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { verifyKey } from "./core";

const COOKIE_NAME = "prism-admin-authentication";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Sign a cookie value using HMAC-SHA256
 * @param value - The value to sign
 * @param secret - The secret key (PRISM_KEY_WEB)
 * @returns Signed value in format "value.signature"
 */
function signCookie(value: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${signature}`;
}

/**
 * Verify and extract the value from a signed cookie
 * @param signedValue - The signed cookie value
 * @param secret - The secret key (PRISM_KEY_WEB)
 * @returns The original value if signature is valid, null otherwise
 */
function verifySignedCookie(
  signedValue: string | undefined,
  secret: string
): string | null {
  if (!signedValue) {
    return null;
  }

  const [value, signature] = signedValue.split(".");

  if (!value || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(value)
    .digest("hex");

  if (signature !== expectedSignature) {
    return null;
  }

  return value;
}

/**
 * Check if the user is authenticated via web cookie
 * @param cookieStore - Next.js cookie store (from await cookies())
 * @returns true if authenticated, false otherwise
 */
export async function checkWebAuthentication(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): Promise<boolean> {
  const expectedKey = process.env.PRISM_KEY_WEB;

  if (!expectedKey) {
    return false;
  }

  const cookie = cookieStore.get(COOKIE_NAME);
  const cookieValue = verifySignedCookie(cookie?.value, expectedKey);

  if (!cookieValue) {
    return false;
  }

  return verifyKey(cookieValue, expectedKey);
}

/**
 * Set the web authentication cookie
 * @param cookieStore - Next.js cookie store (from await cookies())
 */
export function setWebAuthenticationCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): void {
  const expectedKey = process.env.PRISM_KEY_WEB;

  if (!expectedKey) {
    throw new Error("PRISM_KEY_WEB environment variable is not set");
  }

  const signedValue = signCookie(expectedKey, expectedKey);

  cookieStore.set(COOKIE_NAME, signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Clear the web authentication cookie
 * @param cookieStore - Next.js cookie store (from await cookies())
 */
export function clearWebAuthenticationCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): void {
  cookieStore.delete(COOKIE_NAME);
}
