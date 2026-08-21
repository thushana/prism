/// <reference types="google.maps" />

/**
 * Reference JSON styling for Prism Google maps (high contrast, labels off).
 * Not passed at runtime when a Map ID is set — recreate this palette in Cloud Console
 * on your {@link PRISM_MAP_GOOGLE_MAP_ID} / `GOOGLE_MAPS_MAP_ID`.
 */
export const PRISM_MAP_GOOGLE_GRAYSCALE_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
  /** Last: hide every basemap label (street names, POI names, transit text, admin, water). */
  {
    featureType: "all",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

/**
 * Default Map ID for {@link google.maps.marker.AdvancedMarkerElement}.
 * Override at runtime via {@link resolvePrismGoogleMapsMapId} (from the maps key endpoint).
 * Create a Cloud Map ID for production styling: https://developers.google.com/maps/documentation/javascript/map-ids
 */
export const PRISM_MAP_GOOGLE_MAP_ID = "DEMO_MAP_ID";

/** Default `Map` constructor options shared with {@link PRISM_MAP_GOOGLE_GRAYSCALE_STYLES}. */
export const PRISM_MAP_GOOGLE_ROADMAP_BASE: google.maps.MapOptions = {
  mapTypeId: "roadmap",
  disableDefaultUI: true,
  zoomControl: true,
  /** Re-enable after `disableDefaultUI` so users can leave north-up. */
  rotateControl: true,
  headingInteractionEnabled: true,
  tiltInteractionEnabled: true,
  gestureHandling: "greedy",
};

export const PRISM_MAP_MAPBOX_STYLE_DEFAULT =
  "mapbox://styles/mapbox/light-v11";
