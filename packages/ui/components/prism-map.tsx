"use client";

/**
 * ## PrismMap: peer props vs vendor config
 *
 * **Peer props** (top-level fields shared by all vendors): `routes` (encoded polylines),
 * `polygons` (GeoJSON Polygon / MultiPolygon), fit behavior, chrome (`shell`, `title`, slots),
 * and layout — anything Google Maps JS, Mapbox GL, and MapLibre GL can honor the same way.
 *
 * **Vendor-only config** lives only under `google`, `mapbox`, or `maplibre`. Do not mirror
 * vendor-specific options across branches; nest them under that vendor.
 *
 * Vendor implementations are lazy-loaded so apps that only install one optional map peer
 * (e.g. MapLibre) do not pull the others into the initial client graph.
 *
 * @see `PrismMapGoogle`, `PrismMapMapbox`, and `PrismMapMaplibre` for implementation details.
 */

/// <reference types="google.maps" />

import { lazy, Suspense, type ReactNode } from "react";
import { cn } from "@utilities";
import {
  PrismCard,
  PrismCardAction,
  PrismCardContent,
  PrismCardHeader,
  PrismCardTitle,
} from "./prism-card";
import type {
  PrismMapPolygon,
  PrismMapRoute,
  PrismMapShell,
} from "./prism-map-types";

export type {
  PrismMapPolygon,
  PrismMapPolygonGeometry,
  PrismMapRoute,
  PrismMapShell,
  PrismMapVendor,
} from "./prism-map-types";

/** Opaque style JSON — avoids requiring `mapbox-gl` / `maplibre-gl` types at the public API. */
export type PrismMapStyleSpecification = string | Record<string, unknown>;

type PeerProps = {
  /** Encoded overview polylines (optional when `polygons` is set). */
  routes?: PrismMapRoute[];
  /** WGS84 Polygon / MultiPolygon overlays (optional when `routes` is set). */
  polygons?: PrismMapPolygon[];
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
  /** Mapbox / MapLibre: style/tile load failure. */
  onMapLoadError?: (message: string) => void;
};

export type PrismMapProps =
  | (PeerProps & {
      vendor: "google";
      loadGoogleMaps: () => Promise<void>;
      google?: {
        mapOptions?: google.maps.MapOptions;
      };
    })
  | (PeerProps & {
      vendor: "mapbox";
      loadMapboxGl?: () => Promise<void>;
      mapboxAccessToken: string | (() => Promise<string>);
      mapbox: {
        style: PrismMapStyleSpecification;
      };
      mapboxExtra?: {
        projection?: Record<string, unknown>;
      };
    })
  | (PeerProps & {
      vendor: "maplibre";
      loadMapLibreGl?: () => Promise<void>;
      maplibre?: {
        style?: PrismMapStyleSpecification;
        /** MapLibre worker URL; default `/maplibre/maplibre-gl-worker.mjs`. */
        workerUrl?: string;
      };
    });

const PrismMapGoogle = lazy(() =>
  import("./prism-map-google").then((module) => ({
    default: module.PrismMapGoogle,
  }))
);
const PrismMapMapbox = lazy(() =>
  import("./prism-map-mapbox").then((module) => ({
    default: module.PrismMapMapbox,
  }))
);
const PrismMapMaplibre = lazy(() =>
  import("./prism-map-maplibre").then((module) => ({
    default: module.PrismMapMaplibre,
  }))
);

function shellPaddingClass(shell: PrismMapShell | undefined): string {
  return shell === "card" ? "px-0 pb-0 pt-0" : "";
}

export function PrismMap(props: PrismMapProps) {
  const {
    routes = [],
    polygons = [],
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
    onMapLoadError,
  } = props;

  const showHeader = Boolean(title || headerAction);
  // Explicit height + min-height so `h-full` map children resolve (min-height alone does not).
  const mapViewportClass =
    minHeightPx !== undefined
      ? `min-h-[${minHeightPx}px] h-[${minHeightPx}px]`
      : "min-h-[320px] h-[320px]";

  const hasContent = routes.length > 0 || polygons.length > 0;

  const mapBody = !hasContent ? (
    (emptySlot ?? null)
  ) : props.vendor === "google" ? (
    <PrismMapGoogle
      routes={routes}
      polygons={polygons}
      autoFit={autoFit}
      loadGoogleMaps={props.loadGoogleMaps}
      mapOptions={props.google?.mapOptions}
      onRouteSelectionChange={onRouteSelectionChange}
    />
  ) : props.vendor === "mapbox" ? (
    <PrismMapMapbox
      routes={routes}
      polygons={polygons}
      autoFit={autoFit}
      loadMapboxGl={props.loadMapboxGl}
      mapboxAccessToken={props.mapboxAccessToken}
      style={props.mapbox.style}
      mapboxExtra={props.mapboxExtra}
      onRouteSelectionChange={onRouteSelectionChange}
      onMapLoadError={onMapLoadError}
    />
  ) : (
    <PrismMapMaplibre
      routes={routes}
      polygons={polygons}
      autoFit={autoFit}
      loadMapLibreGl={props.loadMapLibreGl}
      style={props.maplibre?.style}
      workerUrl={props.maplibre?.workerUrl}
      onRouteSelectionChange={onRouteSelectionChange}
      onMapLoadError={onMapLoadError}
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
      <div className="relative h-full w-full">
        <Suspense fallback={loadingSlot ?? null}>{mapBody}</Suspense>
      </div>
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
