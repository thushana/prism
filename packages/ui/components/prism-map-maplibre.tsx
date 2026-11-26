"use client";

/**
 * MapLibre GL implementation for {@link PrismMap}. Loads `maplibre-gl` via dynamic `import()`
 * so bundles that only use Google/Mapbox never pay the MapLibre weight.
 *
 * Supports peer `routes` (encoded polylines) and `polygons` (GeoJSON Polygon / MultiPolygon).
 */

import { useEffect, useRef, useState } from "react";
import { PRISM_MAP_MAPLIBRE_STYLE_DEFAULT } from "./prism-map-styles";
import type { PrismMapPolygon, PrismMapRoute } from "./prism-map-types";
import {
  addPrismMapVectorLayers,
  bindPrismMapRouteSelection,
  collectPrismMapOverlayPositions,
  prismMapVectorOverlaySignature,
  updatePrismMapVectorSources,
  type PrismMapVectorMap,
} from "./prism-map-vector-layers";

type MapLibreModule = typeof import("maplibre-gl");

function applyFit(
  map: import("maplibre-gl").Map,
  maplibregl: MapLibreModule,
  routes: PrismMapRoute[],
  polygons: PrismMapPolygon[],
  autoFit: boolean
) {
  if (!autoFit) return;
  const positions = collectPrismMapOverlayPositions(routes, polygons);
  if (positions.length === 0) return;
  const bounds = new maplibregl.LngLatBounds();
  for (const position of positions) {
    bounds.extend(position);
  }
  if (bounds.isEmpty()) return;
  map.fitBounds(bounds, { padding: 40, duration: 0, maxZoom: 14 });
}

/**
 * Point MapLibre at a real HTTP(S) worker. Under Next/webpack, the default worker
 * URL resolves empty (`file://` → rejected), which yields "Worker failed to load"
 * and a basemap stuck on low-zoom Natural Earth.
 */
function ensureMapLibreWorkerUrl(
  maplibregl: MapLibreModule,
  workerUrl?: string
) {
  if (typeof window === "undefined") return;

  // Always set before constructing a Map. MapLibre's defaultWorkerUrl() uses
  // `import.meta.url` + `./maplibre-gl-worker.mjs`; under Next/webpack that is
  // often empty or a 404 under `/_next/static/chunks/`, which yields
  // "Worker failed to load". Do not use `new URL(asset, import.meta.url)` here —
  // webpack rewrites it to `new __webpack_require__.U(...)`, which is unreliable.
  // Host apps should sync `maplibre-gl-worker.mjs` to `public/maplibre/`.
  maplibregl.setWorkerUrl(workerUrl ?? "/maplibre/maplibre-gl-worker.mjs");
}

export type PrismMapMaplibreProps = {
  routes: PrismMapRoute[];
  polygons?: PrismMapPolygon[];
  autoFit?: boolean;
  loadMapLibreGl?: () => Promise<void>;
  style?: string | object;
  /** Override MapLibre worker URL (default `/maplibre/maplibre-gl-worker.mjs`). */
  workerUrl?: string;
  onRouteSelectionChange?: (route: PrismMapRoute | null) => void;
  onMapLoadError?: (message: string) => void;
};

