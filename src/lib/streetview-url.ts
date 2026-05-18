import type { SlowGeoChallenge } from "@/lib/types";

export const STREET_VIEW_STATIC_PREVIEW_IMAGE_SIZE = "640x480";
export const STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE = "640x640";
export const STREET_VIEW_STATIC_IMAGE_SIZE = STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE;
export const STREET_VIEW_STATIC_MIN_FOV = 20;
export const STREET_VIEW_STATIC_MAX_FOV = 120;

export type StreetViewStaticCrop = {
  zoom: number;
  centerX: number;
  centerY: number;
  heading: number;
  pitch: number;
  fov: number;
};

export type StreetViewStaticViewConfig = {
  heading: number;
  pitch: number;
  fov: number;
  size?: string;
  aspectRatio?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rounded(value: number) {
  return Number(value.toFixed(4));
}

function horizontalToVerticalFov(horizontalFov: number, aspectRatio: number) {
  const normalizedAspectRatio = clamp(aspectRatio, 0.25, 4);
  const radians = (horizontalFov * Math.PI) / 180;
  return (2 * Math.atan(Math.tan(radians / 2) / normalizedAspectRatio) * 180) / Math.PI;
}

export function normalizeStreetViewStaticFov(fov: number) {
  if (!Number.isFinite(fov) || fov <= 0) return 90;

  return clamp(rounded(fov), STREET_VIEW_STATIC_MIN_FOV, STREET_VIEW_STATIC_MAX_FOV);
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
  heading = challenge.heading,
  pitch = challenge.pitch,
  fov = challenge.fov,
}: {
  challenge: SlowGeoChallenge;
  apiKey: string;
  allowLocationFallback?: boolean;
  size?: string;
  heading?: number;
  pitch?: number;
  fov?: number;
}) {
  if (!apiKey) return null;
  if (!challenge.panoId && !allowLocationFallback) return null;

  const params = new URLSearchParams({
    size,
    heading: String(rounded(heading)),
    pitch: String(rounded(pitch)),
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

export function buildStreetViewStaticViewConfig(challenge: SlowGeoChallenge): StreetViewStaticViewConfig {
  return {
    heading: challenge.heading,
    pitch: challenge.pitch,
    fov: normalizeStreetViewStaticFov(challenge.fov),
    size: STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE,
    aspectRatio: 1,
  };
}

export function buildStreetViewStaticCrop({
  heading,
  pitch,
  fov,
  zoom,
  centerX,
  centerY,
  aspectRatio = 1,
}: StreetViewStaticViewConfig & {
  zoom: number;
  centerX: number;
  centerY: number;
}): StreetViewStaticCrop {
  const baseFov = normalizeStreetViewStaticFov(fov);
  const normalizedZoom = clamp(Number.isFinite(zoom) ? zoom : 1, 1, maxScaleForStreetViewStaticFov(baseFov));
  const cropFov = streetViewStaticFovForZoom(baseFov, normalizedZoom);
  const effectiveZoom = rounded(baseFov / cropFov);
  const x = clamp(Number.isFinite(centerX) ? centerX : 0, -1, 1);
  const y = clamp(Number.isFinite(centerY) ? centerY : 0, -1, 1);
  const verticalBaseFov = horizontalToVerticalFov(baseFov, aspectRatio);
  const verticalCropFov = horizontalToVerticalFov(cropFov, aspectRatio);
  const maxHeadingShift = (baseFov - cropFov) / 2;
  const maxPitchShift = (verticalBaseFov - verticalCropFov) / 2;

  return {
    zoom: effectiveZoom,
    centerX: rounded(x),
    centerY: rounded(y),
    heading: rounded(heading + x * maxHeadingShift),
    pitch: rounded(clamp(pitch + y * maxPitchShift, -90 + verticalCropFov / 2, 90 - verticalCropFov / 2)),
    fov: cropFov,
  };
}

export function buildStreetViewStaticCropUrl({
  challenge,
  apiKey,
  crop,
  allowLocationFallback = false,
  size = STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE,
}: {
  challenge: SlowGeoChallenge;
  apiKey: string;
  crop: StreetViewStaticCrop;
  allowLocationFallback?: boolean;
  size?: string;
}) {
  return buildStreetViewStaticImageUrl({
    challenge,
    apiKey,
    allowLocationFallback,
    size,
    heading: crop.heading,
    pitch: crop.pitch,
    fov: crop.fov,
  });
}

export function buildStreetViewStaticCropUrlFromSource({
  sourceUrl,
  crop,
  size = STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE,
}: {
  sourceUrl: string;
  crop: StreetViewStaticCrop;
  size?: string;
}) {
  try {
    const url = new URL(sourceUrl);
    url.searchParams.set("size", size);
    url.searchParams.set("heading", String(crop.heading));
    url.searchParams.set("pitch", String(crop.pitch));
    url.searchParams.set("fov", String(crop.fov));
    return url.toString();
  } catch {
    return sourceUrl;
  }
}

export function maxScaleForStreetViewStaticFov(baseFov: number) {
  return rounded(normalizeStreetViewStaticFov(baseFov) / STREET_VIEW_STATIC_MIN_FOV);
}
