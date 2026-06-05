import "server-only";

import * as React from "react";
import { redirect } from "next/navigation";
import type { PrismAuth } from "./better-auth/server";
import { getSessionFromAuth, isAdminUser } from "./better-auth/session";
import { SignInPage } from "./sign-in-page";

export interface AuthGatesOptions {
  signInPath?: string;
  signInPathDropOff?: string;
}

export function createAuthGates(
  auth: PrismAuth,
  options: AuthGatesOptions = {}
) {
  const signInPath = options.signInPath ?? "/sign-in";
  const signInPathDropOff = options.signInPathDropOff ?? "/";

  async function checkSession() {
    return getSessionFromAuth(auth);
  }

  async function requireAdminPage(): Promise<React.JSX.Element | null> {
    const result = await getSessionFromAuth(auth);
    if (!result?.session) {
      return <SignInPage redirectTo={signInPathDropOff} />;
    }
    if (!isAdminUser(result.user)) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">
            You do not have access to this admin area.
          </p>
        </div>
      );
    }
    return null;
  }

  async function requireSessionPage(): Promise<React.JSX.Element | null> {
    const result = await getSessionFromAuth(auth);
    if (!result?.session) {
      return <SignInPage redirectTo={signInPathDropOff} />;
    }
    return null;
  }

  async function requireSessionApi(request: Request): Promise<void> {
    const result = await auth.api.getSession({
      headers: request.headers,
    });
    if (!result?.session) {
      throw new Response("Unauthorized", { status: 401 });
    }
  }

  async function requireSessionPageOrRedirect(): Promise<void> {
    const result = await getSessionFromAuth(auth);
    if (!result?.session) {
      redirect(signInPath);
    }
  }

  return {
    checkSession,
    requireAdminPage,
    requireSessionPage,
    requireSessionApi,
    requireSessionPageOrRedirect,
  };
}
