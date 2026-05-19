"use client";

/**
 * Mapbox GL implementation for {@link PrismMap}. Loads `mapbox-gl` via dynamic `import()` so
 * bundles that only use Google never pay the Mapbox weight.
 */

import { useEffect, useRef, useState } from "react";
import { decodeEncodedPolyline } from "../source/polyline-decode";
import { PRISM_MAP_MAPBOX_STYLE_DEFAULT } from "./prism-map-styles";
import type { PrismMapRoute } from "./prism-map-types";

type MapboxModule = typeof import("mapbox-gl").default;

type RouteFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    properties: {
      strokeColor: string;
      strokeOpacity: number;
      strokeWeight: number;
      stackOrder: number;
      routeId: string;
    };
    geometry: { type: "LineString"; coordinates: [number, number][] };
  }>;
};

function buildRouteFeatureCollection(
  routes: PrismMapRoute[]
): RouteFeatureCollection {
  const features: RouteFeatureCollection["features"] = [];
  for (const r of routes) {
    const coords = decodeEncodedPolyline(r.encodedPolyline).map(
      (p) => [p.lng, p.lat] as [number, number]
    );
    if (coords.length < 2) continue;
    features.push({
      type: "Feature",
      id: r.id,
      properties: {
        strokeColor: r.strokeColor,
        strokeOpacity: r.strokeOpacity ?? 0.2,
        strokeWeight: r.strokeWeight ?? 3,
        stackOrder: r.stackOrder ?? 0,
        routeId: r.id,
      },
      geometry: { type: "LineString", coordinates: coords },
    });
  }
  return { type: "FeatureCollection", features };
}

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
  autoFit: boolean
) {
  if (!autoFit || routes.length === 0) return;
  const bounds = new mapboxgl.LngLatBounds();
  for (const r of routes) {
    for (const p of decodeEncodedPolyline(r.encodedPolyline)) {
      bounds.extend([p.lng, p.lat]);
    }
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
  autoFit?: boolean;
  loadMapboxGl?: () => Promise<void>;
  mapboxAccessToken: string | (() => Promise<string>);
  style?: string | object;
  mapboxExtra?: { projection?: object };
  onRouteSelectionChange?: (route: PrismMapRoute | null) => void;
  /** Fired when Mapbox GL fails to load the style or tiles (e.g. 403 token / URL restriction). */
  onMapLoadError?: (message: string) => void;
};

function routesGeometrySignature(routes: PrismMapRoute[]): string {
  return routes.map((r) => `${r.id}\n${r.encodedPolyline}`).join("\u0001");
}

export function PrismMapMapbox({
  routes,
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
  const routesByIdRef = useRef(new Map<string, PrismMapRoute>());
  const onRouteSelectionRef = useRef(onRouteSelectionChange);
  onRouteSelectionRef.current = onRouteSelectionChange;
  const onMapLoadErrorRef = useRef(onMapLoadError);
  onMapLoadErrorRef.current = onMapLoadError;
  const mapLoadErrorReportedRef = useRef(false);
  const autoFitRef = useRef(autoFit);
  const lastGeometrySigRef = useRef<string>("");
  routesRef.current = routes;
  autoFitRef.current = autoFit;

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
          | import("mapbox-gl").ProjectionSpecification
          | undefined,
        attributionControl: false,
      });

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
        const data = buildRouteFeatureCollection(routesRef.current);
        map.addSource("prism-map-routes", {
          type: "geojson",
          data,
        });
        map.addLayer({
          id: "prism-map-routes-line",
          type: "line",
          source: "prism-map-routes",
          layout: {
            "line-sort-key": ["to-number", ["get", "stackOrder"]],
          },
          paint: {
            "line-color": ["get", "strokeColor"],
            "line-opacity": ["get", "strokeOpacity"],
            "line-width": ["get", "strokeWeight"],
          },
        });
        map.on("click", (e) => {
          const feats = map.queryRenderedFeatures(e.point, {
            layers: ["prism-map-routes-line"],
          });
          if (feats.length === 0) {
            onRouteSelectionRef.current?.(null);
            return;
          }
          const feat = feats[0]!;
          const routeId = (feat.properties as { routeId?: string } | null)
            ?.routeId;
          if (routeId === undefined) return;
          const r = routesByIdRef.current.get(routeId);
          if (r) onRouteSelectionRef.current?.(r);
        });
        applyFitAndBounds(map, mapboxgl, routesRef.current, autoFitRef.current);
        lastGeometrySigRef.current = routesGeometrySignature(routesRef.current);
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
    const src = mapInstance.getSource("prism-map-routes") as
      | import("mapbox-gl").GeoJSONSource
      | undefined;
    if (!src) return;

    routesByIdRef.current.clear();
    for (const r of routes) {
      routesByIdRef.current.set(r.id, r);
    }

    src.setData(buildRouteFeatureCollection(routes));

    if (routes.length === 0) {
      lastGeometrySigRef.current = "";
      return;
    }

    const geometrySig = routesGeometrySignature(routes);
    if (autoFit && geometrySig !== lastGeometrySigRef.current) {
      lastGeometrySigRef.current = geometrySig;
      applyFitAndBounds(mapInstance, mapboxgl, routes, autoFit);
    }
  }, [mapInstance, routes, autoFit]);

  return <div ref={containerRef} className="h-full w-full min-h-0 flex-1" />;
}
