/// <reference types="google.maps" />

/**
 * Grayscale basemap: street names + park labels only.
 *
 * House / parcel address numbers stay off (`administrative.land_parcel`) so
 * visit pins can show the only street numbers on the map.
 *
 * Reference palette for Cloud Console Map Styles — associate with
 * `GOOGLE_MAPS_MAP_ID`. Runtime `styles` cannot combine with a vector `mapId`
 * (required for Advanced Markers and Ctrl-drag heading).
 */
export const PRISM_MAP_GOOGLE_GRAYSCALE_STYLES: google.maps.MapTypeStyle[] = [
  /** Desaturate the whole basemap. */
  { stylers: [{ saturation: -100 }] },
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e0e0e0" }],
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
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },

  /** Hide every label / POI icon, then re-enable street names + parks only. */
  {
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  /** Basemap house numbers — visit pins supply the numbers we care about. */
  {
    featureType: "administrative.land_parcel",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },

  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }],
  },

  {
    featureType: "poi.park",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b6b6b" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.icon",
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
  /** Re-enable after `disableDefaultUI` — Shift-drag / control rotates heading. */
  rotateControl: true,
  headingInteractionEnabled: true,
  /** Keep the camera flat (no 3D tilt). */
  tiltInteractionEnabled: false,
  tilt: 0,
  /** Vector required for heading (DEMO or Cloud mapId). */
  renderingType: "VECTOR" as google.maps.RenderingType,
  gestureHandling: "greedy",
};

export const PRISM_MAP_MAPBOX_STYLE_DEFAULT =
  "mapbox://styles/mapbox/light-v11";
