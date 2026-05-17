import type { SlowGeoChallenge } from "@/lib/types";

export type SlowGeoStreetViewPanoramaConfig = {
  apiKey: string;
  panoId?: string;
  position: {
    lat: number;
    lng: number;
  };
  pov: {
    heading: number;
    pitch: number;
  };
  fov: number;
  initialZoom: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function streetViewZoomFromFov(fov: number) {
  if (!Number.isFinite(fov) || fov <= 0) return 1;

  return clamp(Math.log2(180 / clamp(fov, 20, 120)), 0, 4);
}

export function buildStreetViewPanoramaConfig({
  challenge,
  apiKey,
  allowLocationFallback = false,
}: {
  challenge: SlowGeoChallenge;
  apiKey: string;
  allowLocationFallback?: boolean;
}): SlowGeoStreetViewPanoramaConfig | null {
  if (!apiKey) return null;

  const panoId = challenge.panoId?.trim();
  if (!panoId && !allowLocationFallback) return null;

  return {
    apiKey,
    panoId: panoId || undefined,
    position: {
      lat: challenge.lat,
      lng: challenge.lon,
    },
    pov: {
      heading: challenge.heading,
      pitch: challenge.pitch,
    },
    fov: challenge.fov,
    initialZoom: streetViewZoomFromFov(challenge.fov),
  };
}
