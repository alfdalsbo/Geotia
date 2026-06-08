import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const genericAttributionTokens = new Set([
  "all",
  "copyright",
  "data",
  "google",
  "imagery",
  "image",
  "images",
  "inc",
  "llc",
  "map",
  "maps",
  "reserved",
  "rights",
  "street",
  "view",
]);

export const defaultCandidateFile = path.join(repoRoot, "src", "data", "slowgeo-candidates.json");

export function candidateFilePath() {
  return process.env.SLOWGEO_CANDIDATE_FILE
    ? path.resolve(process.env.SLOWGEO_CANDIDATE_FILE)
    : defaultCandidateFile;
}

export function targetUnusedFromEnv() {
  const parsed = Number(process.env.SLOWGEO_POOL_TARGET_UNUSED ?? "500");
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 500;
}

export function lowWatermarkFromEnv() {
  const parsed = Number(process.env.SLOWGEO_POOL_LOW_WATERMARK ?? "100");
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 100;
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value) {
  const text = cleanString(value);
  return text ? text : null;
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function slugify(value) {
  return cleanString(value)
    .normalize("NFKD")
    .replace(/[æÆ]/g, "ae")
    .replace(/[øØ]/g, "o")
    .replace(/[åÅ]/g, "a")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function hash(value) {
  return createHash("sha1").update(value).digest("hex");
}

function fraction(value) {
  return parseInt(hash(value).slice(0, 10), 16) / 0xffffffffff;
}

function roundCoordinate(value) {
  return Number(value.toFixed(5));
}

function normalizeCandidate(value, index = 0) {
  if (!value || typeof value !== "object") {
    throw new Error(`SlowGeo candidate #${index + 1} is not an object.`);
  }

  const candidate = value;
  const id = cleanString(candidate.id);
  const label = cleanString(candidate.label);
  const country = cleanString(candidate.country);
  const continent = cleanString(candidate.continent);
  const lat = finiteNumber(candidate.lat);
  const lon = finiteNumber(candidate.lon);
  const heading = finiteNumber(candidate.heading);
  const pitch = finiteNumber(candidate.pitch);
  const fov = finiteNumber(candidate.fov);
  const difficulty = cleanString(candidate.difficulty);
  const theme = cleanString(candidate.theme);
  const signature = cleanString(candidate.signature);
  const tags = Array.isArray(candidate.tags) ? candidate.tags.map(cleanString).filter(Boolean) : [];

  if (!id) throw new Error(`SlowGeo candidate #${index + 1} lacks id.`);
  if (!label) throw new Error(`SlowGeo candidate ${id} lacks label.`);
  if (!country) throw new Error(`SlowGeo candidate ${id} lacks country.`);
  if (!continent) throw new Error(`SlowGeo candidate ${id} lacks continent.`);
  if (lat === null || lat < -90 || lat > 90) throw new Error(`SlowGeo candidate ${id} has invalid lat.`);
  if (lon === null || lon < -180 || lon > 180) throw new Error(`SlowGeo candidate ${id} has invalid lon.`);
  if (heading === null || heading < 0 || heading >= 360) {
    throw new Error(`SlowGeo candidate ${id} has invalid heading.`);
  }
  if (pitch !== null && (pitch < -90 || pitch > 90)) throw new Error(`SlowGeo candidate ${id} has invalid pitch.`);
  if (fov !== null && (fov < 10 || fov > 120)) throw new Error(`SlowGeo candidate ${id} has invalid fov.`);
  if (!["lett", "middels", "hard", "absurd"].includes(difficulty)) {
    throw new Error(`SlowGeo candidate ${id} has invalid difficulty.`);
  }
  if (!theme) throw new Error(`SlowGeo candidate ${id} lacks theme.`);
  if (!signature) throw new Error(`SlowGeo candidate ${id} lacks signature.`);
  if (tags.length === 0) throw new Error(`SlowGeo candidate ${id} lacks tags.`);

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

export function validateCandidateList(value) {
  if (!Array.isArray(value)) {
    throw new Error("SlowGeo candidate file must contain an array.");
  }

  const candidates = value.map(normalizeCandidate);
  const ids = new Set();
  const panoIds = new Set();

  for (const candidate of candidates) {
    if (ids.has(candidate.id)) {
      throw new Error(`Duplicate SlowGeo candidate id: ${candidate.id}`);
    }
    ids.add(candidate.id);

    if (candidate.panoId) {
      if (panoIds.has(candidate.panoId)) {
        throw new Error(`Duplicate SlowGeo panoId: ${candidate.panoId}`);
      }
      panoIds.add(candidate.panoId);
    }
  }

  return candidates;
}

export async function readCandidates(file = candidateFilePath()) {
  const raw = await fs.readFile(file, "utf8");
  return validateCandidateList(JSON.parse(raw));
}

export async function writeCandidates(candidates, file = candidateFilePath()) {
  const normalized = validateCandidateList(candidates);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

function usedFromState(state) {
  const usedCandidateIds = [];
  const usedPanoIds = [];

  for (const entry of Array.isArray(state?.slowGeoUsedChallenges) ? state.slowGeoUsedChallenges : []) {
    if (cleanString(entry?.candidateId)) usedCandidateIds.push(cleanString(entry.candidateId));
    if (cleanString(entry?.panoId)) usedPanoIds.push(cleanString(entry.panoId));
  }

  for (const round of Array.isArray(state?.rounds) ? state.rounds : []) {
    const challenge = round?.challenge;
    if (cleanString(challenge?.candidateId)) usedCandidateIds.push(cleanString(challenge.candidateId));
    if (cleanString(challenge?.panoId)) usedPanoIds.push(cleanString(challenge.panoId));
  }

  return { usedCandidateIds, usedPanoIds };
}

async function readJsonFileIfPresent(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

export async function readUsedHistory({
  dataFile = process.env.GEOTIA_DATA_FILE || path.join(repoRoot, ".data", "geotia-data.json"),
  includeBackups = true,
} = {}) {
  const groups = [];

  if (process.env.SLOWGEO_USED_CHALLENGES_JSON) {
    try {
      const parsed = JSON.parse(process.env.SLOWGEO_USED_CHALLENGES_JSON);
      groups.push(usedFromState(Array.isArray(parsed) ? { slowGeoUsedChallenges: parsed } : parsed));
    } catch {
      throw new Error("SLOWGEO_USED_CHALLENGES_JSON is not valid JSON.");
    }
  }

  const current = await readJsonFileIfPresent(dataFile);
  if (current) groups.push(usedFromState(current));

  const backup = await readJsonFileIfPresent(`${dataFile}.bak`);
  if (backup) groups.push(usedFromState(backup));

  if (includeBackups && path.basename(dataFile) === "geotia-data.json") {
    try {
      const backupDir = path.join(path.dirname(dataFile), "backups");
      const files = await fs.readdir(backupDir);
      for (const file of files.filter((candidate) => candidate.endsWith(".json"))) {
        const snapshot = await readJsonFileIfPresent(path.join(backupDir, file));
        if (snapshot) groups.push(usedFromState(snapshot));
      }
    } catch {
      // Historical backups are optional for local/CI pool checks.
    }
  }

  return {
    usedCandidateIds: [...new Set(groups.flatMap((group) => group.usedCandidateIds))].sort(),
    usedPanoIds: [...new Set(groups.flatMap((group) => group.usedPanoIds))].sort(),
  };
}

export function getPoolStats(candidates, usedHistory = {}) {
  const usedCandidateSet = new Set((usedHistory.usedCandidateIds ?? []).map(cleanString).filter(Boolean));
  const usedPanoSet = new Set((usedHistory.usedPanoIds ?? []).map(cleanString).filter(Boolean));
  const unusedCandidates = candidates.filter((candidate) => {
    if (usedCandidateSet.has(candidate.id)) return false;
    return !candidate.panoId || !usedPanoSet.has(candidate.panoId);
  });
  const lowWatermark = lowWatermarkFromEnv();
  const status = unusedCandidates.length === 0 ? "empty" : unusedCandidates.length <= lowWatermark ? "low" : "ok";

  return {
    totalCandidates: candidates.length,
    usedCandidateCount: usedCandidateSet.size,
    usedPanoCount: usedPanoSet.size,
    unusedCandidateCount: unusedCandidates.length,
    lowWatermark,
    targetUnused: targetUnusedFromEnv(),
    status,
    byContinent: candidates.reduce((counts, candidate) => {
      counts[candidate.continent] = (counts[candidate.continent] ?? 0) + 1;
      return counts;
    }, {}),
  };
}

function attributionTokens(value) {
  if (!value) return [];
  return cleanString(value)
    .normalize("NFKD")
    .replace(/[æÆ]/g, "ae")
    .replace(/[øØ]/g, "o")
    .replace(/[åÅ]/g, "a")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g) ?? [];
}

export function isSafeAttribution(value, unsafeHints = []) {
  if (!value) return true;

  const revealingTokens = attributionTokens(value).filter((token) => {
    if (/^\d{4}$/.test(token)) return false;
    if (/^\d+$/.test(token)) return false;
    return !genericAttributionTokens.has(token);
  });
  const unsafeHintTokens = new Set(
    unsafeHints
      .flatMap((hint) => attributionTokens(hint))
      .filter((token) => token.length >= 4 && !genericAttributionTokens.has(token)),
  );

  return !revealingTokens.some((token) => unsafeHintTokens.has(token));
}

function attributionHints(candidate) {
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

function variantCandidate(seed, sequence) {
  const base = `${seed.id}:${sequence}`;
  const lat = roundCoordinate(seed.lat + (fraction(`${base}:lat`) - 0.5) * 0.06);
  const lon = roundCoordinate(seed.lon + (fraction(`${base}:lon`) - 0.5) * 0.08);
  const hashSuffix = hash(`${seed.id}:${lat}:${lon}`).slice(0, 8);
  const variantWords = ["sidegate", "veikryss", "nabolagskant", "rolig akse", "gatehjørne", "hverdagsfelt"];
  const variantWord = variantWords[sequence % variantWords.length];
  const citySlug = slugify(seed.label.split(",")[0] || seed.label);

  return {
    id: `${slugify(seed.id || citySlug)}-${hashSuffix}`,
    label: `${seed.label.split(",")[0]} ${variantWord}`,
    country: seed.country,
    continent: seed.continent,
    lat,
    lon,
    heading: parseInt(hash(`${base}:heading`).slice(0, 8), 16) % 360,
    pitch: [-2, -1, 0, 1, 2, 3][parseInt(hash(`${base}:pitch`).slice(0, 4), 16) % 6],
    fov: [84, 86, 88, 90, 92][parseInt(hash(`${base}:fov`).slice(0, 4), 16) % 5],
    difficulty: seed.difficulty,
    theme: seed.theme,
    signature: seed.signature,
    tags: [...new Set([...seed.tags, "autofyll", slugify(seed.country)].filter(Boolean))],
  };
}

async function fetchStreetViewMetadata(candidate, apiKey, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is not available for Street View metadata validation.");
  }

  const params = new URLSearchParams({
    location: `${candidate.lat},${candidate.lon}`,
    radius: "80",
    source: "outdoor",
    key: apiKey,
  });
  const response = await fetchImpl(`https://maps.googleapis.com/maps/api/streetview/metadata?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google Street View metadata returned HTTP ${response.status}.`);
  }

  return response.json();
}

export async function refillCandidates({
  candidates,
  usedHistory = {},
  targetUnused = targetUnusedFromEnv(),
  lowWatermark = lowWatermarkFromEnv(),
  apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  now = new Date().toISOString(),
  fetchImpl = globalThis.fetch,
  maxAttempts = Math.max(500, targetUnused * 25),
} = {}) {
  const normalizedCandidates = validateCandidateList(candidates);
  if (normalizedCandidates.length === 0) {
    throw new Error("SlowGeo refill needs at least one existing candidate as a generation seed.");
  }
  const stats = getPoolStats(normalizedCandidates, usedHistory);
  if (stats.unusedCandidateCount > lowWatermark) {
    return { changed: false, candidates: normalizedCandidates, added: [], reason: "pool-ok", stats };
  }

  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_SERVER_API_KEY is required when SlowGeo refill needs new candidates.");
  }

  const nextCandidates = [...normalizedCandidates];
  const knownIds = new Set(nextCandidates.map((candidate) => candidate.id));
  const blockedPanoIds = new Set([
    ...nextCandidates.flatMap((candidate) => (candidate.panoId ? [candidate.panoId] : [])),
    ...(usedHistory.usedPanoIds ?? []),
  ]);
  const blockedCandidateIds = new Set(usedHistory.usedCandidateIds ?? []);
  const added = [];
  let sequence = 0;
  let attempts = 0;

  while (getPoolStats(nextCandidates, usedHistory).unusedCandidateCount < targetUnused && attempts < maxAttempts) {
    const seed = normalizedCandidates[sequence % normalizedCandidates.length];
    const candidate = variantCandidate(seed, sequence);
    sequence += 1;
    attempts += 1;

    if (knownIds.has(candidate.id) || blockedCandidateIds.has(candidate.id)) continue;

    const metadata = await fetchStreetViewMetadata(candidate, apiKey, fetchImpl);
    if (metadata.status !== "OK" || !metadata.pano_id) continue;
    if (blockedPanoIds.has(metadata.pano_id)) continue;
    if (!isSafeAttribution(metadata.copyright, attributionHints(candidate))) continue;

    const accepted = validateCandidateList([
      {
        ...candidate,
        lat: typeof metadata.location?.lat === "number" ? metadata.location.lat : candidate.lat,
        lon: typeof metadata.location?.lng === "number" ? metadata.location.lng : candidate.lon,
        panoId: metadata.pano_id,
        imageDate: optionalString(metadata.date),
        copyright: optionalString(metadata.copyright),
        validatedAt: now,
      },
    ])[0];
    knownIds.add(accepted.id);
    blockedPanoIds.add(accepted.panoId);
    nextCandidates.push(accepted);
    added.push(accepted);
  }

  const finalStats = getPoolStats(nextCandidates, usedHistory);
  if (finalStats.unusedCandidateCount < targetUnused) {
    throw new Error(
      `SlowGeo refill only reached ${finalStats.unusedCandidateCount} unused candidates after ${attempts} attempts; target is ${targetUnused}.`,
    );
  }

  return { changed: added.length > 0, candidates: nextCandidates, added, reason: "refilled", stats: finalStats };
}
