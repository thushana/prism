"use client";

/**
 * Google Maps implementation for {@link PrismMap}.
 * Vendor-only options belong in `google.*` on the parent; this component only receives the merged result.
 *
 * Map bootstrap runs once; route updates patch existing {@link google.maps.Polyline} instances by `id`
 * and only re-`fitBounds` when encoded geometry changes (avoids full “redraw” on stroke-only updates).
 */

/// <reference types="google.maps" />

import { useEffect, useRef, useState } from "react";
import { decodeEncodedPolyline } from "../source/polyline-decode";
import {
  createGoogleRouteEndpointMarker,
  detachGoogleAdvancedMarker,
  updateGoogleRouteEndpointMarker,
  type GoogleAdvancedMarker,
} from "./prism-map-google-markers";
import {
  resolvePrismGoogleMapsOptions,
  applyPrismGoogleMapsBasemapStyle,
} from "./prism-map-loaders";
import {
  ROUTE_ENDPOINT_LABEL,
  collectMapEndpointMarkers,
  routeGeometrySignatureParts,
} from "./prism-map-endpoints";
import {
  buildPolygonFeatureCollection,
  forEachPolygonPosition,
  mapOverlayContentSignature,
} from "./prism-map-polygons";
import type { PrismMapPolygon, PrismMapRoute } from "./prism-map-types";

function padLatLngBounds(
  bounds: google.maps.LatLngBounds,
  fraction: number
): google.maps.LatLngBounds {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const latSpan = ne.lat() - sw.lat();
  const lngSpan = ne.lng() - sw.lng();
  const padLat = latSpan * fraction;
  const padLng = lngSpan * fraction;
  return new google.maps.LatLngBounds(
    new google.maps.LatLng(sw.lat() - padLat, sw.lng() - padLng),
    new google.maps.LatLng(ne.lat() + padLat, ne.lng() + padLng)
  );
}

function contentSignature(
  routes: PrismMapRoute[],
  polygons: PrismMapPolygon[]
) {
  return mapOverlayContentSignature(
    routeGeometrySignatureParts(routes),
    polygons
  );
}

/**
 * Compare an existing polyline path to a candidate. When Maps JS is blocked
 * (`ApiTargetBlockedMapError`), `getPath()` can throw internally on `getAt` —
 * treat that as “not the same” and fall through to `setPath`.
 */
function polylinePathMatches(
  poly: google.maps.Polyline,
  path: google.maps.LatLng[]
): boolean {
  try {
    const prevPath = poly.getPath();
    if (!prevPath || typeof prevPath.getLength !== "function") return false;
    if (prevPath.getLength() !== path.length) return false;
    for (let i = 0; i < path.length; i += 1) {
      const a = prevPath.getAt(i);
      const b = path[i]!;
      if (!a || a.lat() !== b.lat() || a.lng() !== b.lng()) return false;
    }
    return true;
  } catch {
    return false;
  }
}

const GOOGLE_MAPS_BLOCKED_MESSAGE =
  "Google Maps is blocked for this API key on this host (ApiTargetBlockedMapError). Set GOOGLE_MAPS_WEB_KEY with Maps JavaScript API enabled, and allow this origin in HTTP referrer restrictions (e.g. http://timetraveler.localhost:3800/*).";

export type PrismMapGoogleProps = {
  routes: PrismMapRoute[];
  polygons?: PrismMapPolygon[];
  autoFit?: boolean;
  loadGoogleMaps: () => Promise<void>;
  mapOptions?: google.maps.MapOptions;
  onRouteSelectionChange?: (route: PrismMapRoute | null) => void;
};

