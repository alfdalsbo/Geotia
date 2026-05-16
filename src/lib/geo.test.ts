import { describe, expect, it } from "vitest";

import { buildRoundMapSnapshot, haversineKm, parseGeoLocationJson } from "@/lib/geo";
import { players } from "@/lib/seed";
import type { GeoLocation } from "@/lib/types";

const vienna: GeoLocation = {
  lat: 48.2082,
  lon: 16.3738,
  label: "Wien, Østerrike",
  query: "Wien",
  country: "Østerrike",
  source: "nominatim",
};

const budapest: GeoLocation = {
  lat: 47.4979,
  lon: 19.0402,
  label: "Budapest, Ungarn",
  query: "Budapest",
  country: "Ungarn",
  source: "nominatim",
};

describe("SlowGeo geography", () => {
  it("rounds haversine kilometers predictably", () => {
    expect(haversineKm(vienna, vienna)).toBe(0);
    expect(haversineKm(vienna, budapest)).toBe(214);
  });

  it("keeps old or incomplete location JSON safe", () => {
    const streetViewLocation: GeoLocation = {
      lat: 43.8594,
      lon: 18.4312,
      label: "Baščaršija, Sarajevo",
      query: "sarajevo-bascarsija",
      country: "Bosnia-Hercegovina",
      source: "google_street_view",
    };

    expect(parseGeoLocationJson("")).toBeNull();
    expect(parseGeoLocationJson("{")).toBeNull();
    expect(parseGeoLocationJson(JSON.stringify({ lat: "48.2", lon: 16.3 }))).toBeNull();
    expect(parseGeoLocationJson(JSON.stringify(vienna))).toEqual(vienna);
    expect(parseGeoLocationJson(JSON.stringify(streetViewLocation))).toEqual(streetViewLocation);
  });

  it("builds map protocol data and respects manual distance overrides", () => {
    const snapshot = buildRoundMapSnapshot({
      answerLocation: vienna,
      players,
      results: [
        {
          playerId: "alf",
          status: "deltatt",
          actualKm: 999,
          guessText: "Budapest",
          guessLocation: budapest,
          distanceSource: "manual",
        },
        { playerId: "vegard", status: "ikke_deltatt", actualKm: null },
      ],
    });

    expect(snapshot?.markers).toHaveLength(2);
    expect(snapshot?.markers[0]).toMatchObject({ id: "answer", type: "answer" });
    expect(snapshot?.markers[1]).toMatchObject({
      id: "guess-alf",
      type: "guess",
      distanceKm: 999,
    });
  });
});
