"use client";

import * as React from "react";
import { PrismTypography } from "@ui";

/**
 * Form that POSTs to /api/admin/signout to clear the authentication cookie.
 * Renders as an inline button styled as a muted text link.
 */
export function SignOutForm(): React.JSX.Element {
  return (
    <form action="/api/admin/signout" method="POST" className="inline">
      <button
        type="submit"
        className="group inline text-left underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <PrismTypography
          role="label"
          size="large"
          as="span"
          color="muted"
          className="group-hover:text-foreground"
        >
          Sign out
        </PrismTypography>
      </button>
    </form>
  );
}
