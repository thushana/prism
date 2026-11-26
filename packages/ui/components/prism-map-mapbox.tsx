"use client";

/**
 * Mapbox GL implementation for {@link PrismMap}. Loads `mapbox-gl` via dynamic `import()` so
 * bundles that only use Google never pay the Mapbox weight.
 */

import { useEffect, useRef, useState } from "react";
import { PRISM_MAP_MAPBOX_STYLE_DEFAULT } from "./prism-map-styles";
import type { PrismMapPolygon, PrismMapRoute } from "./prism-map-types";
import {
  addPrismMapVectorLayers,
  bindPrismMapRouteSelection,
  collectPrismMapOverlayPositions,
  prismMapVectorOverlaySignature,
  updatePrismMapVectorSources,
  type PrismMapVectorMap,
} from "./prism-map-vector-layers";

type MapboxModule = typeof import("mapbox-gl").default;

function padBoundsNE_SW(
  ne: [number, number],
  sw: [number, number],
  fraction: number
): [[number, number], [number, number]] {
  const latSpan = ne[1] - sw[1];
  const lngSpan = ne[0] - sw[0];
  const pLat = latSpan * fraction;
  const pLng = lngSpan * fraction;
  return [
    [sw[0] - pLng, sw[1] - pLat],
    [ne[0] + pLng, ne[1] + pLat],
  ];
}

function applyFitAndBounds(
  map: import("mapbox-gl").Map,
  mapboxgl: MapboxModule,
  routes: PrismMapRoute[],
  polygons: PrismMapPolygon[],
  autoFit: boolean
) {
  if (!autoFit) return;
  const positions = collectPrismMapOverlayPositions(routes, polygons);
  if (positions.length === 0) return;
  const bounds = new mapboxgl.LngLatBounds();
  for (const position of positions) {
    bounds.extend(position);
  }
  if (bounds.isEmpty()) return;
  const ne = bounds.getNorthEast().toArray() as [number, number];
  const sw = bounds.getSouthWest().toArray() as [number, number];
  const padded = padBoundsNE_SW(ne, sw, 0.15);
  map.fitBounds(bounds, { padding: 40, duration: 0 });
  map.setMaxBounds(padded);
}

export type PrismMapMapboxProps = {
  routes: PrismMapRoute[];
  polygons?: PrismMapPolygon[];
  autoFit?: boolean;
  loadMapboxGl?: () => Promise<void>;
  mapboxAccessToken: string | (() => Promise<string>);
  style?: string | object;
  mapboxExtra?: { projection?: object };
  onRouteSelectionChange?: (route: PrismMapRoute | null) => void;
  /** Fired when Mapbox GL fails to load the style or tiles (e.g. 403 token / URL restriction). */
  onMapLoadError?: (message: string) => void;
};

export function PrismMapMapbox({
  routes,
  polygons = [],
  autoFit = true,
  loadMapboxGl,
  mapboxAccessToken,
  style = PRISM_MAP_MAPBOX_STYLE_DEFAULT,
  mapboxExtra,
  onRouteSelectionChange,
  onMapLoadError,
}: PrismMapMapboxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapboxglRef = useRef<MapboxModule | null>(null);
  const routesRef = useRef(routes);
  const polygonsRef = useRef(polygons);
  const routesByIdRef = useRef(new Map<string, PrismMapRoute>());
  const onRouteSelectionRef = useRef(onRouteSelectionChange);
  const onMapLoadErrorRef = useRef(onMapLoadError);
  const mapLoadErrorReportedRef = useRef(false);
  const autoFitRef = useRef(autoFit);
  const lastGeometrySigRef = useRef<string>("");

  useEffect(() => {
    routesRef.current = routes;
    polygonsRef.current = polygons;
    autoFitRef.current = autoFit;
    onRouteSelectionRef.current = onRouteSelectionChange;
    onMapLoadErrorRef.current = onMapLoadError;
  }, [routes, polygons, autoFit, onRouteSelectionChange, onMapLoadError]);

  const [mapInstance, setMapInstance] = useState<
    import("mapbox-gl").Map | null
  >(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    void (async () => {
      if (loadMapboxGl) await loadMapboxGl();
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxglRef.current = mapboxgl;
      await import("mapbox-gl/dist/mapbox-gl.css");

      const token =
        typeof mapboxAccessToken === "function"
          ? await mapboxAccessToken()
          : mapboxAccessToken;
      mapboxgl.accessToken = token;

      if (cancelled) return;

      const map = new mapboxgl.Map({
        container: el,
        style: style as string | import("mapbox-gl").StyleSpecification,
        projection: mapboxExtra?.projection as
          import("mapbox-gl").ProjectionSpecification | undefined,
        attributionControl: false,
      }) as import("mapbox-gl").Map;

      map.on("error", (event) => {
        if (cancelled || mapLoadErrorReportedRef.current) return;
        const err = event.error;
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "string"
              ? err
              : "Mapbox map failed to load";
        mapLoadErrorReportedRef.current = true;
        onMapLoadErrorRef.current?.(message);
      });

      map.on("load", () => {
        if (cancelled) {
          map.remove();
          return;
        }
        routesByIdRef.current.clear();
        for (const r of routesRef.current) {
          routesByIdRef.current.set(r.id, r);
        }
        const vectorMap = map as unknown as PrismMapVectorMap;
        addPrismMapVectorLayers(
          vectorMap,
          routesRef.current,
          polygonsRef.current,
          { includeEndpointLabels: true }
        );
        bindPrismMapRouteSelection(
          vectorMap,
          routesByIdRef.current,
          (route) => {
            onRouteSelectionRef.current?.(route);
          }
        );
        applyFitAndBounds(
          map,
          mapboxgl,
          routesRef.current,
          polygonsRef.current,
          autoFitRef.current
        );
        lastGeometrySigRef.current = prismMapVectorOverlaySignature(
          routesRef.current,
          polygonsRef.current
        );
        setMapInstance(map);
      });
    })();

    return () => {
      cancelled = true;
      mapLoadErrorReportedRef.current = false;
      lastGeometrySigRef.current = "";
      setMapInstance((prev) => {
        prev?.remove();
        return null;
      });
      mapboxglRef.current = null;
    };
  }, [loadMapboxGl, mapboxAccessToken, style, mapboxExtra]);

  useEffect(() => {
    if (!mapInstance?.loaded()) return;
    const mapboxgl = mapboxglRef.current;
    if (!mapboxgl) return;
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
      lastGeometrySigRef.current = "";
      return;
    }

    const geometrySig = prismMapVectorOverlaySignature(routes, polygons);
    if (autoFit && geometrySig !== lastGeometrySigRef.current) {
      lastGeometrySigRef.current = geometrySig;
      applyFitAndBounds(mapInstance, mapboxgl, routes, polygons, autoFit);
    }
  }, [mapInstance, routes, polygons, autoFit]);

  return <div ref={containerRef} className="h-full w-full min-h-0 flex-1" />;
}
