/**
 * Factory function to create authentication route handler
 * Handles POST requests to verify password and set authentication cookie
 */

import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  enforceRateLimit,
  getClientIp,
  RATE_LIMIT_WEB_LOGIN,
} from "../rate-limit";
import { secureCompare } from "../secure-compare";
import { setWebAuthenticationCookie } from "./web";

/**
 * Create an authentication route handler
 * @returns Next.js route handler function
 */
export function createAuthenticationRoute() {
  return async function POST(request: NextRequest) {
    try {
      enforceRateLimit(
        `web-login:${getClientIp(request)}`,
        RATE_LIMIT_WEB_LOGIN
      );

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

      if (!secureCompare(password, expectedKey)) {
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
      if (error instanceof Response && error.status === 429) {
        return NextResponse.json(
          { success: false, error: "Too many requests" },
          { status: 429 }
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  };
}