export function PrismMapMaplibre({
  routes,
  polygons = [],
  autoFit = true,
  loadMapLibreGl,
  style = PRISM_MAP_MAPLIBRE_STYLE_DEFAULT,
  workerUrl,
  onRouteSelectionChange,
  onMapLoadError,
}: PrismMapMaplibreProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const maplibreRef = useRef<MapLibreModule | null>(null);
  const routesRef = useRef(routes);
  const polygonsRef = useRef(polygons);
  const autoFitRef = useRef(autoFit);
  const routesByIdRef = useRef(new Map<string, PrismMapRoute>());
  const onRouteSelectionRef = useRef(onRouteSelectionChange);
  const onMapLoadErrorRef = useRef(onMapLoadError);
  const mapLoadErrorReportedRef = useRef(false);
  const styleLoadedRef = useRef(false);
  const lastContentSigRef = useRef("");
  const [mapInstance, setMapInstance] = useState<
    import("maplibre-gl").Map | null
  >(null);

  useEffect(() => {
    routesRef.current = routes;
    polygonsRef.current = polygons;
    autoFitRef.current = autoFit;
    onRouteSelectionRef.current = onRouteSelectionChange;
    onMapLoadErrorRef.current = onMapLoadError;
  }, [routes, polygons, autoFit, onRouteSelectionChange, onMapLoadError]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    void (async () => {
      try {
        if (loadMapLibreGl) await loadMapLibreGl();
        const maplibregl = await import("maplibre-gl");
        maplibreRef.current = maplibregl;
        await import("maplibre-gl/dist/maplibre-gl.css");
        ensureMapLibreWorkerUrl(maplibregl, workerUrl);

        if (cancelled) return;

        const map = new maplibregl.Map({
          container: el,
          style: style as string | import("maplibre-gl").StyleSpecification,
          attributionControl: { compact: true },
        });
        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "top-right"
        );

        map.on("error", (event) => {
          if (cancelled || mapLoadErrorReportedRef.current) return;
          const err = event.error;
          const message =
            err instanceof Error
              ? err.message
              : typeof err === "string"
                ? err
                : "MapLibre map failed to load";
          // Tile/sprite/source faults after style load are common and non-fatal —
          // do not blank the map behind a permanent error overlay. Still surface
          // worker URL failures (they leave the basemap stuck on Natural Earth).
          if (
            styleLoadedRef.current &&
            !/Worker failed to load/i.test(message)
          ) {
            return;
          }
          mapLoadErrorReportedRef.current = true;
          onMapLoadErrorRef.current?.(message);
        });

        map.on("load", () => {
          if (cancelled) {
            map.remove();
            return;
          }
          styleLoadedRef.current = true;

          routesByIdRef.current.clear();
          for (const r of routesRef.current) {
            routesByIdRef.current.set(r.id, r);
          }

          const vectorMap = map as unknown as PrismMapVectorMap;
          addPrismMapVectorLayers(
            vectorMap,
            routesRef.current,
            polygonsRef.current,
            { includeEndpointLabels: false }
          );
          bindPrismMapRouteSelection(
            vectorMap,
            routesByIdRef.current,
            (route) => {
              onRouteSelectionRef.current?.(route);
            }
          );

          applyFit(
            map,
            maplibregl,
            routesRef.current,
            polygonsRef.current,
            autoFitRef.current
          );
          lastContentSigRef.current = prismMapVectorOverlaySignature(
            routesRef.current,
            polygonsRef.current
          );
          setMapInstance(map);
        });
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "MapLibre failed to load";
          onMapLoadErrorRef.current?.(message);
        }
      }
    })();

    return () => {
      cancelled = true;
      mapLoadErrorReportedRef.current = false;
      styleLoadedRef.current = false;
      lastContentSigRef.current = "";
      setMapInstance((prev) => {
        prev?.remove();
        return null;
      });
      maplibreRef.current = null;
    };
  }, [loadMapLibreGl, style, workerUrl]);

  useEffect(() => {
    if (!mapInstance?.loaded()) return;
    const maplibregl = maplibreRef.current;
    if (!maplibregl) return;

    routesByIdRef.current.clear();
    for (const r of routes) {
      routesByIdRef.current.set(r.id, r);
    }

    const sourcesUpdated = updatePrismMapVectorSources(
      mapInstance as unknown as PrismMapVectorMap,
      routes,
      polygons
    );
    if (!sourcesUpdated) return;

    if (routes.length === 0 && polygons.length === 0) {
      lastContentSigRef.current = "";
      return;
    }

    const sig = prismMapVectorOverlaySignature(routes, polygons);
    if (autoFit && sig !== lastContentSigRef.current) {
      lastContentSigRef.current = sig;
      applyFit(mapInstance, maplibregl, routes, polygons, autoFit);
    }
  }, [mapInstance, routes, polygons, autoFit]);

  return <div ref={containerRef} className="h-full w-full min-h-0 flex-1" />;
}
