"use client";

/**
 * ## PrismMap: peer props vs vendor config
 *
 * **Peer props** (top-level fields shared by both vendors): routes, fit behavior, chrome
 * (`shell`, `title`, slots), and layout — anything Google Maps JS and Mapbox GL can honor the same way.
 *
 * **Vendor-only config** lives only under `google` or `mapbox`. Do not mirror Google-only options
 * onto the Mapbox branch (or vice versa); when a knob is vendor-specific, nest it under that vendor.
 *
 * @see `PrismMapGoogle` and `PrismMapMapbox` for implementation details.
 */

/// <reference types="google.maps" />

import type { ReactNode } from "react";
import { cn } from "@utilities";
import {
  PrismCard,
  PrismCardAction,
  PrismCardContent,
  PrismCardHeader,
  PrismCardTitle,
} from "./prism-card";
import { PrismMapGoogle } from "./prism-map-google";
import { PrismMapMapbox } from "./prism-map-mapbox";
import type { PrismMapRoute, PrismMapShell } from "./prism-map-types";

export type {
  PrismMapRoute,
  PrismMapShell,
  PrismMapVendor,
} from "./prism-map-types";

type PeerProps = {
  routes: PrismMapRoute[];
  autoFit?: boolean;
  shell?: PrismMapShell;
  title?: string;
  headerAction?: ReactNode;
  className?: string;
  mapClassName?: string;
  minHeightPx?: number;
  loadingSlot?: ReactNode;
  errorSlot?: ReactNode;
  emptySlot?: ReactNode;
  /**
   * Fired when the user selects a route polyline, or `null` when the map background is clicked.
   */
  onRouteSelectionChange?: (route: PrismMapRoute | null) => void;
};

export type PrismMapProps =
  | (PeerProps & {
      vendor: "google";
      loadGoogleMaps: () => Promise<void>;
      google?: {
        mapOptions?: google.maps.MapOptions;
        styles?: google.maps.MapTypeStyle[];
      };
    })
  | (PeerProps & {
      vendor: "mapbox";
      loadMapboxGl?: () => Promise<void>;
      mapboxAccessToken: string | (() => Promise<string>);
      mapbox: {
        style: string | import("mapbox-gl").StyleSpecification;
      };
      mapboxExtra?: {
        projection?: import("mapbox-gl").ProjectionSpecification;
      };
    });

function shellPaddingClass(shell: PrismMapShell | undefined): string {
  return shell === "card" ? "px-0 pb-0 pt-0" : "";
}

export function PrismMap(props: PrismMapProps) {
  const {
    routes,
    autoFit,
    shell = "none",
    title,
    headerAction,
    className,
    mapClassName,
    minHeightPx,
    loadingSlot,
    errorSlot,
    emptySlot,
    onRouteSelectionChange,
  } = props;

  const showHeader = Boolean(title || headerAction);
  // Explicit height + min-height so `h-full` map children resolve (min-height alone does not).
  const mapViewportClass =
    minHeightPx !== undefined
      ? `min-h-[${minHeightPx}px] h-[${minHeightPx}px]`
      : "min-h-[320px] h-[320px]";

  const mapBody =
    routes.length === 0 ? (
      (emptySlot ?? null)
    ) : props.vendor === "google" ? (
      <PrismMapGoogle
        routes={routes}
        autoFit={autoFit}
        loadGoogleMaps={props.loadGoogleMaps}
        mapOptions={props.google?.mapOptions}
        styles={props.google?.styles}
        onRouteSelectionChange={onRouteSelectionChange}
      />
    ) : (
      <PrismMapMapbox
        routes={routes}
        autoFit={autoFit}
        loadMapboxGl={props.loadMapboxGl}
        mapboxAccessToken={props.mapboxAccessToken}
        style={props.mapbox.style}
        mapboxExtra={props.mapboxExtra}
        onRouteSelectionChange={onRouteSelectionChange}
      />
    );

  const viewportHeightPx = minHeightPx ?? 320;

  const inner = (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border bg-muted/20",
        mapViewportClass,
        mapClassName
      )}
      style={{ height: viewportHeightPx, minHeight: viewportHeightPx }}
    >
      {loadingSlot ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          {loadingSlot}
        </div>
      ) : null}
      {errorSlot ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          {errorSlot}
        </div>
      ) : null}
      <div className="relative h-full w-full">{mapBody}</div>
    </div>
  );

  if (shell === "card") {
    return (
      <div className={className}>
        <PrismCard className="gap-0 overflow-hidden py-0">
          {showHeader ? (
            <PrismCardHeader className="border-b py-4">
              {title ? <PrismCardTitle>{title}</PrismCardTitle> : null}
              {headerAction ? (
                <PrismCardAction>{headerAction}</PrismCardAction>
              ) : null}
            </PrismCardHeader>
          ) : null}
          <PrismCardContent
            className={`px-0 pb-0 pt-0 ${shellPaddingClass(shell)}`}
          >
            {inner}
          </PrismCardContent>
        </PrismCard>
      </div>
    );
  }

  return (
    <div className={className}>
      {showHeader ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          {title ? (
            <h3 className="text-sm font-semibold leading-none">{title}</h3>
          ) : null}
          {headerAction}
        </div>
      ) : null}
      {inner}
    </div>
  );
}
