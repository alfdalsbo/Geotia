import { describe, expect, it } from "vitest";

import { buildStreetViewPanoramaConfig, streetViewZoomFromFov } from "@/lib/streetview-panorama";
import {
  buildStreetViewImageUrl,
  buildStreetViewStaticCrop,
  buildStreetViewStaticCropUrl,
  buildStreetViewStaticCropUrlFromSource,
  maxScaleForStreetViewStaticFov,
  normalizeStreetViewStaticFov,
  streetViewStaticFovForZoom,
  STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE,
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

  it("builds a static crop with narrower fov and bounded heading or pitch", () => {
    expect(
      buildStreetViewStaticCrop({
        heading: 64,
        pitch: 1,
        fov: 90,
        zoom: 2,
        centerX: 1,
        centerY: 0,
      }),
    ).toMatchObject({
      zoom: 2,
      centerX: 1,
      centerY: 0,
      heading: 86.5,
      pitch: 1,
      fov: 45,
    });

    expect(
      buildStreetViewStaticCrop({
        heading: 64,
        pitch: 1,
        fov: 90,
        zoom: 2,
        centerX: -1,
        centerY: 0,
      }).heading,
    ).toBe(41.5);
    expect(
      buildStreetViewStaticCrop({
        heading: 64,
        pitch: 1,
        fov: 90,
        zoom: 2,
        centerX: 0,
        centerY: 1,
      }).pitch,
    ).toBe(23.5);
    expect(
      buildStreetViewStaticCrop({
        heading: 64,
        pitch: 1,
        fov: 90,
        zoom: 2,
        centerX: 0,
        centerY: -1,
      }).pitch,
    ).toBe(-21.5);
  });

  it("builds static crop urls with max Static API size and the crop view", () => {
    const crop = buildStreetViewStaticCrop({
      heading: 64,
      pitch: 1,
      fov: 90,
      zoom: 2,
      centerX: 1,
      centerY: 0,
    });
    const url = buildStreetViewStaticCropUrl({
      challenge,
      apiKey: "public-key",
      crop,
    });

    expect(url).not.toBeNull();
    const params = new URL(url ?? "").searchParams;
    expect(params.get("size")).toBe(STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE);
    expect(params.get("heading")).toBe("86.5");
    expect(params.get("pitch")).toBe("1");
    expect(params.get("fov")).toBe("45");

    const sourceUrl = buildStreetViewImageUrl({
      challenge,
      apiKey: "public-key",
      size: STREET_VIEW_STATIC_PREVIEW_IMAGE_SIZE,
    });
    const croppedSourceUrl = buildStreetViewStaticCropUrlFromSource({
      sourceUrl: sourceUrl ?? "",
      crop,
    });
    const sourceParams = new URL(croppedSourceUrl).searchParams;
    expect(sourceParams.get("size")).toBe(STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE);
    expect(sourceParams.get("heading")).toBe("86.5");
    expect(sourceParams.get("fov")).toBe("45");
  });

  it("clamps static crop fov before it invents more static detail", () => {
    expect(normalizeStreetViewStaticFov(200)).toBe(120);
    expect(streetViewStaticFovForZoom(60, 4)).toBe(20);
    expect(maxScaleForStreetViewStaticFov(60)).toBe(3);
    expect(
      buildStreetViewStaticCrop({
        heading: 64,
        pitch: 1,
        fov: 60,
        zoom: 4,
        centerX: 0,
        centerY: 0,
      }),
    ).toMatchObject({ zoom: 3, fov: 20 });
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
