import * as React from "react";

import { cn } from "@utilities";

export type PrismCardProps = React.ComponentProps<"div">;

function PrismCard({ className, ...props }: PrismCardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export type PrismCardHeaderProps = React.ComponentProps<"div">;

function PrismCardHeader({ className, ...props }: PrismCardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

export type PrismCardTitleProps = React.ComponentProps<"div">;

function PrismCardTitle({ className, ...props }: PrismCardTitleProps) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

export type PrismCardDescriptionProps = React.ComponentProps<"div">;

function PrismCardDescription({
  className,
  ...props
}: PrismCardDescriptionProps) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export type PrismCardActionProps = React.ComponentProps<"div">;

function PrismCardAction({ className, ...props }: PrismCardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

export type PrismCardContentProps = React.ComponentProps<"div">;

function PrismCardContent({ className, ...props }: PrismCardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

export type PrismCardFooterProps = React.ComponentProps<"div">;

function PrismCardFooter({ className, ...props }: PrismCardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  PrismCard,
  PrismCardHeader,
  PrismCardFooter,
  PrismCardTitle,
  PrismCardAction,
  PrismCardDescription,
  PrismCardContent,
};
