import { randomUUID } from "node:crypto";

import type { SlowGeoChallenge } from "@/lib/types";

type StreetViewCandidate = {
  id: string;
  label: string;
  country: string;
  continent: string;
  lat: number;
  lon: number;
  heading: number;
  pitch?: number;
  fov?: number;
};

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

export const slowGeoCandidates: StreetViewCandidate[] = [
  {
    id: "sarajevo-bascarsija",
    label: "Baščaršija, Sarajevo",
    country: "Bosnia-Hercegovina",
    continent: "Europa",
    lat: 43.8594,
    lon: 18.4312,
    heading: 88,
    pitch: 2,
    fov: 92,
  },
  {
    id: "tromso-bridge",
    label: "Tromsøbrua, Tromsø",
    country: "Norge",
    continent: "Europa",
    lat: 69.6534,
    lon: 18.975,
    heading: 64,
    pitch: 1,
    fov: 90,
  },
  {
    id: "wellington-cable-car",
    label: "Cable Car Lane, Wellington",
    country: "New Zealand",
    continent: "Oseania",
    lat: -41.2855,
    lon: 174.7749,
    heading: 340,
    pitch: 0,
    fov: 88,
  },
  {
    id: "montevideo-rambla",
    label: "Rambla República del Perú, Montevideo",
    country: "Uruguay",
    continent: "Sør-Amerika",
    lat: -34.9138,
    lon: -56.1461,
    heading: 110,
    pitch: 0,
    fov: 92,
  },
  {
    id: "riga-old-town",
    label: "Kaļķu iela, Riga",
    country: "Latvia",
    continent: "Europa",
    lat: 56.9496,
    lon: 24.109,
    heading: 215,
    pitch: 2,
    fov: 86,
  },
  {
    id: "valparaiso-cerro-alegre",
    label: "Cerro Alegre, Valparaíso",
    country: "Chile",
    continent: "Sør-Amerika",
    lat: -33.0399,
    lon: -71.6282,
    heading: 52,
    pitch: -4,
    fov: 90,
  },
  {
    id: "tbilisi-rustaveli",
    label: "Rustaveli Avenue, Tbilisi",
    country: "Georgia",
    continent: "Asia",
    lat: 41.7021,
    lon: 44.793,
    heading: 101,
    pitch: 1,
    fov: 90,
  },
  {
    id: "cape-town-bo-kaap",
    label: "Bo-Kaap, Cape Town",
    country: "Sør-Afrika",
    continent: "Afrika",
    lat: -33.9217,
    lon: 18.4156,
    heading: 148,
    pitch: 3,
    fov: 84,
  },
  {
    id: "vilnius-pilies",
    label: "Pilies gatvė, Vilnius",
    country: "Litauen",
    continent: "Europa",
    lat: 54.6825,
    lon: 25.2891,
    heading: 6,
    pitch: 1,
    fov: 86,
  },
  {
    id: "la-paz-mirador",
    label: "Mirador Killi Killi, La Paz",
    country: "Bolivia",
    continent: "Sør-Amerika",
    lat: -16.4938,
    lon: -68.1193,
    heading: 247,
    pitch: -7,
    fov: 94,
  },
  {
    id: "seoul-bukchon",
    label: "Bukchon Hanok Village, Seoul",
    country: "Sør-Korea",
    continent: "Asia",
    lat: 37.5826,
    lon: 126.9839,
    heading: 136,
    pitch: 1,
    fov: 84,
  },
  {
    id: "marrakesh-koutoubia",
    label: "Koutoubia, Marrakesh",
    country: "Marokko",
    continent: "Afrika",
    lat: 31.6242,
    lon: -7.9936,
    heading: 28,
    pitch: 2,
    fov: 88,
  },
];

function googleMapsServerApiKey() {
  return process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
}

export function getSlowGeoMonthlyRoundCap() {
  const parsed = Number(process.env.SLOWGEO_MONTHLY_ROUND_CAP ?? "40");
  if (!Number.isFinite(parsed)) return 40;
  return Math.max(0, Math.floor(parsed));
}

function shuffledCandidates(excludeIds: string[]) {
  const excluded = new Set(excludeIds);
  const available = slowGeoCandidates.filter((candidate) => !excluded.has(candidate.id));
  const source = available.length > 0 ? available : slowGeoCandidates;
  return [...source].sort(() => Math.random() - 0.5);
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
    panoId: metadata?.pano_id,
    imageDate: metadata?.date,
    copyright: metadata?.copyright,
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
}: {
  excludeCandidateIds?: string[];
} = {}) {
  const candidates = shuffledCandidates(excludeCandidateIds);
  const apiKey = googleMapsServerApiKey();

  if (!apiKey) {
    return challengeFromCandidate(candidates[0], null);
  }

  let lastStatus = "";
  for (const candidate of candidates) {
    const metadata = await fetchMetadata(candidate, apiKey);
    lastStatus = metadata.status;
    if (metadata.status === "OK" && metadata.pano_id) {
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

  throw new Error(`Ingen kurert SlowGeo-kandidat hadde gyldig Street View akkurat nå (${lastStatus || "ukjent status"}).`);
}
