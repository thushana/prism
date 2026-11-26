import { describe, expect, it } from "vitest";
import type { PrismMapPolygon, PrismMapRoute } from "./prism-map-types";
import {
  addPrismMapVectorLayers,
  bindPrismMapRouteSelection,
  collectPrismMapOverlayPositions,
  prismMapVectorOverlaySignature,
  updatePrismMapVectorSources,
  type PrismMapVectorFeature,
  type PrismMapVectorMap,
  type PrismMapVectorSource,
} from "./prism-map-vector-layers";

const ROUTE: PrismMapRoute = {
  id: "home",
  encodedPolyline: "_p~iF~ps|U",
  strokeColor: "#2563eb",
};

const POLYGON: PrismMapPolygon = {
  id: "place",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-122.4, 37.8],
        [-122.3, 37.8],
        [-122.3, 37.7],
        [-122.4, 37.8],
      ],
    ],
  },
};

function fakeMap() {
  const sources = new Map<string, { data: unknown }>();
  const layers: Record<string, unknown>[] = [];
  let clickListener:
    ((event: { point: { x: number; y: number } }) => void) | undefined;
  let rendered: PrismMapVectorFeature[] = [];

  const map: PrismMapVectorMap = {
    addSource(id, source) {
      sources.set(id, { data: source.data });
    },
    addLayer(layer) {
      layers.push(layer);
    },
    getSource(id): PrismMapVectorSource | undefined {
      const source = sources.get(id);
      if (!source) return undefined;
      return {
        setData(data) {
          source.data = data;
        },
      };
    },
    queryRenderedFeatures() {
      return rendered;
    },
    on(_event, listener) {
      clickListener = listener;
    },
  };

  return {
    map,
    sources,
    layers,
    click(features: PrismMapVectorFeature[]) {
      rendered = features;
      clickListener?.({ point: { x: 0, y: 0 } });
    },
  };
}

describe("prism map vector layers", () => {
  it("collects route and polygon positions as longitude, latitude", () => {
    expect(collectPrismMapOverlayPositions([ROUTE], [POLYGON])).toEqual([
      [-120.2, 38.5],
      [-122.4, 37.8],
      [-122.3, 37.8],
      [-122.3, 37.7],
      [-122.4, 37.8],
    ]);
  });

  it("changes the overlay signature when geometry changes", () => {
    const before = prismMapVectorOverlaySignature([ROUTE], []);
    const after = prismMapVectorOverlaySignature([ROUTE], [POLYGON]);
    expect(after).not.toBe(before);
  });

  it("adds endpoint labels only when asked", () => {
    const labeled = fakeMap();
    addPrismMapVectorLayers(labeled.map, [ROUTE], [POLYGON], {
      includeEndpointLabels: true,
    });
    const plain = fakeMap();
    addPrismMapVectorLayers(plain.map, [ROUTE], [POLYGON], {
      includeEndpointLabels: false,
    });

    expect(labeled.layers.map((layer) => layer.id)).toContain(
      "prism-map-endpoints-label"
    );
    expect(
      labeled.layers.find((layer) => layer.id === "prism-map-endpoints-circle")
    ).toMatchObject({
      layout: { "circle-sort-key": ["to-number", ["get", "stackOrder"]] },
    });
    expect(plain.layers.map((layer) => layer.id)).not.toContain(
      "prism-map-endpoints-label"
    );
    expect(
      plain.layers.find((layer) => layer.id === "prism-map-endpoints-circle")
    ).not.toHaveProperty("layout");
  });

  it("updates the three overlay sources and reports a missing route source", () => {
    const map = fakeMap();
    expect(updatePrismMapVectorSources(map.map, [ROUTE], [POLYGON])).toBe(
      false
    );
    addPrismMapVectorLayers(map.map, [], [], {
      includeEndpointLabels: false,
    });
    expect(updatePrismMapVectorSources(map.map, [ROUTE], [POLYGON])).toBe(true);
    expect(map.sources.get("prism-map-polygons")?.data).toMatchObject({
      type: "FeatureCollection",
    });
  });

  it("selects the clicked route and clears when the click misses", () => {
    const map = fakeMap();
    const selected: Array<PrismMapRoute | null> = [];
    bindPrismMapRouteSelection(
      map.map,
      new Map([[ROUTE.id, ROUTE]]),
      (route) => {
        selected.push(route);
      }
    );
    map.click([{ properties: { routeId: ROUTE.id } }]);
    map.click([]);
    map.click([{ properties: {} }]);
    expect(selected).toEqual([ROUTE, null]);
  });
});
