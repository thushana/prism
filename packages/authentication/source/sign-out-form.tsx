"use client";

import * as React from "react";
import { PrismButton } from "@ui";

/**
 * Form that POSTs to /api/admin/signout to clear the authentication cookie.
 * Renders as a text-style admin action (no fill).
 */
export function SignOutForm(): React.JSX.Element {
  return (
    <form action="/api/admin/signout" method="POST" className="inline">
      <PrismButton
        type="submit"
        variant="plain"
        label="Sign out"
        textCase="uppercase"
        color="grey"
        paint="backgroundNone"
        disableColorChange
        line="none"
        size="small"
        className="py-0! px-1! text-muted-foreground! hover:text-foreground!"
      />
    </form>
  );
}
