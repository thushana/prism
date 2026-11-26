/**
 * Shared Mapbox GL / MapLibre overlay lifecycle for {@link PrismMap}.
 * Vendor files keep load, error policy, and fit. This module must not import
 * `mapbox-gl` or `maplibre-gl` — those stay behind each vendor's dynamic import.
 */

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
import type { PrismMapPolygon, PrismMapRoute } from "./prism-map-types";

const PRISM_MAP_ROUTES_SOURCE = "prism-map-routes";
const PRISM_MAP_ROUTES_LINE_LAYER = "prism-map-routes-line";
const PRISM_MAP_ENDPOINTS_SOURCE = "prism-map-endpoints";
const PRISM_MAP_ENDPOINTS_CIRCLE_LAYER = "prism-map-endpoints-circle";
const PRISM_MAP_ENDPOINTS_LABEL_LAYER = "prism-map-endpoints-label";
const PRISM_MAP_POLYGONS_SOURCE = "prism-map-polygons";
const PRISM_MAP_POLYGONS_FILL_LAYER = "prism-map-polygons-fill";
const PRISM_MAP_POLYGONS_LINE_LAYER = "prism-map-polygons-line";

export type PrismMapVectorSource = {
  setData(data: unknown): void;
};

export type PrismMapVectorFeature = {
  properties?: { routeId?: string } | null;
};

/** Structural slice both GL maps satisfy. Callers cast at the vendor boundary. */
export type PrismMapVectorMap = {
  addSource(id: string, source: { type: "geojson"; data: unknown }): void;
  addLayer(layer: Record<string, unknown>): void;
  getSource(id: string): PrismMapVectorSource | undefined;
  queryRenderedFeatures(
    point: { x: number; y: number },
    options: { layers: string[] }
  ): PrismMapVectorFeature[];
  on(
    event: "click",
    listener: (event: { point: { x: number; y: number } }) => void
  ): void;
};

export function prismMapVectorOverlaySignature(
  routes: PrismMapRoute[],
  polygons: PrismMapPolygon[]
): string {
  return mapOverlayContentSignature(
    routeGeometrySignatureParts(routes),
    polygons
  );
}

/** `[lng, lat]` positions used to build a vendor bounds object. */
export function collectPrismMapOverlayPositions(
  routes: PrismMapRoute[],
  polygons: PrismMapPolygon[]
): [number, number][] {
  const positions: [number, number][] = [];
  for (const route of routes) {
    for (const point of decodeEncodedPolyline(route.encodedPolyline)) {
      positions.push([point.lng, point.lat]);
    }
  }
  for (const polygon of polygons) {
    forEachPolygonPosition(polygon.geometry, (lng, lat) => {
      positions.push([lng, lat]);
    });
  }
  return positions;
}

export function addPrismMapVectorLayers(
  map: PrismMapVectorMap,
  routes: PrismMapRoute[],
  polygons: PrismMapPolygon[],
  options: { includeEndpointLabels: boolean }
): void {
  map.addSource(PRISM_MAP_ROUTES_SOURCE, {
    type: "geojson",
    data: buildRouteLineFeatureCollection(routes),
  });
  map.addLayer({
    id: PRISM_MAP_ROUTES_LINE_LAYER,
    type: "line",
    source: PRISM_MAP_ROUTES_SOURCE,
    layout: {
      "line-sort-key": ["to-number", ["get", "stackOrder"]],
    },
    paint: {
      "line-color": ["get", "strokeColor"],
      "line-opacity": ["get", "strokeOpacity"],
      "line-width": ["get", "strokeWeight"],
    },
  });

  map.addSource(PRISM_MAP_ENDPOINTS_SOURCE, {
    type: "geojson",
    data: buildRouteEndpointFeatureCollection(routes),
  });
  map.addLayer({
    id: PRISM_MAP_ENDPOINTS_CIRCLE_LAYER,
    type: "circle",
    source: PRISM_MAP_ENDPOINTS_SOURCE,
    ...(options.includeEndpointLabels
      ? {
          layout: {
            "circle-sort-key": ["to-number", ["get", "stackOrder"]],
          },
        }
      : {}),
    paint: {
      "circle-color": ["get", "fillColor"],
      "circle-opacity": ["get", "fillOpacity"],
      "circle-radius": 7,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  });

  if (options.includeEndpointLabels) {
    map.addLayer({
      id: PRISM_MAP_ENDPOINTS_LABEL_LAYER,
      type: "symbol",
      source: PRISM_MAP_ENDPOINTS_SOURCE,
      layout: {
        "symbol-sort-key": ["to-number", ["get", "stackOrder"]],
        "text-field": ["get", "label"],
        "text-size": 11,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });
  }

  map.addSource(PRISM_MAP_POLYGONS_SOURCE, {
    type: "geojson",
    data: buildPolygonFeatureCollection(polygons),
  });
  map.addLayer({
    id: PRISM_MAP_POLYGONS_FILL_LAYER,
    type: "fill",
    source: PRISM_MAP_POLYGONS_SOURCE,
    paint: {
      "fill-color": ["get", "fillColor"],
      "fill-opacity": ["get", "fillOpacity"],
    },
  });
  map.addLayer({
    id: PRISM_MAP_POLYGONS_LINE_LAYER,
    type: "line",
    source: PRISM_MAP_POLYGONS_SOURCE,
    paint: {
      "line-color": ["get", "strokeColor"],
      "line-opacity": ["get", "strokeOpacity"],
      "line-width": ["get", "strokeWeight"],
    },
  });
}

/** Returns false when the route source is not on the map yet. */
export function updatePrismMapVectorSources(
  map: PrismMapVectorMap,
  routes: PrismMapRoute[],
  polygons: PrismMapPolygon[]
): boolean {
  const routeSource = map.getSource(PRISM_MAP_ROUTES_SOURCE);
  if (!routeSource) return false;
  routeSource.setData(buildRouteLineFeatureCollection(routes));
  map
    .getSource(PRISM_MAP_ENDPOINTS_SOURCE)
    ?.setData(buildRouteEndpointFeatureCollection(routes));
  map
    .getSource(PRISM_MAP_POLYGONS_SOURCE)
    ?.setData(buildPolygonFeatureCollection(polygons));
  return true;
}

export function bindPrismMapRouteSelection(
  map: PrismMapVectorMap,
  routesById: { get(id: string): PrismMapRoute | undefined },
  notify: (route: PrismMapRoute | null) => void
): void {
  map.on("click", (event) => {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [PRISM_MAP_ROUTES_LINE_LAYER],
    });
    if (features.length === 0) {
      notify(null);
      return;
    }
    const routeId = features[0]?.properties?.routeId;
    if (routeId === undefined) return;
    const route = routesById.get(routeId);
    if (route) notify(route);
  });
}
