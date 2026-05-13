/// <reference types="google.maps" />

/**
 * Neutral roadmap styling for Prism map shells (high contrast with route overlays).
 * All textual basemap labels are hidden so route polylines stay the readable foreground.
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

/** Default `Map` constructor options shared with {@link PRISM_MAP_GOOGLE_GRAYSCALE_STYLES}. */
export const PRISM_MAP_GOOGLE_ROADMAP_BASE: google.maps.MapOptions = {
  mapTypeId: "roadmap",
  disableDefaultUI: true,
  zoomControl: true,
  gestureHandling: "greedy",
};

export const PRISM_MAP_MAPBOX_STYLE_DEFAULT =
  "mapbox://styles/mapbox/light-v11";
