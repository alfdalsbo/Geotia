import { z } from "zod";

import type { FileState, RoundLocationData } from "@/lib/data/storage-types";
import type {
  GameResult,
  GeoLocation,
  GeoticOrderPromotionSnapshot,
  GeoticOrderPromotionVote,
  GeotingPartyPosition,
  GeotingVote,
  PlayerResult,
} from "@/lib/types";

const isoString = z.string().min(1);
const optionalIsoString = isoString.nullish();

const resultStatusSchema = z.enum(["deltatt", "ikke_deltatt", "ugyldig"]);
const distanceSourceSchema = z.enum(["auto", "manual"]);
const slowGeoModeSchema = z.enum(["static", "panorama"]);
const slowGeoVariantSchema = z.enum(["slowgeo", "bohemgeo"]);
const slowGeoDifficultySchema = z.enum(["lett", "middels", "hard", "absurd"]);

export const geoLocationSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
  label: z.string(),
  query: z.string(),
  country: z.string().optional(),
  source: z.enum(["nominatim", "manual", "google_street_view"]),
}).passthrough();

const roundMapMarkerSchema = z.object({
  id: z.string(),
  type: z.enum(["answer", "guess"]),
  playerId: z.string().optional(),
  label: z.string(),
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
  color: z.string(),
  distanceKm: z.number().finite().nullable().optional(),
}).passthrough();

const roundMapSnapshotSchema = z.object({
  bounds: z.object({
    north: z.number().finite(),
    south: z.number().finite(),
    east: z.number().finite(),
    west: z.number().finite(),
  }).passthrough(),
  markers: z.array(roundMapMarkerSchema),
}).passthrough();

const slowGeoChallengeSchema = z.object({
  id: z.string(),
  candidateId: z.string(),
  source: z.literal("google_street_view"),
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
  label: z.string(),
  country: z.string(),
  continent: z.string(),
  heading: z.number().finite(),
  pitch: z.number().finite(),
  fov: z.number().finite(),
  panoId: z.string().optional(),
  imageDate: z.string().optional(),
  copyright: z.string().optional(),
  difficulty: slowGeoDifficultySchema.optional(),
  theme: z.string().optional(),
  signature: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: isoString,
}).passthrough();

export const roundLocationDataSchema = z.object({
  answerLocation: geoLocationSchema.nullish(),
  mapSnapshot: roundMapSnapshotSchema.nullish(),
  challenge: slowGeoChallengeSchema.nullish(),
  slowGeoMode: slowGeoModeSchema.optional(),
  slowGeoVariant: slowGeoVariantSchema.nullable().optional(),
  slowGeoEraId: z.string().nullable().optional(),
  slowGeoStartedBy: z.string().nullable().optional(),
  slowGeoStartedAt: z.string().nullable().optional(),
  deadlineAt: z.string().nullable().optional(),
  revealedAt: z.string().nullable().optional(),
}).passthrough();

export const playerResultSchema = z.object({
  playerId: z.string(),
  status: resultStatusSchema,
  actualKm: z.number().finite().nullable(),
  guessText: z.string().optional(),
  guessLocation: geoLocationSchema.nullish(),
  guessUpdatedAt: z.string().nullable().optional(),
  distanceSource: distanceSourceSchema.nullish(),
  note: z.string().optional(),
}).passthrough();

export const gameResultSchema = z.object({
  playerId: z.string(),
  status: resultStatusSchema,
  score: z.number().finite().nullable(),
  note: z.string().optional(),
}).passthrough();

export const geotingVoteSchema = z.object({
  playerId: z.string(),
  vote: z.enum(["for", "mot", "blankt", "avhold"]),
  comment: z.string(),
  createdAt: isoString,
  automatic: z.boolean().optional(),
}).passthrough();

export const geotingPartyPositionSchema = z.object({
  partyId: z.string(),
  position: z.enum(["for", "mot", "blankt", "fri"]),
  comment: z.string(),
  updatedAt: isoString,
  updatedBy: z.string(),
}).passthrough();

export const geoticOrderPromotionSnapshotSchema = z.object({
  serviceWeeks: z.number().finite(),
  roundsPlayed: z.number().finite(),
  lifetimePoints: z.number().finite(),
  trustScore: z.number().finite(),
  eligibleRankId: z.string(),
}).passthrough();

export const geoticOrderPromotionVoteSchema = z.object({
  voterId: z.string(),
  vote: z.enum(["for", "mot"]),
  comment: z.string(),
  createdAt: isoString,
}).passthrough();

const roundSchema = z.object({
  id: z.string(),
  number: z.number().finite(),
  date: z.string(),
  name: z.string(),
  answer: z.string(),
  answerLocation: geoLocationSchema.nullish(),
  mapSnapshot: roundMapSnapshotSchema.nullish(),
  challenge: slowGeoChallengeSchema.nullish(),
  slowGeoMode: slowGeoModeSchema.optional(),
  slowGeoVariant: slowGeoVariantSchema.optional(),
  slowGeoEraId: z.string().nullable().optional(),
  slowGeoStartedBy: z.string().nullable().optional(),
  slowGeoStartedAt: z.string().nullable().optional(),
  deadlineAt: z.string().nullable().optional(),
  revealedAt: z.string().nullable().optional(),
  country: z.string(),
  continent: z.string(),
  comment: z.string(),
  status: z.enum(["draft", "open", "revealed", "locked"]),
  createdAt: isoString,
  updatedAt: isoString,
  results: z.array(playerResultSchema),
}).passthrough();

const gameSessionSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  number: z.number().finite(),
  date: z.string(),
  title: z.string(),
  context: z.string(),
  status: z.enum(["draft", "open", "revealed", "locked"]),
  createdAt: isoString,
  updatedAt: isoString,
  results: z.array(gameResultSchema),
}).passthrough();

const geotingProposalSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  ruleType: z.enum(["grunnlov", "mindre", "annet"]),
  proposedBy: z.string(),
  status: z.enum(["open", "voting", "passed", "rejected", "archived"]),
  createdAt: isoString,
  updatedAt: isoString,
  voteStartedAt: optionalIsoString.optional(),
  voteEndsAt: optionalIsoString.optional(),
  voteStartedBy: z.string().nullable().optional(),
  oathText: z.string().optional(),
  resolvedAt: optionalIsoString.optional(),
  implementationStatus: z.enum(["pending", "implemented", "ignored"]).optional(),
  implementationNote: z.string().optional(),
  implementedAt: optionalIsoString.optional(),
  partyPositions: z.array(geotingPartyPositionSchema).optional(),
  votes: z.array(geotingVoteSchema),
}).passthrough();

const geoterIndexAdjustmentSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  delta: z.number().finite(),
  category: z.string(),
  title: z.string(),
  reason: z.string(),
  createdAt: isoString,
  createdBy: z.string(),
}).passthrough();

const geoticOrderAssessmentSchema = z.object({
  playerId: z.string(),
  rankId: z.string(),
  serviceWeeks: z.number().finite(),
  hiddenCategory: z.string(),
  status: z.string(),
  sponsor: z.string(),
  trial: z.string(),
  publicNote: z.string(),
  internalNote: z.string(),
  updatedAt: isoString,
  updatedBy: z.string(),
}).passthrough();

const geoticOrderPromotionCaseSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  fromRankId: z.string(),
  targetRankId: z.string(),
  status: z.enum(["pending", "approved", "rejected", "superseded"]),
  snapshot: geoticOrderPromotionSnapshotSchema,
  votes: z.array(geoticOrderPromotionVoteSchema),
  publicNote: z.string(),
  internalNote: z.string(),
  createdAt: isoString,
  updatedAt: isoString,
  resolvedAt: optionalIsoString.optional(),
  openedBy: z.string(),
}).passthrough();

const playerProfileSchema = z.object({
  playerId: z.string(),
  nickname: z.string().nullable(),
  updatedAt: isoString,
  updatedBy: z.string(),
}).passthrough();

const geocodeCacheSchema = z.object({
  queryKey: z.string(),
  location: geoLocationSchema.nullable(),
  updatedAt: isoString,
}).passthrough();

const slowGeoUsedChallengeSchema = z.object({
  candidateId: z.string(),
  panoId: z.string().nullable().optional(),
  roundId: z.string().nullable().optional(),
  challengeId: z.string().nullable().optional(),
  usedAt: isoString,
  reason: z.enum(["created", "replaced", "backfilled"]),
}).passthrough();

const fileStateSchema = z.object({
  meta: z.record(z.string(), z.string()).optional(),
  rounds: z.array(roundSchema).optional(),
  gameSessions: z.array(gameSessionSchema).optional(),
  geotingProposals: z.array(geotingProposalSchema).optional(),
  geoterIndexAdjustments: z.array(geoterIndexAdjustmentSchema).optional(),
  geoticOrderAssessments: z.array(geoticOrderAssessmentSchema).optional(),
  geoticOrderPromotionCases: z.array(geoticOrderPromotionCaseSchema).optional(),
  playerProfiles: z.array(playerProfileSchema).optional(),
  geocodeCache: z.array(geocodeCacheSchema).optional(),
  slowGeoUsedChallenges: z.array(slowGeoUsedChallengeSchema).optional(),
}).passthrough();

function jsonValue(value: unknown) {
  return typeof value === "string" ? JSON.parse(value) : value;
}

function parsePayload<T>(label: string, schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(jsonValue(value));
  if (!parsed.success) {
    throw new Error(`${label} har ugyldig persistent format: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function parseRoundLocationPayload(value: unknown): Partial<RoundLocationData> {
  return parsePayload("Round location JSON", roundLocationDataSchema, value) as Partial<RoundLocationData>;
}

export function parseRoundResultsPayload(value: unknown): PlayerResult[] {
  return parsePayload("Round results JSON", z.array(playerResultSchema), value) as PlayerResult[];
}

export function parseGameResultsPayload(value: unknown): GameResult[] {
  return parsePayload("Game results JSON", z.array(gameResultSchema), value) as GameResult[];
}

export function parseGeotingVotesPayload(value: unknown): GeotingVote[] {
  return parsePayload("Geoting votes JSON", z.array(geotingVoteSchema), value) as GeotingVote[];
}

export function parseGeotingPartyPositionsPayload(value: unknown): GeotingPartyPosition[] {
  return parsePayload("Geoting party positions JSON", z.array(geotingPartyPositionSchema), value) as GeotingPartyPosition[];
}

export function parsePromotionSnapshotPayload(value: unknown): GeoticOrderPromotionSnapshot {
  return parsePayload("Geotic Order promotion snapshot JSON", geoticOrderPromotionSnapshotSchema, value) as GeoticOrderPromotionSnapshot;
}

export function parsePromotionVotesPayload(value: unknown): GeoticOrderPromotionVote[] {
  return parsePayload("Geotic Order promotion votes JSON", z.array(geoticOrderPromotionVoteSchema), value) as GeoticOrderPromotionVote[];
}

export function parseGeocodeLocationPayload(value: unknown): GeoLocation | null {
  return parsePayload("Geocode cache JSON", geoLocationSchema.nullable(), value) as GeoLocation | null;
}

export function safeParseFileStatePayload(value: unknown): Partial<FileState> | null {
  try {
    const parsed = fileStateSchema.safeParse(jsonValue(value));
    return parsed.success ? (parsed.data as Partial<FileState>) : null;
  } catch {
    return null;
  }
}
