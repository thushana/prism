import type { JSX } from "react";
import type { PrismPathBarTitleEntry } from "@ui";
import { PrismPathBar, PrismTypography } from "@ui";

const PATH_BAR_TITLE_BY_PATH_PREFIX_FOR_DEMO: Record<
  string,
  PrismPathBarTitleEntry
> = {
  "/admin": "Admin",
  "/admin/prism": { label: "Prism" },
  "/admin/prism/components": {
    label: "Prism Components",
    href: "/admin/prism/components",
  },
};

export function PrismPathBarDemo(): JSX.Element {
  return (
    <div className="space-y-10">
      <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        <PrismTypography role="title" size="medium" font="sans" as="h2">
          Auto mode
        </PrismTypography>
        <p className="text-sm text-muted-foreground">
          Builds segments from{" "}
          <code className="font-mono text-xs">pathname</code>,{" "}
          <code className="font-mono text-xs">titleByPathPrefix</code>, and the
          page title.
        </p>
        <PrismPathBar
          mode="auto"
          pathname="/admin/prism/components/prism-path-bar"
          titleByPathPrefix={PATH_BAR_TITLE_BY_PATH_PREFIX_FOR_DEMO}
          pageTitle="PrismPathBar"
        />
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        <PrismTypography role="title" size="medium" font="sans" as="h2">
          Explicit segments
        </PrismTypography>
        <PrismPathBar
          mode="explicit"
          segments={[
            { label: "Docs", href: "#" },
            { label: "Navigation", href: "#" },
            { label: "Current page" },
          ]}
        />
      </section>
    </div>
  );
}
