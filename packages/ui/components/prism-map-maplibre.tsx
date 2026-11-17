"use client";

/**
 * MapLibre GL implementation for {@link PrismMap}. Loads `maplibre-gl` via dynamic `import()`
 * so bundles that only use Google/Mapbox never pay the MapLibre weight.
 *
 * Supports peer `routes` (encoded polylines) and `polygons` (GeoJSON Polygon / MultiPolygon).
 */

import { useEffect, useRef, useState } from "react";
import { decodeEncodedPolyline } from "../source/polyline-decode";
import {
  buildRouteEndpointFeatureCollection,
  buildRouteLineFeatureCollection,
  routeGeometrySignatureParts,
} from "./prism-map-endpoints";
import {
  buildPolygonFeatureCollection,
  forEachPolygonPosition,
  mapOverlayContentSignature,
} from "./prism-map-polygons";
import { PRISM_MAP_MAPLIBRE_STYLE_DEFAULT } from "./prism-map-styles";
import type { PrismMapPolygon, PrismMapRoute } from "./prism-map-types";

type MapLibreModule = typeof import("maplibre-gl");

function contentSignature(
  routes: PrismMapRoute[],
  polygons: PrismMapPolygon[]
) {
  return mapOverlayContentSignature(
    routeGeometrySignatureParts(routes),
    polygons
  );
}

function applyFit(
  map: import("maplibre-gl").Map,
  maplibregl: MapLibreModule,
  routes: PrismMapRoute[],
  polygons: PrismMapPolygon[],
  autoFit: boolean
) {
  if (!autoFit) return;
  if (routes.length === 0 && polygons.length === 0) return;
  const bounds = new maplibregl.LngLatBounds();
  for (const r of routes) {
    for (const p of decodeEncodedPolyline(r.encodedPolyline)) {
      bounds.extend([p.lng, p.lat]);
    }
  }
  for (const polygon of polygons) {
    forEachPolygonPosition(polygon.geometry, (lng, lat) => {
      bounds.extend([lng, lat]);
    });
  }
  if (bounds.isEmpty()) return;
  map.fitBounds(bounds, { padding: 40, duration: 0, maxZoom: 14 });
}

export type PrismMapMaplibreProps = {
  routes: PrismMapRoute[];
  polygons?: PrismMapPolygon[];
  autoFit?: boolean;
  loadMapLibreGl?: () => Promise<void>;
  style?: string | object;
  onRouteSelectionChange?: (route: PrismMapRoute | null) => void;
  onMapLoadError?: (message: string) => void;
};

export function PrismMapMaplibre({
  routes,
  polygons = [],
  autoFit = true,
  loadMapLibreGl,
  style = PRISM_MAP_MAPLIBRE_STYLE_DEFAULT,
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

        map.on("error", () => {
          if (cancelled || mapLoadErrorReportedRef.current) return;
          mapLoadErrorReportedRef.current = true;
          onMapLoadErrorRef.current?.("MapLibre map failed to load");
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

          map.addSource("prism-map-routes", {
            type: "geojson",
            data: buildRouteLineFeatureCollection(routesRef.current),
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

          map.addSource("prism-map-endpoints", {
            type: "geojson",
            data: buildRouteEndpointFeatureCollection(routesRef.current),
          });
          map.addLayer({
            id: "prism-map-endpoints-circle",
            type: "circle",
            source: "prism-map-endpoints",
            paint: {
              "circle-color": ["get", "fillColor"],
              "circle-opacity": ["get", "fillOpacity"],
              "circle-radius": 7,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });

          map.addSource("prism-map-polygons", {
            type: "geojson",
            data: buildPolygonFeatureCollection(polygonsRef.current),
          });
          map.addLayer({
            id: "prism-map-polygons-fill",
            type: "fill",
            source: "prism-map-polygons",
            paint: {
              "fill-color": ["get", "fillColor"],
              "fill-opacity": ["get", "fillOpacity"],
            },
          });
          map.addLayer({
            id: "prism-map-polygons-line",
            type: "line",
            source: "prism-map-polygons",
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
            const routeId = (
              feats[0] as { properties?: { routeId?: string } | null }
            ).properties?.routeId;
            if (routeId === undefined) return;
            const r = routesByIdRef.current.get(routeId);
            if (r) onRouteSelectionRef.current?.(r);
          });

          applyFit(
            map,
            maplibregl,
            routesRef.current,
            polygonsRef.current,
            autoFitRef.current
          );
          lastContentSigRef.current = contentSignature(
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
      lastContentSigRef.current = "";
      setMapInstance((prev) => {
        prev?.remove();
        return null;
      });
      maplibreRef.current = null;
    };
  }, [loadMapLibreGl, style]);

  useEffect(() => {
    if (!mapInstance?.loaded()) return;
    const maplibregl = maplibreRef.current;
    if (!maplibregl) return;

    const routeSrc = mapInstance.getSource("prism-map-routes") as
      import("maplibre-gl").GeoJSONSource | undefined;
    const endpointSrc = mapInstance.getSource("prism-map-endpoints") as
      import("maplibre-gl").GeoJSONSource | undefined;
    const polygonSrc = mapInstance.getSource("prism-map-polygons") as
      import("maplibre-gl").GeoJSONSource | undefined;

    routesByIdRef.current.clear();
    for (const r of routes) {
      routesByIdRef.current.set(r.id, r);
    }

    routeSrc?.setData(buildRouteLineFeatureCollection(routes));
    endpointSrc?.setData(buildRouteEndpointFeatureCollection(routes));
    polygonSrc?.setData(buildPolygonFeatureCollection(polygons));

    if (routes.length === 0 && polygons.length === 0) {
      lastContentSigRef.current = "";
      return;
    }

    const sig = contentSignature(routes, polygons);
    if (autoFit && sig !== lastContentSigRef.current) {
      lastContentSigRef.current = sig;
      applyFit(mapInstance, maplibregl, routes, polygons, autoFit);
    }
  }, [mapInstance, routes, polygons, autoFit]);

  return <div ref={containerRef} className="h-full w-full min-h-0 flex-1" />;
}
