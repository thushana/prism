import * as React from "react";
import { SignInForm } from "./sign-in-form";

export interface SignInPageProps {
  error?: string;
  authBaseURL?: string;
  passkeys?: boolean;
  redirectTo?: string;
}

export function SignInPage({
  error,
  authBaseURL,
  passkeys = true,
  redirectTo = "/",
}: SignInPageProps): React.JSX.Element {
  return (
    <SignInForm
      error={error}
      authBaseURL={authBaseURL}
      passkeys={passkeys}
      redirectTo={redirectTo}
    />
  );
}
