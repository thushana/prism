import type { JSX } from "react";
import {
  PRISM_META_CHIP_SECONDARY_CLASS,
  PrismButton,
  PrismCard,
  PrismCardAction,
  PrismCardContent,
  PrismCardDescription,
  PrismCardFooter,
  PrismCardHeader,
  PrismCardTitle,
  PrismTypography,
} from "@ui";

export function PrismCardDemo(): JSX.Element {
  return (
    <div className="max-w-lg space-y-10">
      <PrismCard>
        <PrismCardHeader>
          <PrismCardTitle>Example title</PrismCardTitle>
          <PrismCardDescription>
            Description uses muted text and sits under the title in the header
            grid.
          </PrismCardDescription>
          <PrismCardAction>
            <span className={PRISM_META_CHIP_SECONDARY_CLASS}>Action slot</span>
          </PrismCardAction>
        </PrismCardHeader>
        <PrismCardContent className="space-y-2">
          <PrismTypography
            role="body"
            size="medium"
            color={{ semanticText: "muted" }}
          >
            Body content uses card padding from the content region. Use this
            slot for forms, lists, or summaries.
          </PrismTypography>
        </PrismCardContent>
        <PrismCardFooter className="gap-2 border-t">
          <PrismButton
            type="button"
            variant="plain"
            color="blue"
            label="Primary"
            size="small"
            shape="rectangleRounded"
          />
          <PrismButton
            type="button"
            variant="plain"
            color="grey"
            label="Secondary"
            size="small"
            paint="monochrome"
            shape="rectangleRounded"
          />
        </PrismCardFooter>
      </PrismCard>
    </div>
  );
}
