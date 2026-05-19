import { randomUUID } from "node:crypto";

import { isSafeSlowGeoAttribution } from "@/lib/slowgeo-share";
import type { SlowGeoChallenge, SlowGeoDifficulty } from "@/lib/types";

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
  difficulty: SlowGeoDifficulty;
  theme: string;
  signature: string;
  tags: string[];
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
    difficulty: "middels",
    theme: "Balkan og kulehull-lære",
    signature: "Sarajevodagen lurer alltid i murpussen.",
    tags: ["sarajevo", "europa", "by"],
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
    difficulty: "lett",
    theme: "nordlysstat og norsk veifølelse",
    signature: "Fjell, vann og nordlig infrastruktur uten skam.",
    tags: ["norge", "nord", "bro"],
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
    difficulty: "hard",
    theme: "øystat med britisk etterklang",
    signature: "New Zealand kan alltid late som det er Irland, og omvendt.",
    tags: ["oseania", "øy", "by"],
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
    difficulty: "hard",
    theme: "søramerikansk kystro",
    signature: "Ramblaen smiler som om Buenos Aires ikke står i rommet.",
    tags: ["sor-amerika", "kyst", "by"],
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
    difficulty: "middels",
    theme: "baltisk gammelby",
    signature: "Nok Europa til at noen blir for selvsikre.",
    tags: ["baltikum", "europa", "by"],
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
    difficulty: "hard",
    theme: "bratt fargekaos ved Stillehavet",
    signature: "Alt går oppover, men det er ikke Peru denne gangen.",
    tags: ["chile", "bratt", "kyst"],
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
    difficulty: "hard",
    theme: "Kaukasus mellom Europa og Asia",
    signature: "En perfekt arena for kontinentforvirring med høy selvtillit.",
    tags: ["kaukasus", "asia", "by"],
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
    difficulty: "middels",
    theme: "fargerik sørspiss",
    signature: "Sør-Afrika når paletten bestemmer seg for å hjelpe.",
    tags: ["afrika", "sor-afrika", "farger"],
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
    difficulty: "middels",
    theme: "litauisk hageorden",
    signature: "Polen-følelse med litt for pene kanter.",
    tags: ["litauen", "baltikum", "by"],
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
    difficulty: "lett",
    theme: "høyde, utsikt og geotisk svimmelhet",
    signature: "Er det utsikt, begynner Bolivia å rope.",
    tags: ["bolivia", "hoyde", "utsikt"],
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
    difficulty: "middels",
    theme: "østasiatisk presisjon og taklinjer",
    signature: "For ordentlig til å være en panikkteori, farlig nok likevel.",
    tags: ["asia", "sor-korea", "by"],
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
    difficulty: "middels",
    theme: "nordafrikansk varme",
    signature: "Sandfarget autoritet med minaret i sidesynet.",
    tags: ["afrika", "marokko", "by"],
  },
  {
    id: "dakar-plateau",
    label: "Plateau, Dakar",
    country: "Senegal",
    continent: "Afrika",
    lat: 14.6685,
    lon: -17.4359,
    heading: 78,
    pitch: 1,
    fov: 90,
    difficulty: "hard",
    theme: "vestafrikansk bylesning",
    signature: "Når Afrika ikke vil være det første geoten tør å si høyt.",
    tags: ["afrika", "senegal", "by"],
  },
  {
    id: "ghent-canal",
    label: "Graslei, Gent",
    country: "Belgia",
    continent: "Europa",
    lat: 51.0543,
    lon: 3.7206,
    heading: 250,
    pitch: 0,
    fov: 88,
    difficulty: "middels",
    theme: "kanaler, tegl og lavlandsforvirring",
    signature: "Nederlandsk selvtillit kan her bli belgisk korreksjon.",
    tags: ["europa", "belgia", "kanal"],
  },
  {
    id: "sapporo-odori",
    label: "Odori Park, Sapporo",
    country: "Japan",
    continent: "Asia",
    lat: 43.0606,
    lon: 141.3538,
    heading: 96,
    pitch: 0,
    fov: 86,
    difficulty: "hard",
    theme: "Japan, men ikke Tokyo-refleks",
    signature: "Shabby, ryddig og rart nok til å forstyrre alle.",
    tags: ["asia", "japan", "by"],
  },
  {
    id: "porto-ribeira",
    label: "Ribeira, Porto",
    country: "Portugal",
    continent: "Europa",
    lat: 41.1406,
    lon: -8.611,
    heading: 64,
    pitch: 1,
    fov: 88,
    difficulty: "middels",
    theme: "iberisk skråning og fliser",
    signature: "Ikke alle varme vegger er Spania.",
    tags: ["europa", "portugal", "kyst"],
  },
  {
    id: "cusco-san-blas",
    label: "San Blas, Cusco",
    country: "Peru",
    continent: "Sør-Amerika",
    lat: -13.5153,
    lon: -71.9763,
    heading: 192,
    pitch: -2,
    fov: 90,
    difficulty: "middels",
    theme: "andesby og oppoverlov",
    signature: "Det går alltid oppover i Peru, særlig i argumentasjonen.",
    tags: ["sor-amerika", "peru", "hoyde"],
  },
  {
    id: "tallinn-old-town",
    label: "Viru Gate, Tallinn",
    country: "Estland",
    continent: "Europa",
    lat: 59.4369,
    lon: 24.7504,
    heading: 310,
    pitch: 1,
    fov: 86,
    difficulty: "middels",
    theme: "baltisk middelaldermaskering",
    signature: "For pen til Polen, for farlig til at PLO får rett alene.",
    tags: ["baltikum", "estland", "by"],
  },
  {
    id: "kingston-waterfront",
    label: "Kingston Waterfront",
    country: "Jamaica",
    continent: "Nord-Amerika",
    lat: 17.9655,
    lon: -76.7936,
    heading: 135,
    pitch: 0,
    fov: 90,
    difficulty: "absurd",
    theme: "karibisk kyst uten trygg autopilot",
    signature: "Når palmer ikke lenger betyr at noen egentlig vet noe.",
    tags: ["karibia", "jamaica", "kyst"],
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
  requirePanoId = false,
}: {
  excludeCandidateIds?: string[];
  requirePanoId?: boolean;
} = {}) {
  const candidates = shuffledCandidates(excludeCandidateIds);
  const apiKey = googleMapsServerApiKey();

  if (!apiKey) {
    if (requirePanoId) {
      throw new Error("Panorama-modus krever Google Street View metadata og gyldig pano-ID.");
    }
    return challengeFromCandidate(candidates[0], null);
  }

  let lastStatus = "";
  for (const candidate of candidates) {
    const metadata = await fetchMetadata(candidate, apiKey);
    lastStatus = metadata.status;
    if (metadata.status === "OK" && metadata.pano_id) {
      if (!isSafeSlowGeoAttribution(metadata.copyright)) {
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

  throw new Error(`Ingen kurert SlowGeo-kandidat hadde gyldig Street View akkurat nå (${lastStatus || "ukjent status"}).`);
}