export function PrismMapGoogle({
  routes,
  polygons = [],
  autoFit = true,
  loadGoogleMaps,
  mapOptions,
  onRouteSelectionChange,
}: PrismMapGoogleProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylineByRouteIdRef = useRef<Map<string, google.maps.Polyline>>(
    new Map()
  );
  const markerByKeyRef = useRef<Map<string, GoogleAdvancedMarker>>(new Map());
  const dataLayerRef = useRef<google.maps.Data | null>(null);
  const routesByIdRef = useRef<Map<string, PrismMapRoute>>(new Map());
  const onRouteSelectionRef = useRef(onRouteSelectionChange);
  const lastGeometrySigRef = useRef<string>("");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onRouteSelectionRef.current = onRouteSelectionChange;
  }, [onRouteSelectionChange]);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  // Bootstrap map once; do not depend on `routes` (hover restyles must not re-run this).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    const mapsWindow = window as Window & {
      gm_authFailure?: () => void;
    };
    const previousAuthFailure = mapsWindow.gm_authFailure;
    mapsWindow.gm_authFailure = () => {
      if (cancelled) return;
      setBootstrapError(GOOGLE_MAPS_BLOCKED_MESSAGE);
      setMapReady(false);
    };

    void (async () => {
      try {
        setBootstrapError(null);
        await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;

        const mapInitOptions = resolvePrismGoogleMapsOptions(mapOptions);

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(
            containerRef.current,
            mapInitOptions
          );
          applyPrismGoogleMapsBasemapStyle(mapRef.current);
          dataLayerRef.current = new google.maps.Data({ map: mapRef.current });
          mapRef.current.addListener("click", () => {
            onRouteSelectionRef.current?.(null);
          });
        } else {
          mapRef.current.setOptions(mapInitOptions);
          if (!dataLayerRef.current) {
            dataLayerRef.current = new google.maps.Data({
              map: mapRef.current,
            });
          }
        }

        setMapReady(true);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled || !mapRef.current) return;
            google.maps.event.trigger(mapRef.current, "resize");
          });
        });
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof Error ? e.message : "Google Maps failed to load";
          setBootstrapError(message);
        }
      }
    })();

    return () => {
      cancelled = true;
      mapsWindow.gm_authFailure = previousAuthFailure;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- read latest Maps at unmount (not DOM refs)
      const polys = polylineByRouteIdRef.current;
      polys.forEach((p) => p.setMap(null));
      polys.clear();
      // eslint-disable-next-line react-hooks/exhaustive-deps -- read latest marker Map at unmount
      const markers = markerByKeyRef.current;
      markers.forEach((marker) => detachGoogleAdvancedMarker(marker));
      markers.clear();
      dataLayerRef.current?.setMap(null);
      dataLayerRef.current = null;
      lastGeometrySigRef.current = "";
      const map = mapRef.current;
      mapRef.current = null;
      if (map && typeof google !== "undefined" && google.maps?.event) {
        google.maps.event.clearInstanceListeners(map);
      }
      setMapReady(false);
    };
  }, [loadGoogleMaps, mapOptions]);

  // Patch polylines / polygons in place; fit camera only when geometry changes.
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    try {
      const polys = polylineByRouteIdRef.current;
      const markers = markerByKeyRef.current;
      const nextIds = new Set<string>();
      const nextMarkerKeys = new Set<string>();

      routesByIdRef.current.clear();
      for (const r of routes) {
        routesByIdRef.current.set(r.id, r);
      }

      const dataLayer = dataLayerRef.current;
      if (dataLayer) {
        dataLayer.forEach((feature) => {
          dataLayer.remove(feature);
        });
        const collection = buildPolygonFeatureCollection(polygons);
        dataLayer.addGeoJson(collection as unknown as object);
        dataLayer.setStyle((feature) => {
          const fillColor = String(
            feature.getProperty("fillColor") ?? "#2563eb"
          );
          const fillOpacity = Number(
            feature.getProperty("fillOpacity") ?? 0.28
          );
          const strokeColor = String(
            feature.getProperty("strokeColor") ?? fillColor
          );
          const strokeOpacity = Number(
            feature.getProperty("strokeOpacity") ?? 0.9
          );
          const strokeWeight = Number(
            feature.getProperty("strokeWeight") ?? 2
          );
          return {
            fillColor,
            fillOpacity,
            strokeColor,
            strokeOpacity,
            strokeWeight,
          };
        });
      }

      for (const route of routes) {
        const path = decodeEncodedPolyline(route.encodedPolyline).map(
          ({ lat, lng }) => new google.maps.LatLng(lat, lng)
        );
        if (path.length === 0) continue;

        nextIds.add(route.id);
        let poly = polys.get(route.id);
        const z = route.stackOrder ?? 0;
        if (!poly) {
          poly = new google.maps.Polyline({
            path,
            strokeColor: route.strokeColor,
            strokeOpacity: route.strokeOpacity ?? 0.2,
            strokeWeight: route.strokeWeight ?? 3,
            geodesic: true,
            zIndex: z,
            clickable: true,
            map,
          });
          const routeId = route.id;
          poly.addListener("click", () => {
            const picked = routesByIdRef.current.get(routeId);
            if (picked) onRouteSelectionRef.current?.(picked);
          });
          polys.set(route.id, poly);
        } else {
          poly.setOptions({
            strokeColor: route.strokeColor,
            strokeOpacity: route.strokeOpacity ?? 0.2,
            strokeWeight: route.strokeWeight ?? 3,
            geodesic: true,
            zIndex: z,
          });
          if (!polylinePathMatches(poly, path)) {
            poly.setPath(path);
          }
        }
      }

      for (const endpoint of collectMapEndpointMarkers(routes)) {
        nextMarkerKeys.add(endpoint.id);
        let marker = markers.get(endpoint.id);
        const label = ROUTE_ENDPOINT_LABEL[endpoint.kind];
        const position = {
          lat: endpoint.position.lat,
          lng: endpoint.position.lng,
        };
        if (!marker) {
          marker = createGoogleRouteEndpointMarker({
            map,
            position,
            label,
            fillColor: endpoint.fillColor,
            fillOpacity: endpoint.fillOpacity,
            zIndex: endpoint.stackOrder,
          });
          markers.set(endpoint.id, marker);
        } else {
          updateGoogleRouteEndpointMarker(marker, {
            position,
            label,
            fillColor: endpoint.fillColor,
            fillOpacity: endpoint.fillOpacity,
            zIndex: endpoint.stackOrder,
          });
        }
      }

      for (const [key, marker] of [...markers.entries()]) {
        if (!nextMarkerKeys.has(key)) {
          detachGoogleAdvancedMarker(marker);
          markers.delete(key);
        }
      }

      for (const [id, poly] of [...polys.entries()]) {
        if (!nextIds.has(id)) {
          poly.setMap(null);
          polys.delete(id);
        }
      }

      if (routes.length === 0 && polygons.length === 0) {
        lastGeometrySigRef.current = "";
        return;
      }

      const geometrySig = contentSignature(routes, polygons);
      if (
        autoFit &&
        geometrySig.length > 0 &&
        geometrySig !== lastGeometrySigRef.current
      ) {
        lastGeometrySigRef.current = geometrySig;
        const bounds = new google.maps.LatLngBounds();
        for (const route of routes) {
          for (const pt of decodeEncodedPolyline(route.encodedPolyline)) {
            bounds.extend(new google.maps.LatLng(pt.lat, pt.lng));
          }
        }
        for (const polygon of polygons) {
          forEachPolygonPosition(polygon.geometry, (lng, lat) => {
            bounds.extend(new google.maps.LatLng(lat, lng));
          });
        }
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds);
          const padded = padLatLngBounds(bounds, 0.15);
          map.setOptions({
            restriction: { latLngBounds: padded, strictBounds: false },
          });
        }
      }
    } catch (e) {
      const message =
        e instanceof Error && /getAt|getPath/i.test(e.message)
          ? GOOGLE_MAPS_BLOCKED_MESSAGE
          : e instanceof Error
            ? e.message
            : "Google Maps overlay update failed";
      setBootstrapError(message);
    }
  }, [routes, polygons, autoFit, mapReady]);

  return (
    <div className="relative h-full w-full min-h-0 flex-1">
      {bootstrapError ? (
        <div className="bg-destructive/10 text-destructive absolute inset-0 z-20 flex items-center justify-center p-4 text-center text-sm">
          {bootstrapError}
        </div>
      ) : null}
      <div ref={containerRef} className="h-full w-full min-h-0" />
    </div>
  );
}
