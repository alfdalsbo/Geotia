import { describe, expect, it } from "vitest";

import { buildStreetViewPanoramaConfig, streetViewZoomFromFov } from "@/lib/streetview-panorama";
import {
  buildStreetViewImageUrl,
  buildStreetViewStaticZoomImages,
  normalizeStreetViewStaticFov,
  streetViewStaticFovForZoom,
  STREET_VIEW_STATIC_IMAGE_SIZE,
  STREET_VIEW_STATIC_PREVIEW_IMAGE_SIZE,
} from "@/lib/streetview-url";
import type { SlowGeoChallenge } from "@/lib/types";

const challenge: SlowGeoChallenge = {
  id: "challenge-1",
  candidateId: "test-candidate",
  source: "google_street_view",
  lat: 59.9127,
  lon: 10.7461,
  label: "Oslo",
  country: "Norge",
  continent: "Europa",
  heading: 64,
  pitch: 1,
  fov: 90,
  panoId: "test-pano",
  createdAt: "2026-05-17T10:00:00.000Z",
};

describe("Street View display helpers", () => {
  it("uses the safe Static API image size by default", () => {
    const url = buildStreetViewImageUrl({ challenge, apiKey: "public-key" });

    expect(url).toContain(`size=${STREET_VIEW_STATIC_IMAGE_SIZE}`);
    expect(url).toContain("pano=test-pano");
  });

  it("keeps explicit Static API sizes when a caller needs one", () => {
    const url = buildStreetViewImageUrl({
      challenge,
      apiKey: "public-key",
      size: STREET_VIEW_STATIC_PREVIEW_IMAGE_SIZE,
    });

    expect(url).toContain(`size=${STREET_VIEW_STATIC_PREVIEW_IMAGE_SIZE}`);
  });

  it("builds static zoom variants with narrower fov and max Static API size", () => {
    const variants = buildStreetViewStaticZoomImages({
      challenge,
      apiKey: "public-key",
    });

    expect(variants.map((variant) => variant.scale)).toEqual([1, 1.5, 2, 3, 4]);
    expect(variants.map((variant) => variant.fov)).toEqual([90, 60, 45, 30, 22.5]);
    expect(variants.every((variant) => variant.src.includes(`size=${STREET_VIEW_STATIC_IMAGE_SIZE}`))).toBe(true);
    expect(variants[1].src).toContain("fov=60");
  });

  it("clamps static zoom fov before it invents more static detail", () => {
    expect(normalizeStreetViewStaticFov(200)).toBe(120);
    expect(streetViewStaticFovForZoom(60, 4)).toBe(20);
    expect(
      buildStreetViewStaticZoomImages({
        challenge: { ...challenge, fov: 60 },
        apiKey: "public-key",
        zoomFactors: [1, 2, 3, 4],
      }).map((variant) => variant.scale),
    ).toEqual([1, 2, 3]);
  });

  it("maps Static API fov to an equivalent Street View panorama zoom", () => {
    expect(streetViewZoomFromFov(90)).toBeCloseTo(1);
    expect(streetViewZoomFromFov(45)).toBeCloseTo(2);
    expect(streetViewZoomFromFov(0)).toBe(1);
  });

  it("builds panorama config from a pano id and blocks open-round location fallback", () => {
    expect(
      buildStreetViewPanoramaConfig({
        challenge,
        apiKey: "public-key",
      }),
    ).toMatchObject({
      apiKey: "public-key",
      panoId: "test-pano",
      position: { lat: 59.9127, lng: 10.7461 },
      pov: { heading: 64, pitch: 1 },
      initialZoom: 1,
    });

    expect(
      buildStreetViewPanoramaConfig({
        challenge: { ...challenge, panoId: undefined },
        apiKey: "public-key",
      }),
    ).toBeNull();
  });

  it("allows location fallback for revealed rounds", () => {
    expect(
      buildStreetViewPanoramaConfig({
        challenge: { ...challenge, panoId: undefined },
        apiKey: "public-key",
        allowLocationFallback: true,
      }),
    ).toMatchObject({
      panoId: undefined,
      position: { lat: 59.9127, lng: 10.7461 },
    });
  });
});
