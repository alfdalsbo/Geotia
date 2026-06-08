import { randomUUID } from "node:crypto";

import { slowGeoAttributionHintsForCandidate, slowGeoCandidates, type StreetViewCandidate } from "@/lib/slowgeo-candidates";
import { isSafeSlowGeoAttribution } from "@/lib/slowgeo-share";
import type { SlowGeoChallenge } from "@/lib/types";

export { getSlowGeoCandidatePoolStats, slowGeoCandidates, validateSlowGeoCandidates } from "@/lib/slowgeo-candidates";
export type { SlowGeoCandidatePoolStats, StreetViewCandidate } from "@/lib/slowgeo-candidates";

type StreetViewMetadataResponse = {
  status: string;
  pano_id?: string;
  location?: {
    lat?: number;
    lng?: number;
  };
  date?: string;
  copyright?: string;
  error_message?: string;
};

const slowGeoPoolExhaustedMessage =
  "Alle kuraterte SlowGeo-bilder er brukt. Legg til nye kandidater før neste runde.";

function googleMapsServerApiKey() {
  return process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
}

export function getSlowGeoMonthlyRoundCap() {
  const parsed = Number(process.env.SLOWGEO_MONTHLY_ROUND_CAP ?? "40");
  if (!Number.isFinite(parsed)) return 40;
  return Math.max(0, Math.floor(parsed));
}

function normalizedSet(values: string[]) {
  return new Set(values.map((value) => value.trim()).filter(Boolean));
}

function shuffledCandidates(excludeIds: string[], excludePanoIds: string[] = []) {
  const excluded = normalizedSet(excludeIds);
  const excludedPanos = normalizedSet(excludePanoIds);
  const available = slowGeoCandidates.filter((candidate) => {
    if (excluded.has(candidate.id)) return false;
    return !candidate.panoId || !excludedPanos.has(candidate.panoId);
  });
  return [...available].sort(() => Math.random() - 0.5);
}

function challengeFromCandidate(
  candidate: StreetViewCandidate,
  metadata: StreetViewMetadataResponse | null,
): SlowGeoChallenge {
  const metadataLat = metadata?.location?.lat;
  const metadataLon = metadata?.location?.lng;

  return {
    id: randomUUID(),
    candidateId: candidate.id,
    source: "google_street_view",
    lat: typeof metadataLat === "number" ? metadataLat : candidate.lat,
    lon: typeof metadataLon === "number" ? metadataLon : candidate.lon,
    label: candidate.label,
    country: candidate.country,
    continent: candidate.continent,
    heading: candidate.heading,
    pitch: candidate.pitch ?? 0,
    fov: candidate.fov ?? 90,
    panoId: metadata?.pano_id ?? candidate.panoId ?? undefined,
    imageDate: metadata?.date ?? candidate.imageDate ?? undefined,
    copyright: metadata?.copyright ?? candidate.copyright ?? undefined,
    difficulty: candidate.difficulty,
    theme: candidate.theme,
    signature: candidate.signature,
    tags: candidate.tags,
    createdAt: new Date().toISOString(),
  };
}


async function fetchMetadata(candidate: StreetViewCandidate, apiKey: string) {
  const params = new URLSearchParams({
    location: `${candidate.lat},${candidate.lon}`,
    radius: "80",
    source: "outdoor",
    key: apiKey,
  });
  const response = await fetch(`https://maps.googleapis.com/maps/api/streetview/metadata?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google Street View metadata svarte med HTTP ${response.status}.`);
  }

  return (await response.json()) as StreetViewMetadataResponse;
}

export async function createStreetViewChallenge({
  excludeCandidateIds = [],
  excludePanoIds = [],
  requirePanoId = false,
}: {
  excludeCandidateIds?: string[];
  excludePanoIds?: string[];
  requirePanoId?: boolean;
} = {}) {
  const candidates = shuffledCandidates(excludeCandidateIds, excludePanoIds);
  if (candidates.length === 0) {
    throw new Error(slowGeoPoolExhaustedMessage);
  }
  const apiKey = googleMapsServerApiKey();
  const excludedPanoIds = normalizedSet(excludePanoIds);

  if (!apiKey) {
    const candidate = requirePanoId ? candidates.find((entry) => entry.panoId) : candidates[0];
    if (!candidate) {
      throw new Error("Panorama-modus krever Google Street View metadata og gyldig pano-ID.");
    }
    return challengeFromCandidate(candidate, null);
  }

  let lastStatus = "";
  for (const candidate of candidates) {
    const metadata = await fetchMetadata(candidate, apiKey);
    lastStatus = metadata.status;
    if (metadata.status === "OK" && metadata.pano_id) {
      if (excludedPanoIds.has(metadata.pano_id)) {
        lastStatus = "USED_PANO";
        continue;
      }
      if (!isSafeSlowGeoAttribution(metadata.copyright, slowGeoAttributionHintsForCandidate(candidate))) {
        lastStatus = "UNSAFE_ATTRIBUTION";
        continue;
      }
      return challengeFromCandidate(candidate, metadata);
    }
    if (
      metadata.status === "REQUEST_DENIED" ||
      metadata.status === "OVER_QUERY_LIMIT" ||
      metadata.status === "INVALID_REQUEST"
    ) {
      throw new Error(metadata.error_message || `Google Street View metadata avviste forespørselen: ${metadata.status}.`);
    }
  }

  const publicStatus =
    lastStatus === "UNSAFE_ATTRIBUTION"
      ? "Street View-attribusjonen røpet for mye"
      : lastStatus === "USED_PANO"
        ? "alle gyldige Street View-panoramaer er brukt"
      : lastStatus || "ukjent status";
  throw new Error(`Ingen kurert SlowGeo-kandidat hadde gyldig Street View akkurat nå (${publicStatus}).`);
}
