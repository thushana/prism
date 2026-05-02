import type { JSX } from "react";
import {
  PrismLayoutBreakout,
  PrismLayoutText,
  PrismLayoutWrappersReference,
  PrismTypography,
  sentient,
} from "@ui";

export function PrismLayoutDemo(): JSX.Element {
  return (
    <div className="space-y-8">
      <PrismLayoutWrappersReference />

      <PrismLayoutBreakout className="mt-8">
        <div>
          <h2 className="mb-4">Layout sample — content-text</h2>
          <PrismLayoutText
            className={`space-y-4 font-serif ${sentient.variable}`}
          >
            <PrismTypography role="headline" size="small">
              What is Prism?
            </PrismTypography>
            <PrismTypography
              role="body"
              size="large"
              className="text-muted-foreground"
            >
              Prism is a full-stack app framework that gets you from zero to a
              running Next.js app with a consistent stack: UI components,
              database access, logging, feature flags, and deployment wiring.
              It’s built for small teams and solo developers who want structure
              without heavy boilerplate.
            </PrismTypography>
            <PrismTypography
              role="body"
              size="large"
              className="text-muted-foreground"
            >
              Out of the box you get a design system (Satoshi, Sentient,
              Zodiak), layout wrappers for content and graphics, and a system
              sheet for environment and dependency overview. The CLI can
              scaffold new apps and packages, and the generator keeps your
              config in sync across the monorepo.
            </PrismTypography>
            <PrismTypography
              role="body"
              size="large"
              className="text-muted-foreground"
            >
              Feature flags, authentication, and cost tracking plug in via Prism
              packages so you can turn capabilities on when you need them. If
              you want a single stack that stays consistent as the product
              grows, Prism is built for that.
            </PrismTypography>
          </PrismLayoutText>
        </div>
      </PrismLayoutBreakout>
    </div>
  );
}
