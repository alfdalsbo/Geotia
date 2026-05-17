import type { SlowGeoChallenge } from "@/lib/types";

export const STREET_VIEW_STATIC_PREVIEW_IMAGE_SIZE = "640x480";
export const STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE = "640x640";
export const STREET_VIEW_STATIC_IMAGE_SIZE = STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE;
export const STREET_VIEW_STATIC_MIN_FOV = 20;
export const STREET_VIEW_STATIC_MAX_FOV = 120;
export const STREET_VIEW_STATIC_ZOOM_FACTORS = [1, 1.5, 2, 3, 4] as const;

export type StreetViewStaticZoomImage = {
  scale: number;
  fov: number;
  src: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeStreetViewStaticFov(fov: number) {
  if (!Number.isFinite(fov) || fov <= 0) return 90;

  return clamp(Number(fov.toFixed(4)), STREET_VIEW_STATIC_MIN_FOV, STREET_VIEW_STATIC_MAX_FOV);
}

export function streetViewStaticFovForZoom(baseFov: number, zoomScale: number) {
  const normalizedBaseFov = normalizeStreetViewStaticFov(baseFov);
  if (!Number.isFinite(zoomScale) || zoomScale <= 1) return normalizedBaseFov;

  return normalizeStreetViewStaticFov(normalizedBaseFov / zoomScale);
}

export function buildStreetViewImageUrl({
  challenge,
  apiKey,
  allowLocationFallback = false,
  size = STREET_VIEW_STATIC_IMAGE_SIZE,
  fov = challenge.fov,
}: {
  challenge: SlowGeoChallenge;
  apiKey: string;
  allowLocationFallback?: boolean;
  size?: string;
  fov?: number;
}) {
  if (!apiKey) return null;
  if (!challenge.panoId && !allowLocationFallback) return null;

  const params = new URLSearchParams({
    size,
    heading: String(challenge.heading),
    pitch: String(challenge.pitch),
    fov: String(normalizeStreetViewStaticFov(fov)),
    source: "outdoor",
    return_error_code: "true",
    key: apiKey,
  });

  if (challenge.panoId) {
    params.set("pano", challenge.panoId);
  } else {
    params.set("location", `${challenge.lat},${challenge.lon}`);
  }

  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

export const buildStreetViewStaticImageUrl = buildStreetViewImageUrl;

export function buildStreetViewStaticZoomImages({
  challenge,
  apiKey,
  allowLocationFallback = false,
  size = STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE,
  zoomFactors = STREET_VIEW_STATIC_ZOOM_FACTORS,
}: {
  challenge: SlowGeoChallenge;
  apiKey: string;
  allowLocationFallback?: boolean;
  size?: string;
  zoomFactors?: readonly number[];
}) {
  const normalizedBaseFov = normalizeStreetViewStaticFov(challenge.fov);
  const variants: StreetViewStaticZoomImage[] = [];
  const seen = new Set<string>();

  for (const zoomFactor of zoomFactors) {
    const fov = streetViewStaticFovForZoom(normalizedBaseFov, zoomFactor);
    const effectiveScale = Number((normalizedBaseFov / fov).toFixed(4));
    const key = `${effectiveScale}:${fov}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const src = buildStreetViewStaticImageUrl({
      challenge,
      apiKey,
      allowLocationFallback,
      size,
      fov,
    });
    if (src) variants.push({ scale: effectiveScale, fov, src });
  }

  return variants;
}
