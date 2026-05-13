import { describe, expect, it } from "vitest";
import { decodeEncodedPolyline } from "./polyline-decode";

describe("decodeEncodedPolyline", () => {
  it("returns empty array for empty input", () => {
    expect(decodeEncodedPolyline("")).toEqual([]);
  });

  it("decodes the canonical Google example polyline", () => {
    // `_p~iF~ps|U` → ~38.5, -120.2 (see Google polyline docs)
    expect(decodeEncodedPolyline("_p~iF~ps|U")).toEqual([
      { lat: 38.5, lng: -120.2 },
    ]);
  });
});
