import candidateData from "@/data/slowgeo-candidates.json";
import type { SlowGeoDifficulty } from "@/lib/types";

const difficulties = new Set<SlowGeoDifficulty>(["lett", "middels", "hard", "absurd"]);
const continents = new Set(["Europa", "Asia", "Afrika", "Sør-Amerika", "Nord-Amerika", "Oseania"]);

export type StreetViewCandidate = {
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
  panoId?: string | null;
  imageDate?: string | null;
  copyright?: string | null;
  validatedAt?: string | null;
};

export type SlowGeoCandidatePoolStatus = "ok" | "low" | "empty";

export type SlowGeoCandidatePoolStats = {
  totalCandidates: number;
  usedCandidateIds: string[];
  usedPanoIds: string[];
  usedCandidateCount: number;
  usedPanoCount: number;
  unusedCandidateIds: string[];
  unusedCandidateCount: number;
  lowWatermark: number;
  targetUnused: number;
  status: SlowGeoCandidatePoolStatus;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value: unknown) {
  const text = cleanString(value);
  return text ? text : null;
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positiveIntegerFromEnv(name: string, fallback: number) {
  const parsed = Number(process.env[name] ?? "");
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function normalizeCandidate(value: unknown, index: number): StreetViewCandidate {
  if (!value || typeof value !== "object") {
    throw new Error(`SlowGeo-kandidat #${index + 1} er ikke et objekt.`);
  }

  const candidate = value as Record<string, unknown>;
  const id = cleanString(candidate.id);
  const label = cleanString(candidate.label);
  const country = cleanString(candidate.country);
  const continent = cleanString(candidate.continent);
  const lat = finiteNumber(candidate.lat);
  const lon = finiteNumber(candidate.lon);
  const heading = finiteNumber(candidate.heading);
  const pitch = finiteNumber(candidate.pitch);
  const fov = finiteNumber(candidate.fov);
  const difficulty = cleanString(candidate.difficulty) as SlowGeoDifficulty;
  const theme = cleanString(candidate.theme);
  const signature = cleanString(candidate.signature);
  const tags = Array.isArray(candidate.tags) ? candidate.tags.map(cleanString).filter(Boolean) : [];

  if (!id) throw new Error(`SlowGeo-kandidat #${index + 1} mangler id.`);
  if (!label) throw new Error(`SlowGeo-kandidat ${id} mangler label.`);
  if (!country) throw new Error(`SlowGeo-kandidat ${id} mangler country.`);
  if (!continents.has(continent)) throw new Error(`SlowGeo-kandidat ${id} har ugyldig continent.`);
  if (lat === null || lat < -90 || lat > 90) throw new Error(`SlowGeo-kandidat ${id} har ugyldig lat.`);
  if (lon === null || lon < -180 || lon > 180) throw new Error(`SlowGeo-kandidat ${id} har ugyldig lon.`);
  if (heading === null || heading < 0 || heading >= 360) throw new Error(`SlowGeo-kandidat ${id} har ugyldig heading.`);
  if (pitch !== null && (pitch < -90 || pitch > 90)) throw new Error(`SlowGeo-kandidat ${id} har ugyldig pitch.`);
  if (fov !== null && (fov < 10 || fov > 120)) throw new Error(`SlowGeo-kandidat ${id} har ugyldig fov.`);
  if (!difficulties.has(difficulty)) throw new Error(`SlowGeo-kandidat ${id} har ugyldig difficulty.`);
  if (!theme) throw new Error(`SlowGeo-kandidat ${id} mangler theme.`);
  if (!signature) throw new Error(`SlowGeo-kandidat ${id} mangler signature.`);
  if (tags.length === 0) throw new Error(`SlowGeo-kandidat ${id} mangler tags.`);

  return {
    id,
    label,
    country,
    continent,
    lat,
    lon,
    heading,
    pitch: pitch ?? undefined,
    fov: fov ?? undefined,
    difficulty,
    theme,
    signature,
    tags,
    panoId: optionalString(candidate.panoId),
    imageDate: optionalString(candidate.imageDate),
    copyright: optionalString(candidate.copyright),
    validatedAt: optionalString(candidate.validatedAt),
  };
}

export function validateSlowGeoCandidates(value: unknown): StreetViewCandidate[] {
  if (!Array.isArray(value)) {
    throw new Error("SlowGeo-kandidatfilen må være en liste.");
  }

  const candidates = value.map(normalizeCandidate);
  const ids = new Set<string>();
  const panoIds = new Set<string>();

  for (const candidate of candidates) {
    if (ids.has(candidate.id)) {
      throw new Error(`SlowGeo-kandidatlisten har duplikat-id: ${candidate.id}`);
    }
    ids.add(candidate.id);

    if (candidate.panoId) {
      if (panoIds.has(candidate.panoId)) {
        throw new Error(`SlowGeo-kandidatlisten har duplikat-panoId: ${candidate.panoId}`);
      }
      panoIds.add(candidate.panoId);
    }
  }

  return candidates;
}

export function getSlowGeoPoolTargetUnused() {
  return positiveIntegerFromEnv("SLOWGEO_POOL_TARGET_UNUSED", 500);
}

export function getSlowGeoPoolLowWatermark() {
  return positiveIntegerFromEnv("SLOWGEO_POOL_LOW_WATERMARK", 100);
}

export function getSlowGeoCandidatePoolStats({
  usedCandidateIds = [],
  usedPanoIds = [],
  candidates = slowGeoCandidates,
}: {
  usedCandidateIds?: string[];
  usedPanoIds?: string[];
  candidates?: StreetViewCandidate[];
} = {}): SlowGeoCandidatePoolStats {
  const usedCandidateSet = new Set(usedCandidateIds.map((value) => value.trim()).filter(Boolean));
  const usedPanoSet = new Set(usedPanoIds.map((value) => value.trim()).filter(Boolean));
  const unusedCandidateIds = candidates
    .filter((candidate) => {
      if (usedCandidateSet.has(candidate.id)) return false;
      return !candidate.panoId || !usedPanoSet.has(candidate.panoId);
    })
    .map((candidate) => candidate.id);
  const lowWatermark = getSlowGeoPoolLowWatermark();
  const status: SlowGeoCandidatePoolStatus =
    unusedCandidateIds.length === 0 ? "empty" : unusedCandidateIds.length <= lowWatermark ? "low" : "ok";

  return {
    totalCandidates: candidates.length,
    usedCandidateIds: [...usedCandidateSet].sort(),
    usedPanoIds: [...usedPanoSet].sort(),
    usedCandidateCount: usedCandidateSet.size,
    usedPanoCount: usedPanoSet.size,
    unusedCandidateIds,
    unusedCandidateCount: unusedCandidateIds.length,
    lowWatermark,
    targetUnused: getSlowGeoPoolTargetUnused(),
    status,
  };
}

export function slowGeoAttributionHintsForCandidate(candidate: StreetViewCandidate) {
  return [
    candidate.id,
    candidate.label,
    candidate.country,
    candidate.continent,
    candidate.theme,
    candidate.signature,
    ...candidate.tags,
  ];
}

export const slowGeoCandidates = validateSlowGeoCandidates(candidateData);
