/**
 * Factory function to create authentication route handler
 * Handles POST requests to verify password and set authentication cookie
 */

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyKey } from "./core";
import { setWebAuthenticationCookie } from "./web";

/**
 * Create an authentication route handler
 * @returns Next.js route handler function
 */
export function createAuthenticationRoute() {
  return async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const { password } = body;

      if (!password || typeof password !== "string") {
        return NextResponse.json(
          { success: false, error: "Password is required" },
          { status: 400 }
        );
      }

      const expectedKey = process.env.PRISM_KEY_WEB;

      if (!expectedKey) {
        return NextResponse.json(
          { success: false, error: "Server configuration error" },
          { status: 500 }
        );
      }

      if (!verifyKey(password, expectedKey)) {
        return NextResponse.json(
          { success: false, error: "Invalid password" },
          { status: 401 }
        );
      }

      // Set authentication cookie
      const cookieStore = await cookies();
      setWebAuthenticationCookie(cookieStore);

      return NextResponse.json({ success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  };
}
