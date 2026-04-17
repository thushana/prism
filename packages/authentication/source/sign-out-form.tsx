"use client";

import * as React from "react";
import { Hand } from "lucide-react";
import { PrismButton } from "@ui";

/**
 * Form that POSTs to /api/admin/signout to clear the authentication cookie.
 * Renders as a text-style admin action (no fill) with a hand icon.
 */
export function SignOutForm(): React.JSX.Element {
  return (
    <form action="/api/admin/signout" method="POST" className="inline">
      <PrismButton
        type="submit"
        variant="icon"
        icon={Hand}
        iconPosition="left"
        label="Sign out"
        color="grey"
        colorVariant="background-no"
        typeUppercase
        shapeLineNo
        size="small"
      />
    </form>
  );
}
