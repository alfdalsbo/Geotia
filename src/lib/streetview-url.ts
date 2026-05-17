import type { SlowGeoChallenge } from "@/lib/types";

export const STREET_VIEW_STATIC_IMAGE_SIZE = "640x640";

export function buildStreetViewImageUrl({
  challenge,
  apiKey,
  allowLocationFallback = false,
  size = STREET_VIEW_STATIC_IMAGE_SIZE,
}: {
  challenge: SlowGeoChallenge;
  apiKey: string;
  allowLocationFallback?: boolean;
  size?: string;
}) {
  if (!apiKey) return null;
  if (!challenge.panoId && !allowLocationFallback) return null;

  const params = new URLSearchParams({
    size,
    heading: String(challenge.heading),
    pitch: String(challenge.pitch),
    fov: String(challenge.fov),
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
