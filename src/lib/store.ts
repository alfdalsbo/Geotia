import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { cache } from "react";

import { archive, competingPlayers, games, initialState, parties, players } from "@/lib/seed";
import { canLockRound, computeStandings, emptyResults } from "@/lib/scoring";
import { addVotingWindow, GEO_OATH_TEXT, normalizeVoteValue, resolveProposalIfReady } from "@/lib/geoting";
import { buildRoundMapSnapshot } from "@/lib/geo";
import { applyPlayerProfiles, normalizePlayerNickname } from "@/lib/player-profile";
import {
  getDefaultHiddenOrderCategory,
  getGeoticOrderRank,
  getGeoticOrderRows,
  getNextGeoticOrderRank,
  getOrderCapabilities,
} from "@/lib/geotisk-orden";
import { THIRD_COLLEGIUM_MEMBER_IDS } from "@/lib/kollegium";
import {
  finalizeSlowGeoRound,
  getActiveSlowGeoEra,
  getSlowGeoEraId,
  getSlowGeoMode,
  hasLockedSlowGeoGuess,
  isSlowGeoRound,
  isSlowGeoOpenRound,
  normalizeSlowGeoMode,
  shouldRevealSlowGeoRound,
} from "@/lib/slowgeo";
import { createStreetViewChallenge, getSlowGeoMonthlyRoundCap } from "@/lib/streetview";
import type {
  AppState,
  GameId,
  GameResult,
  GeoLocation,
  GameSession,
  GeoterIndexAdjustment,
  GeoterIndexCategory,
  GeoticOrderAssessment,
  GeoticOrderHiddenCategory,
  GeoticOrderPromotionCase,
  GeoticOrderPromotionSnapshot,
  GeoticOrderPromotionStatus,
  GeoticOrderPromotionVote,
  GeoticOrderPromotionVoteValue,
  GeoticOrderRankId,
  GeoticOrderStatus,
  GeotingImplementationStatus,
  GeotingPartyPosition,
  GeotingProposal,
  GeotingProposalStatus,
  GeotingVote,
  PartyPositionValue,
  PlayerProfile,
  PlayerResult,
  ProposalRuleType,
  Round,
  RoundMapSnapshot,
  RoundStatus,
  SlowGeoChallenge,
  SlowGeoMode,
  SlowGeoUsedChallenge,
  SlowGeoUsedChallengeReason,
  VoteValue,
} from "@/lib/types";

type RoundInput = {
  id?: string;
  date: string;
  name: string;
  answer: string;
  answerLocation?: GeoLocation | null;
  challenge?: SlowGeoChallenge | null;
  slowGeoMode?: SlowGeoMode;
  slowGeoEraId?: string | null;
  slowGeoStartedBy?: string | null;
  slowGeoStartedAt?: string | null;
  deadlineAt?: string | null;
  revealedAt?: string | null;
  country: string;
  continent: string;
  comment: string;
  results: PlayerResult[];
};

type DbRoundRow = {
  id: string;
  number: number;
  date: string;
  name: string;
  answer: string;
  country: string;
  continent: string;
  comment: string;
  status: RoundStatus;
  created_at: string;
  updated_at: string;
  results_json: PlayerResult[] | string;
  location_json?: RoundLocationData | string | null;
};

type GameSessionInput = {
  id?: string;
  gameId: GameId;
  date: string;
  title: string;
  context: string;
  results: GameResult[];
};

type ProposalInput = {
  title: string;
  body: string;
  ruleType: ProposalRuleType;
  proposedBy: string;
};

type UpdateProposalInput = {
  proposalId: string;
  title: string;
  body: string;
  ruleType: ProposalRuleType;
  implementationStatus?: GeotingImplementationStatus;
  implementationNote?: string;
};

type WithdrawProposalInput = {
  proposalId: string;
};

type VoteInput = {
  proposalId: string;
  playerId: string;
  vote: VoteValue;
  comment: string;
};

type PartyPositionInput = {
  proposalId: string;
  partyId: string;
  position: PartyPositionValue;
  comment: string;
  updatedBy: string;
};

type GeoterIndexAdjustmentInput = {
  playerId: string;
  delta: number;
  category: GeoterIndexCategory;
  title: string;
  reason: string;
  createdBy: string;
};

type GeoticOrderAssessmentInput = {
  playerId: string;
  rankId: GeoticOrderRankId;
  serviceWeeks: number;
  hiddenCategory: GeoticOrderHiddenCategory;
  status: GeoticOrderStatus;
  sponsor: string;
  trial: string;
  publicNote: string;
  internalNote: string;
  updatedBy: string;
};

type GeoticOrderPromotionVoteInput = {
  caseId: string;
  voterId: string;
  vote: GeoticOrderPromotionVoteValue;
  comment: string;
};

type PlayerProfileInput = {
  playerId: string;
  nickname: string | null;
  updatedBy: string;
};

type StartVoteInput = {
  proposalId: string;
  playerId: string;
  oathText: string;
};

type DbGameSessionRow = {
  id: string;
  game_id: GameId;
  number: number;
  date: string;
  title: string;
  context: string;
  status: RoundStatus;
  created_at: string;
  updated_at: string;
  results_json: GameResult[] | string;
};

type DbProposalRow = {
  id: string;
  title: string;
  body: string;
  rule_type: ProposalRuleType;
  proposed_by: string;
  status: GeotingProposalStatus;
  created_at: string;
  updated_at: string;
  vote_started_at: string | null;
  vote_ends_at: string | null;
  vote_started_by: string | null;
  oath_text: string | null;
  resolved_at: string | null;
  implementation_status: GeotingImplementationStatus | null;
  implementation_note: string | null;
  implemented_at: string | null;
  party_positions_json: GeotingPartyPosition[] | string | null;
  votes_json: GeotingVote[] | string;
};

type DbGeoterIndexAdjustmentRow = {
  id: string;
  player_id: string;
  delta: number;
  category: GeoterIndexCategory;
  title: string;
  reason: string;
  created_at: string;
  created_by: string;
};

type DbGeoticOrderAssessmentRow = {
  player_id: string;
  rank_id: GeoticOrderRankId;
  service_weeks: number;
  hidden_category: GeoticOrderHiddenCategory;
  status: GeoticOrderStatus;
  sponsor: string | null;
  trial: string | null;
  public_note: string | null;
  internal_note: string | null;
  updated_at: string;
  updated_by: string;
};

type DbGeoticOrderPromotionCaseRow = {
  id: string;
  player_id: string;
  from_rank_id: GeoticOrderRankId;
  target_rank_id: GeoticOrderRankId;
  status: GeoticOrderPromotionStatus;
  snapshot_json: GeoticOrderPromotionSnapshot | string;
  votes_json: GeoticOrderPromotionVote[] | string;
  public_note: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  opened_by: string;
};

type DbPlayerProfileRow = {
  player_id: string;
  nickname: string | null;
  updated_at: string;
  updated_by: string;
};

type GeocodeCacheEntry = {
  queryKey: string;
  location: GeoLocation | null;
  updatedAt: string;
};

type DbGeocodeCacheRow = {
  query_key: string;
  result_json: GeoLocation | string | null;
  updated_at: string;
};

type DbSlowGeoUsedChallengeRow = {
  candidate_id: string;
  pano_id: string | null;
  round_id: string | null;
  challenge_id: string | null;
  used_at: string;
  reason: SlowGeoUsedChallengeReason | string;
};

type RoundLocationData = {
  answerLocation: GeoLocation | null;
  mapSnapshot: RoundMapSnapshot | null;
  challenge?: SlowGeoChallenge | null;
  slowGeoMode?: SlowGeoMode;
  slowGeoEraId?: string | null;
  slowGeoStartedBy?: string | null;
  slowGeoStartedAt?: string | null;
  deadlineAt?: string | null;
  revealedAt?: string | null;
};

type FileState = {
  meta?: Record<string, string>;
  rounds: Round[];
  gameSessions: GameSession[];
  geotingProposals: GeotingProposal[];
  geoterIndexAdjustments: GeoterIndexAdjustment[];
  geoticOrderAssessments: GeoticOrderAssessment[];
  geoticOrderPromotionCases: GeoticOrderPromotionCase[];
  playerProfiles: PlayerProfile[];
  geocodeCache: GeocodeCacheEntry[];
  slowGeoUsedChallenges: SlowGeoUsedChallenge[];
};

const dataFile =
  process.env.GEOTIA_DATA_FILE ||
  (process.env.VERCEL
    ? path.join("/tmp", "geotia-data.json")
    : path.join(process.cwd(), ".data", "geotia-data.json"));
const backupDataFile = `${dataFile}.bak`;
const fileStateSchemaVersion = "3";

let schemaReady = false;
type SqlClient = ReturnType<typeof import("@neondatabase/serverless").neon>;
let sqlClient: SqlClient | null | undefined;
let schemaReadyPromise: Promise<SqlClient | null> | null = null;
let fileWriteQueue: Promise<void> = Promise.resolve();
let fileBackupSlowGeoUsedChallengeCache: SlowGeoUsedChallenge[] | null = null;

export function getStorageMode() {
  if (process.env.GEOTIA_FORCE_FILE_STORAGE === "1") return "Lokal filprotokoll";
  if (process.env.DATABASE_URL) return "Neon/Postgres";
  if (process.env.VERCEL) return "Midlertidig Vercel-lager";
  return "Lokal filprotokoll";
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeRoundStatus(status: RoundStatus | string | undefined): RoundStatus {
  if (status === "open" || status === "revealed" || status === "locked") return status;
  return "draft";
}

function normalizeRound(round: Round): Round {
  const existing = new Map(round.results.map((result) => [result.playerId, result]));
  const results = competingPlayers.map((player) => {
    const result = existing.get(player.id);
    return result
      ? {
          ...result,
          guessText: result.guessText ?? "",
          guessLocation: result.guessLocation ?? null,
          guessUpdatedAt: result.guessUpdatedAt ?? null,
          distanceSource: result.distanceSource ?? null,
          note: result.note ?? "",
        }
      : {
          playerId: player.id,
          status: "ikke_deltatt" as const,
          actualKm: null,
          guessText: "",
          guessLocation: null,
          guessUpdatedAt: null,
          distanceSource: null,
          note: "",
        };
  });
  const answerLocation = round.answerLocation ?? null;
  const status = normalizeRoundStatus(round.status);
  const challenge = round.challenge ?? null;
  return {
    ...round,
    status,
    answerLocation,
    challenge,
    slowGeoMode: normalizeSlowGeoMode(round.slowGeoMode),
    slowGeoEraId: challenge ? getSlowGeoEraId(round) : (round.slowGeoEraId ?? null),
    slowGeoStartedBy: round.slowGeoStartedBy ?? null,
    slowGeoStartedAt: round.slowGeoStartedAt ?? round.createdAt,
    deadlineAt: round.deadlineAt ?? null,
    revealedAt: round.revealedAt ?? null,
    results,
    mapSnapshot:
      status === "open"
        ? null
        : (round.mapSnapshot ?? buildRoundMapSnapshot({ answerLocation, players, results })),
  };
}

function normalizeGameSession(session: GameSession): GameSession {
  const existing = new Map(session.results.map((result) => [result.playerId, result]));
  return {
    ...session,
    results: competingPlayers.map((player) => {
      return (
        existing.get(player.id) ?? {
          playerId: player.id,
          status: "ikke_deltatt",
          score: null,
          note: "",
        }
      );
    }),
  };
}

function normalizeProposal(proposal: GeotingProposal): GeotingProposal {
  return {
    ...proposal,
    status: proposal.status ?? "open",
    voteStartedAt: proposal.voteStartedAt ?? null,
    voteEndsAt: proposal.voteEndsAt ?? null,
    voteStartedBy: proposal.voteStartedBy ?? null,
    oathText: proposal.oathText ?? "",
    resolvedAt: proposal.resolvedAt ?? null,
    implementationStatus: proposal.implementationStatus ?? "pending",
    implementationNote: proposal.implementationNote ?? "",
    implementedAt: proposal.implementedAt ?? null,
    partyPositions: proposal.partyPositions ?? [],
    votes: (proposal.votes ?? []).map((vote) => ({
      ...vote,
      vote: normalizeVoteValue(vote.vote),
      automatic: vote.automatic ?? false,
    })),
  };
}

function normalizeGeoticOrderPromotionCase(promotionCase: GeoticOrderPromotionCase): GeoticOrderPromotionCase {
  return {
    ...promotionCase,
    status: promotionCase.status ?? "pending",
    resolvedAt: promotionCase.resolvedAt ?? null,
    publicNote: promotionCase.publicNote ?? "",
    internalNote: promotionCase.internalNote ?? "",
    openedBy: promotionCase.openedBy ?? "system",
    snapshot: {
      serviceWeeks: Math.max(0, Math.round(promotionCase.snapshot?.serviceWeeks ?? 0)),
      roundsPlayed: Math.max(0, Math.round(promotionCase.snapshot?.roundsPlayed ?? 0)),
      lifetimePoints: Math.max(0, Math.round(promotionCase.snapshot?.lifetimePoints ?? 0)),
      trustScore: Math.max(0, Math.round(promotionCase.snapshot?.trustScore ?? 0)),
      eligibleRankId: promotionCase.snapshot?.eligibleRankId ?? promotionCase.targetRankId,
    },
    votes: (promotionCase.votes ?? [])
      .filter((vote) => vote.vote === "for" || vote.vote === "mot")
      .map((vote) => ({
        voterId: vote.voterId,
        vote: vote.vote,
        comment: vote.comment ?? "",
        createdAt: vote.createdAt,
      })),
  };
}

function normalizePlayerProfile(profile: PlayerProfile): PlayerProfile {
  return {
    playerId: profile.playerId,
    nickname: normalizePlayerNickname(profile.nickname),
    updatedAt: profile.updatedAt ?? nowIso(),
    updatedBy: profile.updatedBy ?? profile.playerId,
  };
}

function cleanOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeSlowGeoUsedChallengeReason(value: unknown): SlowGeoUsedChallengeReason {
  return value === "created" || value === "replaced" || value === "backfilled" ? value : "backfilled";
}

function normalizeSlowGeoUsedChallenge(value: Partial<SlowGeoUsedChallenge>): SlowGeoUsedChallenge | null {
  const candidateId = cleanOptionalString(value.candidateId);
  if (!candidateId) return null;

  return {
    candidateId,
    panoId: cleanOptionalString(value.panoId),
    roundId: cleanOptionalString(value.roundId),
    challengeId: cleanOptionalString(value.challengeId),
    usedAt: cleanOptionalString(value.usedAt) ?? nowIso(),
    reason: normalizeSlowGeoUsedChallengeReason(value.reason),
  };
}

function slowGeoUsedChallengeFromRound(
  round: Round,
  reason: SlowGeoUsedChallengeReason = "backfilled",
): SlowGeoUsedChallenge | null {
  if (!round.challenge?.candidateId) return null;
  return {
    candidateId: round.challenge.candidateId,
    panoId: round.challenge.panoId ?? null,
    roundId: round.id,
    challengeId: round.challenge.id,
    usedAt: round.challenge.createdAt ?? round.createdAt,
    reason,
  };
}

function slowGeoUsedChallengesFromRounds(
  rounds: Round[] | undefined,
  reason: SlowGeoUsedChallengeReason = "backfilled",
) {
  return (rounds ?? [])
    .map((round) => slowGeoUsedChallengeFromRound(round, reason))
    .filter((entry): entry is SlowGeoUsedChallenge => Boolean(entry));
}

function mergeSlowGeoUsedChallenges(...groups: Array<Array<Partial<SlowGeoUsedChallenge>> | undefined>) {
  const byCandidateId = new Map<string, SlowGeoUsedChallenge>();

  for (const group of groups) {
    for (const rawEntry of group ?? []) {
      const entry = normalizeSlowGeoUsedChallenge(rawEntry);
      if (!entry) continue;

      const existing = byCandidateId.get(entry.candidateId);
      if (!existing) {
        byCandidateId.set(entry.candidateId, entry);
        continue;
      }

      byCandidateId.set(entry.candidateId, {
        candidateId: existing.candidateId,
        panoId: existing.panoId ?? entry.panoId ?? null,
        roundId: existing.roundId ?? entry.roundId ?? null,
        challengeId: existing.challengeId ?? entry.challengeId ?? null,
        usedAt: existing.usedAt <= entry.usedAt ? existing.usedAt : entry.usedAt,
        reason: existing.reason === "backfilled" ? entry.reason : existing.reason,
      });
    }
  }

  return [...byCandidateId.values()].sort((a, b) => a.usedAt.localeCompare(b.usedAt));
}

async function readFileBackupSlowGeoUsedChallenges() {
  if (path.basename(dataFile) !== "geotia-data.json") return [];
  if (fileBackupSlowGeoUsedChallengeCache) return fileBackupSlowGeoUsedChallengeCache;

  const backupDir = path.join(path.dirname(dataFile), "backups");
  const usedChallenges: SlowGeoUsedChallenge[] = [];
  try {
    const files = await fs.readdir(backupDir);
    for (const file of files.filter((candidate) => candidate.endsWith(".json"))) {
      try {
        const raw = await fs.readFile(path.join(backupDir, file), "utf8");
        const parsed = parseFileState(raw);
        usedChallenges.push(...slowGeoUsedChallengesFromRounds(parsed?.rounds));
      } catch {
        // Broken historical snapshots should not block current SlowGeo operations.
      }
    }
  } catch {
    // No local backup history exists yet.
  }

  fileBackupSlowGeoUsedChallengeCache = mergeSlowGeoUsedChallenges(usedChallenges);
  return fileBackupSlowGeoUsedChallengeCache;
}

async function ensureFileState() {
  try {
    await fs.access(dataFile);
  } catch {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(
      dataFile,
      JSON.stringify(
        {
          meta: {},
          rounds: [],
          gameSessions: [],
          geotingProposals: [],
          geoterIndexAdjustments: [],
          geoticOrderAssessments: [],
          geoticOrderPromotionCases: [],
          playerProfiles: [],
          geocodeCache: [],
          slowGeoUsedChallenges: [],
        },
        null,
        2,
      ),
      "utf8",
    );
  }
}

async function readFileState(): Promise<FileState> {
  await ensureFileState();
  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = parseFileState(raw) ?? (await readBackupFileState());
  const rounds = (parsed.rounds ?? []).map(normalizeRound);
  const slowGeoUsedChallenges = mergeSlowGeoUsedChallenges(
    parsed.slowGeoUsedChallenges,
    slowGeoUsedChallengesFromRounds(rounds),
  );
  return {
    meta: {
      schemaVersion: "1",
      ...(parsed.meta ?? {}),
    },
    rounds,
    gameSessions: (parsed.gameSessions ?? []).map(normalizeGameSession),
    geotingProposals: (parsed.geotingProposals ?? []).map(normalizeProposal),
    geoterIndexAdjustments: parsed.geoterIndexAdjustments ?? [],
    geoticOrderAssessments: parsed.geoticOrderAssessments ?? [],
    geoticOrderPromotionCases: (parsed.geoticOrderPromotionCases ?? []).map(normalizeGeoticOrderPromotionCase),
    playerProfiles: (parsed.playerProfiles ?? []).map(normalizePlayerProfile),
    geocodeCache: parsed.geocodeCache ?? [],
    slowGeoUsedChallenges,
  };
}

function parseFileState(raw: string): Partial<FileState> | null {
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw) as Partial<FileState>;
  } catch {
    return null;
  }
}

async function readBackupFileState(): Promise<Partial<FileState>> {
  try {
    const raw = await fs.readFile(backupDataFile, "utf8");
    const parsed = parseFileState(raw);
    if (parsed) return parsed;
  } catch {
    // No backup exists yet. The original parse error below is more useful than this branch.
  }
  throw new Error("Geotia-protokollen kunne ikke leses. Hovedfil og backup mangler gyldig JSON.");
}

async function writeFileStateUnlocked(state: FileState) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  const tempFile = `${dataFile}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;
  const timestamp = nowIso();
  const stateToWrite: FileState = {
    ...state,
    meta: {
      ...(state.meta ?? {}),
      schemaVersion: fileStateSchemaVersion,
      lastWriteAt: timestamp,
    },
  };
  await fs.writeFile(tempFile, JSON.stringify(stateToWrite, null, 2), "utf8");
  await writeTimestampedBackup(timestamp);
  try {
    await fs.copyFile(dataFile, backupDataFile);
  } catch {
    // First write has nothing to back up yet.
  }
  try {
    await fs.rename(tempFile, dataFile);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "EPERM" && code !== "EEXIST") throw error;
    await fs.copyFile(tempFile, dataFile);
    await fs.rm(tempFile, { force: true });
  }
}

async function writeTimestampedBackup(timestamp: string) {
  try {
    const backupDir = path.join(path.dirname(dataFile), "backups");
    const backupName = `geotia-data-${timestamp.replace(/[:.]/g, "-")}.json`;
    await fs.mkdir(backupDir, { recursive: true });
    await fs.copyFile(dataFile, path.join(backupDir, backupName));
  } catch {
    // Backups are best-effort; the primary atomic write should not fail because of the archive copy.
  }
}

async function writeFileState(state: FileState) {
  const nextWrite = fileWriteQueue.then(
    () => writeFileStateUnlocked(state),
    () => writeFileStateUnlocked(state),
  );
  fileWriteQueue = nextWrite.catch(() => undefined);
  return nextWrite;
}

async function readFileRounds(): Promise<Round[]> {
  return (await readFileState()).rounds;
}

async function writeFileRounds(rounds: Round[]) {
  const state = await readFileState();
  await writeFileState({ ...state, rounds });
}

async function getSql(): Promise<SqlClient | null> {
  if (process.env.GEOTIA_FORCE_FILE_STORAGE === "1") return null;
  if (sqlClient !== undefined) return sqlClient;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    sqlClient = null;
    return null;
  }

  const { neon } = await import("@neondatabase/serverless");
  sqlClient = neon(databaseUrl);
  return sqlClient;
}

async function ensureSchema(): Promise<SqlClient | null> {
  const sql = await getSql();
  if (!sql || schemaReady) return sql;
  schemaReadyPromise ??= setupSchema(sql).catch((error) => {
    schemaReadyPromise = null;
    throw error;
  });
  return schemaReadyPromise;
}

async function setupSchema(sql: SqlClient): Promise<SqlClient> {
  await sql`
    CREATE TABLE IF NOT EXISTS geotia_meta (
      key text PRIMARY KEY,
      value text NOT NULL,
      updated_at text NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS geotia_slowgeo_used_challenges (
      candidate_id text PRIMARY KEY,
      pano_id text,
      round_id text,
      challenge_id text,
      used_at text NOT NULL,
      reason text NOT NULL
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS geotia_slowgeo_used_challenges_pano_id_idx
    ON geotia_slowgeo_used_challenges (pano_id)
    WHERE pano_id IS NOT NULL
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS geotia_rounds (
      id text PRIMARY KEY,
      number integer NOT NULL,
      date text NOT NULL,
      name text NOT NULL,
      answer text NOT NULL,
      country text NOT NULL,
      continent text NOT NULL,
      comment text NOT NULL,
      status text NOT NULL,
      created_at text NOT NULL,
      updated_at text NOT NULL,
      results_json jsonb NOT NULL DEFAULT '[]'::jsonb
    )
  `;
  await sql`ALTER TABLE geotia_rounds ADD COLUMN IF NOT EXISTS location_json jsonb`;
  await sql`
    CREATE TABLE IF NOT EXISTS geotia_game_sessions (
      id text PRIMARY KEY,
      game_id text NOT NULL,
      number integer NOT NULL,
      date text NOT NULL,
      title text NOT NULL,
      context text NOT NULL,
      status text NOT NULL,
      created_at text NOT NULL,
      updated_at text NOT NULL,
      results_json jsonb NOT NULL DEFAULT '[]'::jsonb
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS geotia_geoting_proposals (
      id text PRIMARY KEY,
      title text NOT NULL,
      body text NOT NULL,
      rule_type text NOT NULL,
      proposed_by text NOT NULL,
      status text NOT NULL,
      created_at text NOT NULL,
      updated_at text NOT NULL,
      votes_json jsonb NOT NULL DEFAULT '[]'::jsonb
    )
  `;
  await sql`ALTER TABLE geotia_geoting_proposals ADD COLUMN IF NOT EXISTS vote_started_at text`;
  await sql`ALTER TABLE geotia_geoting_proposals ADD COLUMN IF NOT EXISTS vote_ends_at text`;
  await sql`ALTER TABLE geotia_geoting_proposals ADD COLUMN IF NOT EXISTS vote_started_by text`;
  await sql`ALTER TABLE geotia_geoting_proposals ADD COLUMN IF NOT EXISTS oath_text text`;
  await sql`ALTER TABLE geotia_geoting_proposals ADD COLUMN IF NOT EXISTS resolved_at text`;
  await sql`ALTER TABLE geotia_geoting_proposals ADD COLUMN IF NOT EXISTS implementation_status text`;
  await sql`ALTER TABLE geotia_geoting_proposals ADD COLUMN IF NOT EXISTS implementation_note text`;
  await sql`ALTER TABLE geotia_geoting_proposals ADD COLUMN IF NOT EXISTS implemented_at text`;
  await sql`ALTER TABLE geotia_geoting_proposals ADD COLUMN IF NOT EXISTS party_positions_json jsonb`;

  await sql`
    CREATE TABLE IF NOT EXISTS geotia_geoter_index_adjustments (
      id text PRIMARY KEY,
      player_id text NOT NULL,
      delta integer NOT NULL,
      category text NOT NULL,
      title text NOT NULL,
      reason text NOT NULL,
      created_at text NOT NULL,
      created_by text NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS geotia_geotic_order_assessments (
      player_id text PRIMARY KEY,
      rank_id text NOT NULL,
      service_weeks integer NOT NULL,
      hidden_category text NOT NULL,
      status text NOT NULL,
      sponsor text NOT NULL,
      trial text NOT NULL,
      public_note text NOT NULL,
      internal_note text NOT NULL,
      updated_at text NOT NULL,
      updated_by text NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS geotia_geotic_order_promotion_cases (
      id text PRIMARY KEY,
      player_id text NOT NULL,
      from_rank_id text NOT NULL,
      target_rank_id text NOT NULL,
      status text NOT NULL,
      snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
      votes_json jsonb NOT NULL DEFAULT '[]'::jsonb,
      public_note text NOT NULL,
      internal_note text NOT NULL,
      created_at text NOT NULL,
      updated_at text NOT NULL,
      resolved_at text,
      opened_by text NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS geotia_player_profiles (
      player_id text PRIMARY KEY,
      nickname text,
      updated_at text NOT NULL,
      updated_by text NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS geotia_geocode_cache (
      query_key text PRIMARY KEY,
      result_json jsonb,
      updated_at text NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS geotia_rounds_status_number_idx ON geotia_rounds (status, number DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS geotia_rounds_slowgeo_deadline_idx ON geotia_rounds ((location_json ->> 'deadlineAt')) WHERE status = 'open'`;
  await sql`CREATE INDEX IF NOT EXISTS geotia_game_sessions_game_number_idx ON geotia_game_sessions (game_id, number DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS geotia_geoting_proposals_status_vote_ends_idx ON geotia_geoting_proposals (status, vote_ends_at)`;
  await sql`CREATE INDEX IF NOT EXISTS geotia_order_promotion_cases_status_idx ON geotia_geotic_order_promotion_cases (status, updated_at DESC)`;

  schemaReady = true;
  return sql;
}

function parseRoundLocationData(value: RoundLocationData | string | null | undefined): RoundLocationData {
  if (!value) {
    return {
      answerLocation: null,
      mapSnapshot: null,
      challenge: null,
      slowGeoMode: "static",
      slowGeoEraId: null,
      deadlineAt: null,
      revealedAt: null,
    };
  }
  const parsed = typeof value === "string" ? (JSON.parse(value) as Partial<RoundLocationData>) : value;
  return {
    answerLocation: parsed.answerLocation ?? null,
    mapSnapshot: parsed.mapSnapshot ?? null,
    challenge: parsed.challenge ?? null,
    slowGeoMode: normalizeSlowGeoMode(parsed.slowGeoMode),
    slowGeoEraId: parsed.slowGeoEraId ?? null,
    slowGeoStartedBy: parsed.slowGeoStartedBy ?? null,
    slowGeoStartedAt: parsed.slowGeoStartedAt ?? null,
    deadlineAt: parsed.deadlineAt ?? null,
    revealedAt: parsed.revealedAt ?? null,
  };
}

function parseDbRound(row: DbRoundRow): Round {
  const results =
    typeof row.results_json === "string"
      ? (JSON.parse(row.results_json) as PlayerResult[])
      : row.results_json;
  const locationData = parseRoundLocationData(row.location_json);

  return normalizeRound({
    id: row.id,
    number: row.number,
    date: row.date,
    name: row.name,
    answer: row.answer,
    answerLocation: locationData.answerLocation,
    mapSnapshot: locationData.mapSnapshot,
    challenge: locationData.challenge ?? null,
    slowGeoMode: locationData.slowGeoMode,
    slowGeoEraId: locationData.slowGeoEraId,
    slowGeoStartedBy: locationData.slowGeoStartedBy,
    slowGeoStartedAt: locationData.slowGeoStartedAt,
    deadlineAt: locationData.deadlineAt ?? null,
    revealedAt: locationData.revealedAt ?? null,
    country: row.country,
    continent: row.continent,
    comment: row.comment,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    results,
  });
}

function parseDbGameSession(row: DbGameSessionRow): GameSession {
  const results =
    typeof row.results_json === "string"
      ? (JSON.parse(row.results_json) as GameResult[])
      : row.results_json;

  return normalizeGameSession({
    id: row.id,
    gameId: row.game_id,
    number: row.number,
    date: row.date,
    title: row.title,
    context: row.context,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    results,
  });
}

function parseDbProposal(row: DbProposalRow): GeotingProposal {
  const votes =
    typeof row.votes_json === "string"
      ? (JSON.parse(row.votes_json) as GeotingVote[])
      : row.votes_json;
  const partyPositions =
    typeof row.party_positions_json === "string"
      ? (JSON.parse(row.party_positions_json) as GeotingPartyPosition[])
      : (row.party_positions_json ?? []);

  return normalizeProposal({
    id: row.id,
    title: row.title,
    body: row.body,
    ruleType: row.rule_type,
    proposedBy: row.proposed_by,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    voteStartedAt: row.vote_started_at,
    voteEndsAt: row.vote_ends_at,
    voteStartedBy: row.vote_started_by,
    oathText: row.oath_text ?? "",
    resolvedAt: row.resolved_at,
    implementationStatus: row.implementation_status ?? "pending",
    implementationNote: row.implementation_note ?? "",
    implementedAt: row.implemented_at,
    partyPositions,
    votes,
  });
}

function parseDbGeoterIndexAdjustment(row: DbGeoterIndexAdjustmentRow): GeoterIndexAdjustment {
  return {
    id: row.id,
    playerId: row.player_id,
    delta: row.delta,
    category: row.category,
    title: row.title,
    reason: row.reason,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function parseDbGeoticOrderAssessment(row: DbGeoticOrderAssessmentRow): GeoticOrderAssessment {
  return {
    playerId: row.player_id,
    rankId: row.rank_id,
    serviceWeeks: row.service_weeks,
    hiddenCategory: row.hidden_category,
    status: row.status,
    sponsor: row.sponsor ?? "",
    trial: row.trial ?? "",
    publicNote: row.public_note ?? "",
    internalNote: row.internal_note ?? "",
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function parseDbGeoticOrderPromotionCase(row: DbGeoticOrderPromotionCaseRow): GeoticOrderPromotionCase {
  const snapshot =
    typeof row.snapshot_json === "string"
      ? (JSON.parse(row.snapshot_json) as GeoticOrderPromotionSnapshot)
      : row.snapshot_json;
  const votes =
    typeof row.votes_json === "string"
      ? (JSON.parse(row.votes_json) as GeoticOrderPromotionVote[])
      : row.votes_json;

  return normalizeGeoticOrderPromotionCase({
    id: row.id,
    playerId: row.player_id,
    fromRankId: row.from_rank_id,
    targetRankId: row.target_rank_id,
    status: row.status,
    snapshot,
    votes,
    publicNote: row.public_note ?? "",
    internalNote: row.internal_note ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    openedBy: row.opened_by || "system",
  });
}

function parseDbPlayerProfile(row: DbPlayerProfileRow): PlayerProfile {
  return normalizePlayerProfile({
    playerId: row.player_id,
    nickname: row.nickname,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  });
}

function parseDbGeocodeCache(row: DbGeocodeCacheRow): GeocodeCacheEntry {
  return {
    queryKey: row.query_key,
    location:
      typeof row.result_json === "string"
        ? (JSON.parse(row.result_json) as GeoLocation | null)
        : row.result_json,
    updatedAt: row.updated_at,
  };
}

function parseDbSlowGeoUsedChallenge(row: DbSlowGeoUsedChallengeRow): SlowGeoUsedChallenge {
  return {
    candidateId: row.candidate_id,
    panoId: row.pano_id,
    roundId: row.round_id,
    challengeId: row.challenge_id,
    usedAt: row.used_at,
    reason: normalizeSlowGeoUsedChallengeReason(row.reason),
  };
}

async function readDbRounds(): Promise<Round[] | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT id, number, date, name, answer, country, continent, comment, status, created_at, updated_at, results_json, location_json
    FROM geotia_rounds
    ORDER BY number ASC
  `) as DbRoundRow[];

  return rows.map(parseDbRound);
}

async function readDbRoundById(id: string): Promise<Round | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT id, number, date, name, answer, country, continent, comment, status, created_at, updated_at, results_json, location_json
    FROM geotia_rounds
    WHERE id = ${id}
    LIMIT 1
  `) as DbRoundRow[];

  return rows[0] ? parseDbRound(rows[0]) : null;
}

async function readDbActiveSlowGeoRounds(): Promise<Round[] | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT id, number, date, name, answer, country, continent, comment, status, created_at, updated_at, results_json, location_json
    FROM geotia_rounds
    WHERE status = 'open'
      AND location_json -> 'challenge' IS NOT NULL
      AND location_json ->> 'deadlineAt' IS NOT NULL
    ORDER BY COALESCE(location_json ->> 'slowGeoStartedAt', created_at) ASC, number ASC
  `) as DbRoundRow[];

  return rows.map(parseDbRound);
}

async function upsertDbRound(round: Round) {
  const sql = await ensureSchema();
  if (!sql) return false;

  await sql`
    INSERT INTO geotia_rounds (
      id, number, date, name, answer, country, continent, comment, status, created_at, updated_at, results_json, location_json
    )
    VALUES (
      ${round.id},
      ${round.number},
      ${round.date},
      ${round.name},
      ${round.answer},
      ${round.country},
      ${round.continent},
      ${round.comment},
      ${round.status},
      ${round.createdAt},
      ${round.updatedAt},
      ${JSON.stringify(round.results)}::jsonb,
      ${JSON.stringify({
        answerLocation: round.answerLocation ?? null,
        mapSnapshot: round.mapSnapshot ?? null,
        challenge: round.challenge ?? null,
        slowGeoMode: getSlowGeoMode(round),
        slowGeoEraId: round.challenge ? getSlowGeoEraId(round) : (round.slowGeoEraId ?? null),
        slowGeoStartedBy: round.slowGeoStartedBy ?? null,
        slowGeoStartedAt: round.slowGeoStartedAt ?? round.createdAt,
        deadlineAt: round.deadlineAt ?? null,
        revealedAt: round.revealedAt ?? null,
      })}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      date = EXCLUDED.date,
      name = EXCLUDED.name,
      answer = EXCLUDED.answer,
      country = EXCLUDED.country,
      continent = EXCLUDED.continent,
      comment = EXCLUDED.comment,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at,
      results_json = EXCLUDED.results_json,
      location_json = EXCLUDED.location_json
  `;
  return true;
}

async function deleteDbRound(id: string) {
  const sql = await ensureSchema();
  if (!sql) return false;

  await sql`DELETE FROM geotia_rounds WHERE id = ${id}`;
  return true;
}

async function readDbGameSessions(): Promise<GameSession[] | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT id, game_id, number, date, title, context, status, created_at, updated_at, results_json
    FROM geotia_game_sessions
    ORDER BY number ASC
  `) as DbGameSessionRow[];

  return rows.map(parseDbGameSession);
}

async function upsertDbGameSession(session: GameSession) {
  const sql = await ensureSchema();
  if (!sql) return false;

  await sql`
    INSERT INTO geotia_game_sessions (
      id, game_id, number, date, title, context, status, created_at, updated_at, results_json
    )
    VALUES (
      ${session.id},
      ${session.gameId},
      ${session.number},
      ${session.date},
      ${session.title},
      ${session.context},
      ${session.status},
      ${session.createdAt},
      ${session.updatedAt},
      ${JSON.stringify(session.results)}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      game_id = EXCLUDED.game_id,
      date = EXCLUDED.date,
      title = EXCLUDED.title,
      context = EXCLUDED.context,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at,
      results_json = EXCLUDED.results_json
  `;
  return true;
}

async function readDbProposals(): Promise<GeotingProposal[] | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT
      id,
      title,
      body,
      rule_type,
      proposed_by,
      status,
      created_at,
      updated_at,
      vote_started_at,
      vote_ends_at,
      vote_started_by,
      oath_text,
      resolved_at,
      implementation_status,
      implementation_note,
      implemented_at,
      party_positions_json,
      votes_json
    FROM geotia_geoting_proposals
    ORDER BY created_at DESC
  `) as DbProposalRow[];

  return rows.map(parseDbProposal);
}

async function readDbActiveGeotingProposals(): Promise<GeotingProposal[] | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT
      id,
      title,
      body,
      rule_type,
      proposed_by,
      status,
      created_at,
      updated_at,
      vote_started_at,
      vote_ends_at,
      vote_started_by,
      oath_text,
      resolved_at,
      implementation_status,
      implementation_note,
      implemented_at,
      party_positions_json,
      votes_json
    FROM geotia_geoting_proposals
    WHERE status = 'voting'
      AND vote_ends_at IS NOT NULL
    ORDER BY vote_ends_at ASC
  `) as DbProposalRow[];

  return rows.map(parseDbProposal);
}

async function upsertDbProposal(proposal: GeotingProposal) {
  const sql = await ensureSchema();
  if (!sql) return false;

  await sql`
    INSERT INTO geotia_geoting_proposals (
      id,
      title,
      body,
      rule_type,
      proposed_by,
      status,
      created_at,
      updated_at,
      vote_started_at,
      vote_ends_at,
      vote_started_by,
      oath_text,
      resolved_at,
      implementation_status,
      implementation_note,
      implemented_at,
      party_positions_json,
      votes_json
    )
    VALUES (
      ${proposal.id},
      ${proposal.title},
      ${proposal.body},
      ${proposal.ruleType},
      ${proposal.proposedBy},
      ${proposal.status},
      ${proposal.createdAt},
      ${proposal.updatedAt},
      ${proposal.voteStartedAt ?? null},
      ${proposal.voteEndsAt ?? null},
      ${proposal.voteStartedBy ?? null},
      ${proposal.oathText ?? ""},
      ${proposal.resolvedAt ?? null},
      ${proposal.implementationStatus ?? "pending"},
      ${proposal.implementationNote ?? ""},
      ${proposal.implementedAt ?? null},
      ${JSON.stringify(proposal.partyPositions ?? [])}::jsonb,
      ${JSON.stringify(proposal.votes)}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      rule_type = EXCLUDED.rule_type,
      proposed_by = EXCLUDED.proposed_by,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at,
      vote_started_at = EXCLUDED.vote_started_at,
      vote_ends_at = EXCLUDED.vote_ends_at,
      vote_started_by = EXCLUDED.vote_started_by,
      oath_text = EXCLUDED.oath_text,
      resolved_at = EXCLUDED.resolved_at,
      implementation_status = EXCLUDED.implementation_status,
      implementation_note = EXCLUDED.implementation_note,
      implemented_at = EXCLUDED.implemented_at,
      party_positions_json = EXCLUDED.party_positions_json,
      votes_json = EXCLUDED.votes_json
  `;
  return true;
}

async function readDbGeoterIndexAdjustments(): Promise<GeoterIndexAdjustment[] | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT id, player_id, delta, category, title, reason, created_at, created_by
    FROM geotia_geoter_index_adjustments
    ORDER BY created_at ASC
  `) as DbGeoterIndexAdjustmentRow[];

  return rows.map(parseDbGeoterIndexAdjustment);
}

async function upsertDbGeoterIndexAdjustment(adjustment: GeoterIndexAdjustment) {
  const sql = await ensureSchema();
  if (!sql) return false;

  await sql`
    INSERT INTO geotia_geoter_index_adjustments (
      id, player_id, delta, category, title, reason, created_at, created_by
    )
    VALUES (
      ${adjustment.id},
      ${adjustment.playerId},
      ${adjustment.delta},
      ${adjustment.category},
      ${adjustment.title},
      ${adjustment.reason},
      ${adjustment.createdAt},
      ${adjustment.createdBy}
    )
    ON CONFLICT (id) DO UPDATE SET
      player_id = EXCLUDED.player_id,
      delta = EXCLUDED.delta,
      category = EXCLUDED.category,
      title = EXCLUDED.title,
      reason = EXCLUDED.reason,
      created_at = EXCLUDED.created_at,
      created_by = EXCLUDED.created_by
  `;
  return true;
}

async function readDbGeoticOrderAssessments(): Promise<GeoticOrderAssessment[] | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT
      player_id,
      rank_id,
      service_weeks,
      hidden_category,
      status,
      sponsor,
      trial,
      public_note,
      internal_note,
      updated_at,
      updated_by
    FROM geotia_geotic_order_assessments
    ORDER BY updated_at DESC
  `) as DbGeoticOrderAssessmentRow[];

  return rows.map(parseDbGeoticOrderAssessment);
}

async function upsertDbGeoticOrderAssessment(assessment: GeoticOrderAssessment) {
  const sql = await ensureSchema();
  if (!sql) return false;

  await sql`
    INSERT INTO geotia_geotic_order_assessments (
      player_id,
      rank_id,
      service_weeks,
      hidden_category,
      status,
      sponsor,
      trial,
      public_note,
      internal_note,
      updated_at,
      updated_by
    )
    VALUES (
      ${assessment.playerId},
      ${assessment.rankId},
      ${assessment.serviceWeeks},
      ${assessment.hiddenCategory},
      ${assessment.status},
      ${assessment.sponsor},
      ${assessment.trial},
      ${assessment.publicNote},
      ${assessment.internalNote},
      ${assessment.updatedAt},
      ${assessment.updatedBy}
    )
    ON CONFLICT (player_id) DO UPDATE SET
      rank_id = EXCLUDED.rank_id,
      service_weeks = EXCLUDED.service_weeks,
      hidden_category = EXCLUDED.hidden_category,
      status = EXCLUDED.status,
      sponsor = EXCLUDED.sponsor,
      trial = EXCLUDED.trial,
      public_note = EXCLUDED.public_note,
      internal_note = EXCLUDED.internal_note,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by
  `;
  return true;
}

async function readDbGeoticOrderPromotionCases(): Promise<GeoticOrderPromotionCase[] | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT
      id,
      player_id,
      from_rank_id,
      target_rank_id,
      status,
      snapshot_json,
      votes_json,
      public_note,
      internal_note,
      created_at,
      updated_at,
      resolved_at,
      opened_by
    FROM geotia_geotic_order_promotion_cases
    ORDER BY updated_at DESC
  `) as DbGeoticOrderPromotionCaseRow[];

  return rows.map(parseDbGeoticOrderPromotionCase);
}

async function upsertDbGeoticOrderPromotionCase(promotionCase: GeoticOrderPromotionCase) {
  const sql = await ensureSchema();
  if (!sql) return false;

  await sql`
    INSERT INTO geotia_geotic_order_promotion_cases (
      id,
      player_id,
      from_rank_id,
      target_rank_id,
      status,
      snapshot_json,
      votes_json,
      public_note,
      internal_note,
      created_at,
      updated_at,
      resolved_at,
      opened_by
    )
    VALUES (
      ${promotionCase.id},
      ${promotionCase.playerId},
      ${promotionCase.fromRankId},
      ${promotionCase.targetRankId},
      ${promotionCase.status},
      ${JSON.stringify(promotionCase.snapshot)}::jsonb,
      ${JSON.stringify(promotionCase.votes)}::jsonb,
      ${promotionCase.publicNote},
      ${promotionCase.internalNote},
      ${promotionCase.createdAt},
      ${promotionCase.updatedAt},
      ${promotionCase.resolvedAt ?? null},
      ${promotionCase.openedBy}
    )
    ON CONFLICT (id) DO UPDATE SET
      player_id = EXCLUDED.player_id,
      from_rank_id = EXCLUDED.from_rank_id,
      target_rank_id = EXCLUDED.target_rank_id,
      status = EXCLUDED.status,
      snapshot_json = EXCLUDED.snapshot_json,
      votes_json = EXCLUDED.votes_json,
      public_note = EXCLUDED.public_note,
      internal_note = EXCLUDED.internal_note,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at,
      resolved_at = EXCLUDED.resolved_at,
      opened_by = EXCLUDED.opened_by
  `;
  return true;
}

async function readDbPlayerProfiles(): Promise<PlayerProfile[] | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT player_id, nickname, updated_at, updated_by
    FROM geotia_player_profiles
    ORDER BY player_id ASC
  `) as DbPlayerProfileRow[];

  return rows.map(parseDbPlayerProfile);
}

async function upsertDbPlayerProfile(profile: PlayerProfile) {
  const sql = await ensureSchema();
  if (!sql) return false;

  await sql`
    INSERT INTO geotia_player_profiles (player_id, nickname, updated_at, updated_by)
    VALUES (${profile.playerId}, ${profile.nickname}, ${profile.updatedAt}, ${profile.updatedBy})
    ON CONFLICT (player_id) DO UPDATE SET
      nickname = EXCLUDED.nickname,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by
  `;
  return true;
}

async function readDbGeocodeCache(queryKey: string): Promise<GeocodeCacheEntry | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT query_key, result_json, updated_at
    FROM geotia_geocode_cache
    WHERE query_key = ${queryKey}
    LIMIT 1
  `) as DbGeocodeCacheRow[];

  return rows[0] ? parseDbGeocodeCache(rows[0]) : null;
}

async function upsertDbGeocodeCache(entry: GeocodeCacheEntry) {
  const sql = await ensureSchema();
  if (!sql) return false;

  await sql`
    INSERT INTO geotia_geocode_cache (query_key, result_json, updated_at)
    VALUES (${entry.queryKey}, ${JSON.stringify(entry.location)}::jsonb, ${entry.updatedAt})
    ON CONFLICT (query_key) DO UPDATE SET
      result_json = EXCLUDED.result_json,
      updated_at = EXCLUDED.updated_at
  `;
  return true;
}

async function readDbSlowGeoUsedChallenges(): Promise<SlowGeoUsedChallenge[] | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT candidate_id, pano_id, round_id, challenge_id, used_at, reason
    FROM geotia_slowgeo_used_challenges
    ORDER BY used_at ASC, candidate_id ASC
  `) as DbSlowGeoUsedChallengeRow[];

  return rows.map(parseDbSlowGeoUsedChallenge);
}

async function upsertDbSlowGeoUsedChallenge(entry: Partial<SlowGeoUsedChallenge>) {
  const sql = await ensureSchema();
  const normalized = normalizeSlowGeoUsedChallenge(entry);
  if (!sql || !normalized) return false;

  await sql`
    INSERT INTO geotia_slowgeo_used_challenges (
      candidate_id, pano_id, round_id, challenge_id, used_at, reason
    )
    VALUES (
      ${normalized.candidateId},
      ${normalized.panoId ?? null},
      ${normalized.roundId ?? null},
      ${normalized.challengeId ?? null},
      ${normalized.usedAt},
      ${normalized.reason}
    )
    ON CONFLICT (candidate_id) DO UPDATE SET
      pano_id = COALESCE(geotia_slowgeo_used_challenges.pano_id, EXCLUDED.pano_id),
      round_id = COALESCE(geotia_slowgeo_used_challenges.round_id, EXCLUDED.round_id),
      challenge_id = COALESCE(geotia_slowgeo_used_challenges.challenge_id, EXCLUDED.challenge_id),
      used_at = CASE
        WHEN geotia_slowgeo_used_challenges.used_at <= EXCLUDED.used_at
          THEN geotia_slowgeo_used_challenges.used_at
        ELSE EXCLUDED.used_at
      END,
      reason = CASE
        WHEN geotia_slowgeo_used_challenges.reason = 'backfilled'
          THEN EXCLUDED.reason
        ELSE geotia_slowgeo_used_challenges.reason
      END
  `;
  return true;
}

async function upsertDbSlowGeoUsedChallenges(entries: Partial<SlowGeoUsedChallenge>[]) {
  await Promise.all(entries.map(upsertDbSlowGeoUsedChallenge));
}

async function readRounds(): Promise<Round[]> {
  const dbRounds = await readDbRounds();
  if (dbRounds) return dbRounds;
  return readFileRounds();
}

async function readSlowGeoUsedChallenges(rounds: Round[]) {
  const backfilled = slowGeoUsedChallengesFromRounds(rounds);
  const dbUsedChallenges = await readDbSlowGeoUsedChallenges();
  if (dbUsedChallenges) {
    const merged = mergeSlowGeoUsedChallenges(dbUsedChallenges, backfilled);
    const knownCandidateIds = new Set(dbUsedChallenges.map((entry) => entry.candidateId));
    const missingBackfill = backfilled.filter((entry) => !knownCandidateIds.has(entry.candidateId));
    if (missingBackfill.length > 0) {
      await upsertDbSlowGeoUsedChallenges(missingBackfill);
    }
    return merged;
  }

  const state = await readFileState();
  return mergeSlowGeoUsedChallenges(
    state.slowGeoUsedChallenges,
    backfilled,
    await readFileBackupSlowGeoUsedChallenges(),
  );
}

function slowGeoUsedCandidateIds(usedChallenges: SlowGeoUsedChallenge[]) {
  return usedChallenges.map((entry) => entry.candidateId);
}

function slowGeoUsedPanoIds(usedChallenges: SlowGeoUsedChallenge[]) {
  return usedChallenges.flatMap((entry) => (entry.panoId ? [entry.panoId] : []));
}

async function readGameSessions(): Promise<GameSession[]> {
  const dbSessions = await readDbGameSessions();
  if (dbSessions) return dbSessions;
  return (await readFileState()).gameSessions;
}

async function readProposals(): Promise<GeotingProposal[]> {
  const dbProposals = await readDbProposals();
  return dbProposals ?? (await readFileState()).geotingProposals;
}

async function readGeoterIndexAdjustments(): Promise<GeoterIndexAdjustment[]> {
  const dbAdjustments = await readDbGeoterIndexAdjustments();
  if (dbAdjustments) return dbAdjustments;
  return (await readFileState()).geoterIndexAdjustments;
}

async function readGeoticOrderAssessments(): Promise<GeoticOrderAssessment[]> {
  const dbAssessments = await readDbGeoticOrderAssessments();
  if (dbAssessments) return dbAssessments;
  return (await readFileState()).geoticOrderAssessments;
}

async function readGeoticOrderPromotionCases(): Promise<GeoticOrderPromotionCase[]> {
  const dbCases = await readDbGeoticOrderPromotionCases();
  if (dbCases) return dbCases;
  return (await readFileState()).geoticOrderPromotionCases;
}

async function readPlayerProfiles(): Promise<PlayerProfile[]> {
  const dbProfiles = await readDbPlayerProfiles();
  if (dbProfiles) return dbProfiles;
  return (await readFileState()).playerProfiles;
}

async function readHydratedPlayers() {
  const profiles = await readPlayerProfiles();
  return applyPlayerProfiles(players, profiles);
}

async function saveRounds(rounds: Round[]) {
  const sql = await ensureSchema();
  if (sql) {
    await Promise.all(rounds.map(upsertDbRound));
    return;
  }
  await writeFileRounds(rounds);
}

async function saveRoundsAndSlowGeoUsedChallenges(
  rounds: Round[],
  usedChallenges: Partial<SlowGeoUsedChallenge>[],
) {
  const normalizedUsedChallenges = mergeSlowGeoUsedChallenges(
    slowGeoUsedChallengesFromRounds(rounds),
    usedChallenges,
  );
  const sql = await ensureSchema();
  if (sql) {
    await upsertDbSlowGeoUsedChallenges(normalizedUsedChallenges);
    await Promise.all(rounds.map(upsertDbRound));
    return;
  }

  const state = await readFileState();
  await writeFileState({
    ...state,
    rounds,
    slowGeoUsedChallenges: mergeSlowGeoUsedChallenges(
      state.slowGeoUsedChallenges,
      normalizedUsedChallenges,
    ),
  });
}

async function saveProposals(geotingProposals: GeotingProposal[]) {
  const sql = await ensureSchema();
  if (sql) {
    await Promise.all(geotingProposals.map(upsertDbProposal));
    return;
  }
  const state = await readFileState();
  await writeFileState({ ...state, geotingProposals });
}

async function saveGeoticOrderPromotionCases(geoticOrderPromotionCases: GeoticOrderPromotionCase[]) {
  const sql = await ensureSchema();
  if (sql) {
    await Promise.all(geoticOrderPromotionCases.map(upsertDbGeoticOrderPromotionCase));
    return;
  }
  const state = await readFileState();
  await writeFileState({ ...state, geoticOrderPromotionCases });
}

async function saveRoundRecord(round: Round, fileRounds?: Round[]) {
  const sql = await ensureSchema();
  if (sql) {
    await upsertDbRound(round);
    return;
  }

  const rounds = fileRounds ?? (await readFileRounds()).map((candidate) => (candidate.id === round.id ? round : candidate));
  await writeFileRounds(rounds);
}

async function saveGameSessionRecord(gameSession: GameSession, fileGameSessions?: GameSession[]) {
  const sql = await ensureSchema();
  if (sql) {
    await upsertDbGameSession(gameSession);
    return;
  }

  const state = await readFileState();
  const gameSessions =
    fileGameSessions ?? state.gameSessions.map((candidate) => (candidate.id === gameSession.id ? gameSession : candidate));
  await writeFileState({ ...state, gameSessions });
}

async function saveProposalRecord(proposal: GeotingProposal, fileProposals?: GeotingProposal[]) {
  const sql = await ensureSchema();
  if (sql) {
    await upsertDbProposal(proposal);
    return;
  }

  const state = await readFileState();
  const geotingProposals =
    fileProposals ?? state.geotingProposals.map((candidate) => (candidate.id === proposal.id ? proposal : candidate));
  await writeFileState({ ...state, geotingProposals });
}

async function saveGeoterIndexAdjustmentRecord(
  adjustment: GeoterIndexAdjustment,
  fileAdjustments?: GeoterIndexAdjustment[],
) {
  const sql = await ensureSchema();
  if (sql) {
    await upsertDbGeoterIndexAdjustment(adjustment);
    return;
  }

  const state = await readFileState();
  await writeFileState({ ...state, geoterIndexAdjustments: fileAdjustments ?? [...state.geoterIndexAdjustments, adjustment] });
}

async function saveGeoticOrderAssessmentRecord(
  assessment: GeoticOrderAssessment,
  fileAssessments?: GeoticOrderAssessment[],
) {
  const sql = await ensureSchema();
  if (sql) {
    await upsertDbGeoticOrderAssessment(assessment);
    return;
  }

  const state = await readFileState();
  const geoticOrderAssessments =
    fileAssessments ?? [
      assessment,
      ...state.geoticOrderAssessments.filter((candidate) => candidate.playerId !== assessment.playerId),
    ];
  await writeFileState({ ...state, geoticOrderAssessments });
}

async function saveGeoticOrderPromotionCaseRecord(
  promotionCase: GeoticOrderPromotionCase,
  filePromotionCases?: GeoticOrderPromotionCase[],
) {
  const sql = await ensureSchema();
  if (sql) {
    await upsertDbGeoticOrderPromotionCase(promotionCase);
    return;
  }

  const state = await readFileState();
  const geoticOrderPromotionCases =
    filePromotionCases ?? state.geoticOrderPromotionCases.map((candidate) => (
      candidate.id === promotionCase.id ? promotionCase : candidate
    ));
  await writeFileState({ ...state, geoticOrderPromotionCases });
}

async function savePlayerProfileRecord(profile: PlayerProfile, fileProfiles?: PlayerProfile[]) {
  const normalized = normalizePlayerProfile(profile);
  const sql = await ensureSchema();
  if (sql) {
    await upsertDbPlayerProfile(normalized);
    return;
  }

  const state = await readFileState();
  const playerProfiles =
    fileProfiles?.map(normalizePlayerProfile) ?? [
      normalized,
      ...state.playerProfiles.filter((candidate) => candidate.playerId !== normalized.playerId),
    ];
  await writeFileState({ ...state, playerProfiles });
}

export async function getCachedGeocodeLocation(queryKey: string) {
  const dbEntry = await readDbGeocodeCache(queryKey);
  if (dbEntry) return dbEntry.location;

  const state = await readFileState();
  return state.geocodeCache.find((entry) => entry.queryKey === queryKey)?.location ?? undefined;
}

export async function setCachedGeocodeLocation(queryKey: string, location: GeoLocation | null) {
  const entry: GeocodeCacheEntry = {
    queryKey,
    location,
    updatedAt: nowIso(),
  };
  const sql = await ensureSchema();
  if (sql) {
    await upsertDbGeocodeCache(entry);
    return entry;
  }

  const state = await readFileState();
  await writeFileState({
    ...state,
    geocodeCache: [
      entry,
      ...state.geocodeCache.filter((candidate) => candidate.queryKey !== queryKey),
    ].slice(0, 500),
  });
  return entry;
}

type PersistentState = Pick<
  FileState,
  | "rounds"
  | "gameSessions"
  | "geotingProposals"
  | "geoterIndexAdjustments"
  | "geoticOrderAssessments"
  | "geoticOrderPromotionCases"
  | "playerProfiles"
>;

async function readPersistentState(): Promise<PersistentState> {
  const sql = await getSql();
  if (!sql) {
    const state = await readFileState();
    return {
      rounds: state.rounds,
      gameSessions: state.gameSessions,
      geotingProposals: state.geotingProposals,
      geoterIndexAdjustments: state.geoterIndexAdjustments,
      geoticOrderAssessments: state.geoticOrderAssessments,
      geoticOrderPromotionCases: state.geoticOrderPromotionCases,
      playerProfiles: state.playerProfiles,
    };
  }

  const [
    rounds,
    gameSessions,
    geotingProposals,
    geoterIndexAdjustments,
    geoticOrderAssessments,
    geoticOrderPromotionCases,
    playerProfiles,
  ] = await Promise.all([
    readRounds(),
    readGameSessions(),
    readProposals(),
    readGeoterIndexAdjustments(),
    readGeoticOrderAssessments(),
    readGeoticOrderPromotionCases(),
    readPlayerProfiles(),
  ]);
  return {
    rounds,
    gameSessions,
    geotingProposals,
    geoterIndexAdjustments,
    geoticOrderAssessments,
    geoticOrderPromotionCases,
    playerProfiles,
  };
}

async function getAppStateUncached(): Promise<AppState> {
  const state = await readPersistentState();
  const hydratedPlayers = applyPlayerProfiles(players, state.playerProfiles);
  return {
    ...initialState,
    players: hydratedPlayers,
    parties,
    games,
    archive,
    ...state,
  };
}

export const getAppState = cache(getAppStateUncached);

export const getHydratedPlayerById = cache(async function getHydratedPlayerById(playerId: string) {
  const hydratedPlayers = await readHydratedPlayers();
  return hydratedPlayers.find((player) => player.id === playerId) ?? null;
});

export async function updatePlayerProfile(input: PlayerProfileInput) {
  if (!players.some((player) => player.id === input.playerId)) {
    return { ok: false, reason: "Ukjent geot i navneprotokollen." };
  }

  const existing = await readPlayerProfiles();
  const timestamp = nowIso();
  const profile = normalizePlayerProfile({
    playerId: input.playerId,
    nickname: normalizePlayerNickname(input.nickname),
    updatedAt: timestamp,
    updatedBy: input.updatedBy,
  });

  await savePlayerProfileRecord(profile, [
    profile,
    ...existing.filter((candidate) => candidate.playerId !== input.playerId),
  ]);
  return { ok: true, profile };
}

export const getActiveGeotingProposals = cache(async function getActiveGeotingProposals() {
  const dbProposals = await readDbActiveGeotingProposals();
  if (dbProposals) return dbProposals;

  const proposals = await readProposals();
  return proposals.filter((proposal) => proposal.status === "voting" && proposal.voteEndsAt);
});

export const getActiveSlowGeoRounds = cache(async function getActiveSlowGeoRounds() {
  const dbRounds = await readDbActiveSlowGeoRounds();
  if (dbRounds) return dbRounds;

  const rounds = await readRounds();
  return rounds
    .filter((round) => isSlowGeoOpenRound(round) && round.deadlineAt)
    .sort(slowGeoStartSort);
});

export const getAppShellState = cache(async function getAppShellState() {
  const sql = await getSql();
  if (!sql) {
    const state = await readFileState();
    const activeGeotingProposals = state.geotingProposals.filter(
      (proposal) => proposal.status === "voting" && proposal.voteEndsAt,
    );
    const activeSlowGeoRounds = state.rounds
      .filter((round) => isSlowGeoOpenRound(round) && round.deadlineAt)
      .sort(slowGeoStartSort);
    return { activeGeotingProposals, activeSlowGeoRounds };
  }

  const [activeGeotingProposals, activeSlowGeoRounds] = await Promise.all([
    getActiveGeotingProposals(),
    getActiveSlowGeoRounds(),
  ]);
  return { activeGeotingProposals, activeSlowGeoRounds };
});

export const getScoreboardState = cache(async function getScoreboardState() {
  const sql = await getSql();
  if (!sql) {
    const state = await readFileState();
    const hydratedPlayers = applyPlayerProfiles(players, state.playerProfiles);
    return {
      players: hydratedPlayers,
      games,
      archive,
      rounds: state.rounds,
      gameSessions: state.gameSessions,
    };
  }

  const [rounds, gameSessions, hydratedPlayers] = await Promise.all([readRounds(), readGameSessions(), readHydratedPlayers()]);
  return { players: hydratedPlayers, games, archive, rounds, gameSessions };
});

export const getRoundsState = cache(async function getRoundsState() {
  const sql = await getSql();
  if (!sql) {
    const state = await readFileState();
    const hydratedPlayers = applyPlayerProfiles(players, state.playerProfiles);
    return { players: hydratedPlayers, rounds: state.rounds };
  }

  const [rounds, hydratedPlayers] = await Promise.all([readRounds(), readHydratedPlayers()]);
  return { players: hydratedPlayers, rounds };
});

export const getGamesState = cache(async function getGamesState() {
  const sql = await getSql();
  if (!sql) {
    const state = await readFileState();
    const hydratedPlayers = applyPlayerProfiles(players, state.playerProfiles);
    return {
      players: hydratedPlayers,
      games,
      rounds: state.rounds,
      gameSessions: state.gameSessions,
    };
  }

  const [rounds, gameSessions, hydratedPlayers] = await Promise.all([readRounds(), readGameSessions(), readHydratedPlayers()]);
  return { players: hydratedPlayers, games, rounds, gameSessions };
});

export const getSlowGeoState = cache(async function getSlowGeoState() {
  const sql = await getSql();
  if (!sql) {
    const state = await readFileState();
    const hydratedPlayers = applyPlayerProfiles(players, state.playerProfiles);
    return { players: hydratedPlayers, rounds: state.rounds };
  }

  const [rounds, hydratedPlayers] = await Promise.all([readRounds(), readHydratedPlayers()]);
  return { players: hydratedPlayers, rounds };
});

export const getSlowGeoRoundState = cache(async function getSlowGeoRoundState(id: string) {
  const sql = await getSql();
  if (sql) {
    const [round, hydratedPlayers] = await Promise.all([readDbRoundById(id), readHydratedPlayers()]);
    return { players: hydratedPlayers, round: round?.challenge ? round : null };
  }

  const state = await getSlowGeoState();
  const round = state.rounds.find((candidate) => candidate.id === id && candidate.challenge) ?? null;
  return { players: state.players, round };
});

export const getGeotingState = cache(async function getGeotingState() {
  const sql = await getSql();
  if (!sql) {
    const state = await readFileState();
    const hydratedPlayers = applyPlayerProfiles(players, state.playerProfiles);
    return {
      players: hydratedPlayers,
      parties,
      geotingProposals: state.geotingProposals,
    };
  }

  const [geotingProposals, hydratedPlayers] = await Promise.all([readProposals(), readHydratedPlayers()]);
  return { players: hydratedPlayers, parties, geotingProposals };
});

async function getActivityStateUncached() {
  const sql = await getSql();
  if (!sql) {
    const state = await readFileState();
    const hydratedPlayers = applyPlayerProfiles(players, state.playerProfiles);
    return {
      players: hydratedPlayers,
      parties,
      rounds: state.rounds,
      geotingProposals: state.geotingProposals,
      geoterIndexAdjustments: state.geoterIndexAdjustments,
      geoticOrderAssessments: state.geoticOrderAssessments,
    };
  }

  const [rounds, geotingProposals, geoterIndexAdjustments, geoticOrderAssessments, hydratedPlayers] = await Promise.all([
    readRounds(),
    readProposals(),
    readGeoterIndexAdjustments(),
    readGeoticOrderAssessments(),
    readHydratedPlayers(),
  ]);
  return {
    players: hydratedPlayers,
    parties,
    rounds,
    geotingProposals,
    geoterIndexAdjustments,
    geoticOrderAssessments,
  };
}

export const getActivityState = cache(getActivityStateUncached);
export const getGeotingAccessState = getActivityState;

export const getThirdCollegeState = cache(async function getThirdCollegeState() {
  const sql = await getSql();
  if (!sql) {
    const state = await readFileState();
    const hydratedPlayers = applyPlayerProfiles(players, state.playerProfiles);
    return {
      players: hydratedPlayers,
      parties,
      rounds: state.rounds,
      geotingProposals: state.geotingProposals,
      geoterIndexAdjustments: state.geoterIndexAdjustments,
      geoticOrderAssessments: state.geoticOrderAssessments,
      geoticOrderPromotionCases: state.geoticOrderPromotionCases,
    };
  }

  const [
    rounds,
    geotingProposals,
    geoterIndexAdjustments,
    geoticOrderAssessments,
    geoticOrderPromotionCases,
    hydratedPlayers,
  ] = await Promise.all([
    readRounds(),
    readProposals(),
    readGeoterIndexAdjustments(),
    readGeoticOrderAssessments(),
    readGeoticOrderPromotionCases(),
    readHydratedPlayers(),
  ]);
  return {
    players: hydratedPlayers,
    parties,
    rounds,
    geotingProposals,
    geoterIndexAdjustments,
    geoticOrderAssessments,
    geoticOrderPromotionCases,
  };
});

async function readEligibleGeotingVoters() {
  const [rounds, geoterIndexAdjustments, geoticOrderAssessments] = await Promise.all([
    readRounds(),
    readGeoterIndexAdjustments(),
    readGeoticOrderAssessments(),
  ]);
  const standings = computeStandings(players, rounds);
  const rows = getGeoticOrderRows(players, standings, geoterIndexAdjustments, geoticOrderAssessments);
  const rowByPlayerId = new Map(rows.map((row) => [row.player.id, row]));
  return players.filter((player) => getOrderCapabilities(rowByPlayerId.get(player.id) ?? null).canVote);
}

function promotionSnapshotHasImproved(
  current: GeoticOrderPromotionSnapshot,
  previous: GeoticOrderPromotionSnapshot,
) {
  return (
    current.serviceWeeks > previous.serviceWeeks ||
    current.roundsPlayed > previous.roundsPlayed ||
    current.lifetimePoints > previous.lifetimePoints ||
    current.trustScore > previous.trustScore ||
    getGeoticOrderRank(current.eligibleRankId).number > getGeoticOrderRank(previous.eligibleRankId).number
  );
}

function buildPromotionSnapshot(row: ReturnType<typeof getGeoticOrderRows>[number]): GeoticOrderPromotionSnapshot {
  return {
    serviceWeeks: row.serviceWeeks,
    roundsPlayed: row.roundsPlayed,
    lifetimePoints: row.lifetimePoints,
    trustScore: row.trustScore,
    eligibleRankId: row.eligibleRank.id,
  };
}

function promotionCaseBlocksNewCase(
  promotionCase: GeoticOrderPromotionCase,
  playerId: string,
  targetRankId: GeoticOrderRankId,
  snapshot: GeoticOrderPromotionSnapshot,
) {
  if (promotionCase.playerId !== playerId || promotionCase.targetRankId !== targetRankId) return false;
  if (promotionCase.status === "pending" || promotionCase.status === "approved") return true;
  if (promotionCase.status === "rejected") {
    return !promotionSnapshotHasImproved(snapshot, promotionCase.snapshot);
  }
  return false;
}

async function syncGeoticOrderPromotionCasesForState({
  geoterIndexAdjustments,
  geoticOrderAssessments,
  geoticOrderPromotionCases,
  rounds,
}: Pick<PersistentState, "geoterIndexAdjustments" | "geoticOrderAssessments" | "geoticOrderPromotionCases" | "rounds">) {
  const standings = computeStandings(players, rounds);
  const rows = getGeoticOrderRows(players, standings, geoterIndexAdjustments, geoticOrderAssessments);
  const rowByPlayerId = new Map(rows.map((row) => [row.player.id, row]));
  const timestamp = nowIso();
  let changed = false;

  const nextCases = geoticOrderPromotionCases.map((promotionCase) => {
    if (promotionCase.status !== "pending") return promotionCase;
    const row = rowByPlayerId.get(promotionCase.playerId);
    const targetRank = getGeoticOrderRank(promotionCase.targetRankId);
    if (!row || row.rank.number >= targetRank.number) {
      changed = true;
      return {
        ...promotionCase,
        status: "superseded" as const,
        updatedAt: timestamp,
        resolvedAt: timestamp,
        internalNote: promotionCase.internalNote || "Saken ble innhentet av en nyere ordensføring.",
      };
    }
    return promotionCase;
  });

  const createdCases: GeoticOrderPromotionCase[] = [];
  for (const row of rows) {
    const targetRank = getNextGeoticOrderRank(row.rank.id);
    if (!targetRank || !row.promotionReady) continue;

    const snapshot = buildPromotionSnapshot(row);
    const blocked = nextCases.some((promotionCase) =>
      promotionCaseBlocksNewCase(promotionCase, row.player.id, targetRank.id, snapshot),
    );
    if (blocked) continue;

    createdCases.push({
      id: randomUUID(),
      playerId: row.player.id,
      fromRankId: row.rank.id,
      targetRankId: targetRank.id,
      status: "pending",
      snapshot,
      votes: [],
      publicNote: "Kriteriene er oppfylt. Protokollen føres videre.",
      internalNote: "Automatisk reist sak: rå terskel er nådd, men rang krever 3/3 bifall.",
      createdAt: timestamp,
      updatedAt: timestamp,
      resolvedAt: null,
      openedBy: "system",
    });
  }

  if (createdCases.length > 0) {
    changed = true;
  }

  const promotionCases = [...createdCases, ...nextCases].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (changed) {
    await saveGeoticOrderPromotionCases(promotionCases);
  }
  return promotionCases;
}

export async function syncGeoticOrderPromotionCases() {
  const [rounds, geoterIndexAdjustments, geoticOrderAssessments, geoticOrderPromotionCases] = await Promise.all([
    readRounds(),
    readGeoterIndexAdjustments(),
    readGeoticOrderAssessments(),
    readGeoticOrderPromotionCases(),
  ]);
  return syncGeoticOrderPromotionCasesForState({
    rounds,
    geoterIndexAdjustments,
    geoticOrderAssessments,
    geoticOrderPromotionCases,
  });
}

export const getOrderState = cache(async function getOrderState() {
  const sql = await getSql();
  if (!sql) {
    const state = await readFileState();
    return {
      players,
      rounds: state.rounds,
      gameSessions: state.gameSessions,
      geoterIndexAdjustments: state.geoterIndexAdjustments,
      geoticOrderAssessments: state.geoticOrderAssessments,
      geoticOrderPromotionCases: state.geoticOrderPromotionCases,
    };
  }

  const [rounds, gameSessions, geoterIndexAdjustments, geoticOrderAssessments, geoticOrderPromotionCases] = await Promise.all([
    readRounds(),
    readGameSessions(),
    readGeoterIndexAdjustments(),
    readGeoticOrderAssessments(),
    readGeoticOrderPromotionCases(),
  ]);
  return {
    players,
    rounds,
    gameSessions,
    geoterIndexAdjustments,
    geoticOrderAssessments,
    geoticOrderPromotionCases,
  };
});

export async function resolveDueGeotingProposals(now = new Date()) {
  const [proposals, eligibleVoters] = await Promise.all([readProposals(), readEligibleGeotingVoters()]);
  const finalized = proposals.map((proposal) => resolveProposalIfReady(proposal, eligibleVoters, now));
  const ids = finalized.flatMap((proposal, index) =>
    JSON.stringify(proposal) === JSON.stringify(proposals[index]) ? [] : [proposal.id],
  );

  if (ids.length > 0) {
    const changedIds = new Set(ids);
    const sql = await ensureSchema();
    if (sql) {
      await Promise.all(finalized.filter((proposal) => changedIds.has(proposal.id)).map(upsertDbProposal));
    } else {
      await saveProposals(finalized);
    }
  }

  return { resolved: ids.length, ids, proposals: finalized };
}

export const getRound = cache(async function getRound(id: string) {
  const sql = await getSql();
  if (sql) return (await readDbRoundById(id)) ?? null;

  const rounds = await readFileRounds();
  return rounds.find((round) => round.id === id) ?? null;
});

export const getRoundPageState = cache(async function getRoundPageState(id: string) {
  const sql = await getSql();
  if (sql) {
    const [round, hydratedPlayers] = await Promise.all([readDbRoundById(id), readHydratedPlayers()]);
    return { players: hydratedPlayers, round };
  }

  const state = await readFileState();
  const hydratedPlayers = applyPlayerProfiles(players, state.playerProfiles);
  return {
    players: hydratedPlayers,
    round: state.rounds.find((candidate) => candidate.id === id) ?? null,
  };
});

export async function upsertRound(input: RoundInput) {
  const rounds = await readRounds();
  const existing = input.id ? rounds.find((round) => round.id === input.id) : null;
  const timestamp = nowIso();

  const nextRound: Round = normalizeRound({
    id: existing?.id ?? randomUUID(),
    number: existing?.number ?? (rounds.reduce((max, round) => Math.max(max, round.number), 0) + 1),
    date: input.date,
    name: input.name,
    answer: input.answer,
    answerLocation: input.answerLocation ?? null,
    challenge: input.challenge ?? existing?.challenge ?? null,
    slowGeoMode: input.slowGeoMode ?? existing?.slowGeoMode ?? "static",
    slowGeoStartedBy: input.slowGeoStartedBy ?? existing?.slowGeoStartedBy ?? null,
    slowGeoStartedAt: input.slowGeoStartedAt ?? existing?.slowGeoStartedAt ?? existing?.createdAt ?? timestamp,
    deadlineAt: input.deadlineAt ?? existing?.deadlineAt ?? null,
    revealedAt: input.revealedAt ?? existing?.revealedAt ?? null,
    country: input.country,
    continent: input.continent,
    comment: input.comment,
    status: existing?.status ?? "draft",
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    results: input.results,
  });

  const nextRounds = existing
    ? rounds.map((round) => (round.id === existing.id ? nextRound : round))
    : [...rounds, nextRound];

  await saveRoundRecord(nextRound, nextRounds);
  return nextRound;
}

function clampDeadlineMinutes(value: number | undefined) {
  if (!value || !Number.isFinite(value)) return 120;
  return Math.max(60, Math.min(24 * 60, Math.round(value)));
}

function normalizeDeadlineAt(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function slowGeoStartSort(a: Round, b: Round) {
  return String(a.slowGeoStartedAt ?? a.createdAt).localeCompare(String(b.slowGeoStartedAt ?? b.createdAt)) || a.number - b.number;
}

export async function createSlowGeoRound(
  input: { title?: string; deadlineMinutes?: number; deadlineAt?: string; mode?: SlowGeoMode; startedBy?: string | null } = {},
) {
  const rounds = await readRounds();
  const timestamp = nowIso();
  const slowGeoMode = normalizeSlowGeoMode(input.mode);
  const monthlyCap = getSlowGeoMonthlyRoundCap();
  const currentMonth = monthKey(timestamp);
  const slowGeoRoundsThisMonth = rounds.filter((round) => {
    const createdAt = round.challenge?.createdAt ?? round.createdAt;
    return round.challenge && monthKey(createdAt) === currentMonth;
  }).length;

  if (monthlyCap > 0 && slowGeoRoundsThisMonth >= monthlyCap) {
    return {
      ok: false,
      reason: `Månedstaket for SlowGeo er nådd (${monthlyCap}). Hev SLOWGEO_MONTHLY_ROUND_CAP når Google-kvoten tåler det.`,
    };
  }

  const usedChallenges = await readSlowGeoUsedChallenges(rounds);
  let challenge: SlowGeoChallenge;
  try {
    challenge = await createStreetViewChallenge({
      excludeCandidateIds: slowGeoUsedCandidateIds(usedChallenges),
      excludePanoIds: slowGeoUsedPanoIds(usedChallenges),
      requirePanoId: slowGeoMode === "panorama",
    });
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "SlowGeo-bildet kunne ikke hentes akkurat nå.",
    };
  }
  const nextNumber = rounds.reduce((max, round) => Math.max(max, round.number), 0) + 1;
  const deadlineMinutes = clampDeadlineMinutes(input.deadlineMinutes);
  const deadlineAt = normalizeDeadlineAt(input.deadlineAt) ?? new Date(Date.now() + deadlineMinutes * 60 * 1000).toISOString();
  const answerLocation: GeoLocation = {
    lat: challenge.lat,
    lon: challenge.lon,
    label: challenge.label,
    query: challenge.candidateId,
    country: challenge.country,
    source: "google_street_view",
  };

  const round: Round = normalizeRound({
    id: randomUUID(),
    number: nextNumber,
    date: timestamp.slice(0, 10),
    name: input.title?.trim() || `SlowGeo #${nextNumber}`,
    answer: challenge.label,
    answerLocation,
    challenge,
    slowGeoMode,
    slowGeoEraId: getActiveSlowGeoEra().id,
    slowGeoStartedBy: input.startedBy?.trim() || null,
    slowGeoStartedAt: timestamp,
    deadlineAt,
    revealedAt: null,
    country: challenge.country,
    continent: challenge.continent,
    comment: challenge.imageDate ? `Street View ${challenge.imageDate}` : "Google Street View",
    status: "open",
    createdAt: timestamp,
    updatedAt: timestamp,
    results: emptyResults(competingPlayers),
  });

  await saveRoundsAndSlowGeoUsedChallenges([...rounds, round], [
    ...usedChallenges,
    slowGeoUsedChallengeFromRound(round, "created")!,
  ]);
  return { ok: true, round };
}

export async function replaceSlowGeoPanoramaRound(input: { roundId: string }) {
  const rounds = await readRounds();
  const round = rounds.find((candidate) => candidate.id === input.roundId);
  if (!round) {
    return { ok: false, reason: "Runden finnes ikke i protokollen." };
  }
  if (!isSlowGeoOpenRound(round)) {
    return { ok: false, reason: "Bare åpne SlowGeo-runder kan få nytt panorama." };
  }
  if (getSlowGeoMode(round) !== "panorama") {
    return { ok: false, reason: "Prøv nytt panorama gjelder bare Panorama-runder." };
  }
  if (hasLockedSlowGeoGuess(round)) {
    return { ok: false, reason: "Panorama kan ikke byttes etter at et pin-svar er låst." };
  }

  const usedChallenges = await readSlowGeoUsedChallenges(rounds);

  let challenge: SlowGeoChallenge;
  try {
    challenge = await createStreetViewChallenge({
      excludeCandidateIds: slowGeoUsedCandidateIds(usedChallenges),
      excludePanoIds: slowGeoUsedPanoIds(usedChallenges),
      requirePanoId: true,
    });
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "Nytt panorama kunne ikke hentes akkurat nå.",
    };
  }
  const timestamp = nowIso();
  const answerLocation: GeoLocation = {
    lat: challenge.lat,
    lon: challenge.lon,
    label: challenge.label,
    query: challenge.candidateId,
    country: challenge.country,
    source: "google_street_view",
  };
  const replacement: Round = normalizeRound({
    ...round,
    answer: challenge.label,
    answerLocation,
    mapSnapshot: null,
    challenge,
    slowGeoMode: "panorama",
    revealedAt: null,
    country: challenge.country,
    continent: challenge.continent,
    comment: challenge.imageDate ? `Street View ${challenge.imageDate}` : "Google Street View",
    status: "open",
    updatedAt: timestamp,
    results: emptyResults(competingPlayers),
  });

  await saveRoundsAndSlowGeoUsedChallenges(
    rounds.map((candidate) => (candidate.id === round.id ? replacement : candidate)),
    [
      ...usedChallenges,
      slowGeoUsedChallengeFromRound(round, "replaced")!,
      slowGeoUsedChallengeFromRound(replacement, "replaced")!,
    ],
  );
  return { ok: true, round: replacement };
}

export async function deleteSlowGeoRound(input: { roundId: string }) {
  const rounds = await readRounds();
  const round = rounds.find((candidate) => candidate.id === input.roundId);
  if (!round) {
    return { ok: false, reason: "Runden finnes ikke i protokollen." };
  }
  if (!isSlowGeoRound(round)) {
    return { ok: false, reason: "Bare SlowGeo-runder kan slettes fra SlowGeo-skuffen." };
  }
  if (round.status !== "open" && round.status !== "revealed" && round.status !== "locked") {
    return { ok: false, reason: "Bare åpne og ferdige SlowGeo-runder kan slettes." };
  }

  const usedChallenge = slowGeoUsedChallengeFromRound(round, "backfilled");
  const deletedInDb = await deleteDbRound(round.id);
  if (deletedInDb) {
    if (usedChallenge) await upsertDbSlowGeoUsedChallenge(usedChallenge);
  } else {
    await writeFileRounds(rounds.filter((candidate) => candidate.id !== round.id));
  }

  return { ok: true, round };
}

export async function submitSlowGeoGuess(input: {
  roundId: string;
  playerId: string;
  location: GeoLocation;
  note?: string;
}) {
  const rounds = await readRounds();
  const round = rounds.find((candidate) => candidate.id === input.roundId);
  if (!round) {
    return { ok: false, reason: "Runden finnes ikke i protokollen." };
  }
  if (!competingPlayers.some((player) => player.id === input.playerId)) {
    return { ok: false, reason: "Bare konkurrerende geoter kan avgi SlowGeo-svar." };
  }
  if (!isSlowGeoOpenRound(round)) {
    return { ok: false, reason: "Denne SlowGeo-runden er ikke åpen for svar." };
  }

  const now = new Date();
  if (shouldRevealSlowGeoRound(round, players, now)) {
    const finalized = finalizeSlowGeoRound(round, players, now.toISOString());
    await saveRoundRecord(finalized, rounds.map((candidate) => (candidate.id === round.id ? finalized : candidate)));
    return { ok: false, reason: "Fristen er ute og fasit er avslørt." };
  }
  const existingResult = round.results.find((result) => result.playerId === input.playerId);
  if (existingResult?.guessLocation) {
    return { ok: false, reason: "Pin-svaret ditt er allerede låst." };
  }

  if (
    !Number.isFinite(input.location.lat) ||
    !Number.isFinite(input.location.lon) ||
    Math.abs(input.location.lat) > 90 ||
    Math.abs(input.location.lon) > 180
  ) {
    return { ok: false, reason: "Pinnen må stå på jorden." };
  }

  const timestamp = now.toISOString();
  const results = round.results.map((result) =>
    result.playerId === input.playerId
      ? {
          ...result,
          guessText: input.location.label,
          guessLocation: {
            ...input.location,
            source: "manual" as const,
          },
          guessUpdatedAt: timestamp,
          actualKm: null,
          distanceSource: null,
          note: input.note?.trim().slice(0, 280) ?? "",
        }
      : result,
  );
  const answeredRound: Round = {
    ...round,
    results,
    updatedAt: timestamp,
  };
  const revealed = shouldRevealSlowGeoRound(answeredRound, players, now);
  const nextRound = revealed ? finalizeSlowGeoRound(answeredRound, players, timestamp) : normalizeRound(answeredRound);

  await saveRoundRecord(nextRound, rounds.map((candidate) => (candidate.id === round.id ? nextRound : candidate)));
  return { ok: true, round: nextRound, revealed };
}

export async function revealDueSlowGeoRounds(now = new Date()) {
  const rounds = await readRounds();
  const ids: string[] = [];
  const timestamp = now.toISOString();
  const nextRounds = rounds.map((round) => {
    if (!shouldRevealSlowGeoRound(round, players, now)) return round;
    ids.push(round.id);
    return finalizeSlowGeoRound(round, players, timestamp);
  });

  if (ids.length > 0) {
    await saveRounds(nextRounds);
  }

  return { revealed: ids.length, ids };
}

export async function maybeRevealRound(id: string, now = new Date()) {
  const rounds = await readRounds();
  const round = rounds.find((candidate) => candidate.id === id);
  if (!round || !shouldRevealSlowGeoRound(round, players, now)) return round ?? null;

  const revealed = finalizeSlowGeoRound(round, players, now.toISOString());
  await saveRoundRecord(revealed, rounds.map((candidate) => (candidate.id === id ? revealed : candidate)));
  return revealed;
}

export async function runScheduledMaintenance(now = new Date()) {
  const geoting = await resolveDueGeotingProposals(now);
  const slowGeo = await revealDueSlowGeoRounds(now);
  const geoticOrderPromotionCases = await syncGeoticOrderPromotionCases();

  return {
    geoting,
    slowGeo,
    geoticOrderPromotionCases: geoticOrderPromotionCases.length,
  };
}

export async function upsertGameSession(input: GameSessionInput) {
  const gameSessions = await readGameSessions();
  const existing = input.id ? gameSessions.find((session) => session.id === input.id) : null;
  const timestamp = nowIso();

  const nextSession: GameSession = normalizeGameSession({
    id: existing?.id ?? randomUUID(),
    gameId: input.gameId,
    number:
      existing?.number ??
      gameSessions
        .filter((session) => session.gameId === input.gameId)
        .reduce((max, session) => Math.max(max, session.number), 0) + 1,
    date: input.date,
    title: input.title,
    context: input.context,
    status: "locked",
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    results: input.results,
  });

  const nextSessions = existing
    ? gameSessions.map((session) => (session.id === existing.id ? nextSession : session))
    : [...gameSessions, nextSession];

  await saveGameSessionRecord(nextSession, nextSessions);
  return nextSession;
}

export async function createGeotingProposal(input: ProposalInput) {
  const proposals = await readProposals();
  const timestamp = nowIso();
  const proposal: GeotingProposal = {
    id: randomUUID(),
    title: input.title,
    body: input.body,
    ruleType: input.ruleType,
    proposedBy: input.proposedBy,
    status: "open",
    createdAt: timestamp,
    updatedAt: timestamp,
    voteStartedAt: null,
    voteEndsAt: null,
    voteStartedBy: null,
    oathText: "",
    resolvedAt: null,
    implementationStatus: "pending",
    implementationNote: "",
    implementedAt: null,
    partyPositions: [],
    votes: [],
  };

  await saveProposalRecord(proposal, [proposal, ...proposals]);
  return proposal;
}

export async function updateGeotingProposal(input: UpdateProposalInput) {
  const proposals = await readProposals();
  const proposal = proposals.find((candidate) => candidate.id === input.proposalId);
  if (!proposal) {
    return { ok: false, reason: "Saken finnes ikke i GeoTingets protokoll." };
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) {
    return { ok: false, reason: "Saken må ha både tittel og innhold." };
  }

  const updated: GeotingProposal = {
    ...proposal,
    title,
    body,
    ruleType: input.ruleType,
    implementationStatus: input.implementationStatus ?? proposal.implementationStatus ?? "pending",
    implementationNote: input.implementationNote?.trim() ?? proposal.implementationNote ?? "",
    implementedAt:
      input.implementationStatus === "implemented" || input.implementationStatus === "ignored"
        ? (proposal.implementedAt ?? nowIso())
        : input.implementationStatus === "pending"
          ? null
          : (proposal.implementedAt ?? null),
    updatedAt: nowIso(),
  };
  await saveProposalRecord(
    updated,
    proposals.map((candidate) => (candidate.id === proposal.id ? updated : candidate)),
  );
  return { ok: true, proposal: updated };
}

export async function saveGeotingPartyPosition(input: PartyPositionInput) {
  const proposals = await readProposals();
  const proposal = proposals.find((candidate) => candidate.id === input.proposalId);
  if (!proposal) {
    return { ok: false, reason: "Saken finnes ikke i GeoTingets protokoll." };
  }
  if (!parties.some((party) => party.id === input.partyId)) {
    return { ok: false, reason: "Partiet finnes ikke i GeoTingets register." };
  }
  if (proposal.status === "passed" || proposal.status === "rejected" || proposal.status === "archived") {
    return { ok: false, reason: "Partiposisjoner føres før vedtaket er avgjort." };
  }

  const timestamp = nowIso();
  const position: GeotingPartyPosition = {
    partyId: input.partyId,
    position: input.position,
    comment: input.comment.trim().slice(0, 220),
    updatedAt: timestamp,
    updatedBy: input.updatedBy,
  };
  const updated: GeotingProposal = {
    ...proposal,
    partyPositions: [
      position,
      ...(proposal.partyPositions ?? []).filter((candidate) => candidate.partyId !== input.partyId),
    ],
    updatedAt: timestamp,
  };

  await saveProposalRecord(
    updated,
    proposals.map((candidate) => (candidate.id === proposal.id ? updated : candidate)),
  );
  return { ok: true, proposal: updated };
}

export async function withdrawGeotingProposal(input: WithdrawProposalInput) {
  const proposals = await readProposals();
  const proposal = proposals.find((candidate) => candidate.id === input.proposalId);
  if (!proposal) {
    return { ok: false, reason: "Saken finnes ikke i GeoTingets protokoll." };
  }
  if (proposal.status === "passed" || proposal.status === "rejected") {
    return { ok: false, reason: "Saken er allerede avgjort og kan ikke trekkes." };
  }
  if (proposal.status === "archived") {
    return { ok: false, reason: "Saken er allerede trukket." };
  }

  const timestamp = nowIso();
  const archived: GeotingProposal = {
    ...proposal,
    status: "archived",
    updatedAt: timestamp,
    resolvedAt: proposal.resolvedAt ?? timestamp,
  };
  await saveProposalRecord(
    archived,
    proposals.map((candidate) => (candidate.id === proposal.id ? archived : candidate)),
  );
  return { ok: true, proposal: archived };
}

export async function startGeotingVote(input: StartVoteInput) {
  const proposals = await readProposals();
  const proposal = proposals.find((candidate) => candidate.id === input.proposalId);
  if (!proposal) {
    return { ok: false, reason: "Saken finnes ikke i GeoTingets protokoll." };
  }
  if (proposal.voteStartedAt || proposal.status === "voting") {
    return { ok: false, reason: "Avstemningen er allerede startet." };
  }
  if (proposal.status === "passed" || proposal.status === "rejected" || proposal.status === "archived") {
    return { ok: false, reason: "Saken er allerede protokollført." };
  }
  if (!input.oathText.trim()) {
    return { ok: false, reason: "Geo-eden må sverges før stemmeurnen åpnes." };
  }

  const timestamp = nowIso();
  const nextProposal: GeotingProposal = {
    ...proposal,
    status: "voting",
    updatedAt: timestamp,
    voteStartedAt: timestamp,
    voteEndsAt: addVotingWindow(timestamp),
    voteStartedBy: input.playerId,
    oathText: input.oathText || GEO_OATH_TEXT,
  };

  await saveProposalRecord(
    nextProposal,
    proposals.map((candidate) => (candidate.id === proposal.id ? nextProposal : candidate)),
  );
  return { ok: true, proposal: nextProposal };
}

export async function saveGeotingVote(input: VoteInput) {
  const [proposals, eligibleVoters] = await Promise.all([readProposals(), readEligibleGeotingVoters()]);
  if (!eligibleVoters.some((player) => player.id === input.playerId)) {
    return { ok: false, reason: "Ordensporten har ikke åpnet stemmerett for denne geoten." };
  }
  const proposal = proposals.find((candidate) => candidate.id === input.proposalId);
  if (!proposal) {
    return { ok: false, reason: "Saken finnes ikke i GeoTingets protokoll." };
  }
  if (!proposal.voteStartedAt || proposal.status === "open") {
    return { ok: false, reason: "Avstemningen er ikke åpnet. Først må en geo-ed avlegges." };
  }
  if (proposal.status === "passed" || proposal.status === "rejected" || proposal.status === "archived") {
    return { ok: false, reason: "Avstemningen er avsluttet og protokollført." };
  }
  if (proposal.voteEndsAt && Date.now() >= new Date(proposal.voteEndsAt).getTime()) {
    const resolved = resolveProposalIfReady(proposal, eligibleVoters);
    await saveProposalRecord(
      resolved,
      proposals.map((candidate) => (candidate.id === proposal.id ? resolved : candidate)),
    );
    return { ok: false, reason: "Tingfristen er ute. Resultatet er protokollført." };
  }

  const vote: GeotingVote = {
    playerId: input.playerId,
    vote: normalizeVoteValue(input.vote),
    comment: input.comment,
    createdAt: nowIso(),
  };
  const votedProposal: GeotingProposal = {
    ...proposal,
    updatedAt: vote.createdAt,
    votes: [...proposal.votes.filter((candidate) => candidate.playerId !== input.playerId), vote],
  };
  const nextProposal = resolveProposalIfReady(votedProposal, eligibleVoters);

  await saveProposalRecord(
    nextProposal,
    proposals.map((candidate) => (candidate.id === proposal.id ? nextProposal : candidate)),
  );
  return { ok: true, proposal: nextProposal };
}

export async function addGeoterIndexAdjustment(input: GeoterIndexAdjustmentInput) {
  const existing = await readGeoterIndexAdjustments();
  const adjustment: GeoterIndexAdjustment = {
    id: randomUUID(),
    playerId: input.playerId,
    delta: Math.round(input.delta),
    category: input.category,
    title: input.title,
    reason: input.reason,
    createdAt: nowIso(),
    createdBy: input.createdBy,
  };

  await saveGeoterIndexAdjustmentRecord(adjustment, [...existing, adjustment]);
  return adjustment;
}

function thirdCollegeHasUnanimity(votes: GeoticOrderPromotionVote[]) {
  return THIRD_COLLEGIUM_MEMBER_IDS.every((memberId) =>
    votes.some((vote) => vote.voterId === memberId && vote.vote === "for"),
  );
}

function thirdCollegeHasObjection(votes: GeoticOrderPromotionVote[]) {
  return votes.some((vote) => THIRD_COLLEGIUM_MEMBER_IDS.includes(vote.voterId as (typeof THIRD_COLLEGIUM_MEMBER_IDS)[number]) && vote.vote === "mot");
}

export async function voteGeoticOrderPromotionCase(input: GeoticOrderPromotionVoteInput) {
  if (!THIRD_COLLEGIUM_MEMBER_IDS.includes(input.voterId as (typeof THIRD_COLLEGIUM_MEMBER_IDS)[number])) {
    return { ok: false, reason: "Bare en av de tre stolene kan føre opprykksvotum." };
  }

  const [promotionCases, assessments] = await Promise.all([
    readGeoticOrderPromotionCases(),
    readGeoticOrderAssessments(),
  ]);
  const promotionCase = promotionCases.find((candidate) => candidate.id === input.caseId);
  if (!promotionCase) {
    return { ok: false, reason: "Opprykkssaken finnes ikke i den lukkede protokollen." };
  }
  if (promotionCase.status !== "pending") {
    return { ok: false, reason: "Saken er allerede ført og kan ikke stemmes på nytt." };
  }

  const timestamp = nowIso();
  const vote: GeoticOrderPromotionVote = {
    voterId: input.voterId,
    vote: input.vote,
    comment: input.comment.trim().slice(0, 240),
    createdAt: timestamp,
  };
  const votes = [
    vote,
    ...promotionCase.votes.filter((candidate) => candidate.voterId !== input.voterId),
  ];
  const approved = thirdCollegeHasUnanimity(votes);
  const rejected = !approved && thirdCollegeHasObjection(votes);
  const status: GeoticOrderPromotionStatus = approved ? "approved" : rejected ? "rejected" : "pending";
  const resolvedAt = status === "pending" ? null : timestamp;
  const updatedCase: GeoticOrderPromotionCase = {
    ...promotionCase,
    status,
    votes,
    updatedAt: timestamp,
    resolvedAt,
    internalNote:
      status === "approved"
        ? `${promotionCase.internalNote}\n\nVEDTAK: 3/3 bifall.`
        : status === "rejected"
          ? `${promotionCase.internalNote}\n\nVEDTAK: Mørk innsigelse er reist.`
          : promotionCase.internalNote,
  };

  const nextCases = promotionCases.map((candidate) => (candidate.id === promotionCase.id ? updatedCase : candidate));

  if (!approved) {
    await saveGeoticOrderPromotionCaseRecord(updatedCase, nextCases);
    return { ok: true, promotionCase: updatedCase };
  }

  const player = players.find((candidate) => candidate.id === promotionCase.playerId);
  if (!player) {
    await saveGeoticOrderPromotionCaseRecord(updatedCase, nextCases);
    return { ok: false, reason: "Kandidaten finnes ikke i geotregisteret." };
  }

  const existingAssessment = assessments.find((assessment) => assessment.playerId === promotionCase.playerId);
  const targetRank = getGeoticOrderRank(promotionCase.targetRankId);
  const nextAssessment: GeoticOrderAssessment = {
    playerId: promotionCase.playerId,
    rankId: promotionCase.targetRankId,
    serviceWeeks: Math.max(existingAssessment?.serviceWeeks ?? 0, promotionCase.snapshot.serviceWeeks),
    hiddenCategory: existingAssessment?.hiddenCategory ?? getDefaultHiddenOrderCategory(player),
    status: existingAssessment?.status ?? "normal",
    sponsor: existingAssessment?.sponsor || "Tredje Kollegium",
    trial: existingAssessment?.trial || `Enstemmig opprykk til ${targetRank.name}`,
    publicNote: existingAssessment?.publicNote || "Kriteriene er oppfylt, og rangen er ført i protokollen.",
    internalNote: [
      existingAssessment?.internalNote,
      `Opprykk til ${targetRank.name} godkjent med 3/3 bifall.`,
    ].filter(Boolean).join("\n\n"),
    updatedAt: timestamp,
    updatedBy: input.voterId,
  };

  await saveGeoticOrderPromotionCaseRecord(updatedCase, nextCases);
  await saveGeoticOrderAssessmentRecord(
    nextAssessment,
    [
      nextAssessment,
      ...assessments.filter((assessment) => assessment.playerId !== promotionCase.playerId),
    ],
  );
  return { ok: true, promotionCase: updatedCase, assessment: nextAssessment };
}

export async function upsertGeoticOrderAssessment(input: GeoticOrderAssessmentInput) {
  const [existing, rounds, adjustments] = await Promise.all([
    readGeoticOrderAssessments(),
    readRounds(),
    readGeoterIndexAdjustments(),
  ]);
  const timestamp = nowIso();
  const standings = computeStandings(players, rounds);
  const currentRows = getGeoticOrderRows(players, standings, adjustments, existing);
  const currentRow = currentRows.find((row) => row.player.id === input.playerId);
  const requestedRank = getGeoticOrderRank(input.rankId);
  if (currentRow && requestedRank.number > currentRow.rank.number) {
    return {
      ok: false,
      reason: "Opprykk må gjennom opprykksprotokollen med 3/3 bifall fra Tredje Kollegium.",
    };
  }

  const nextAssessment: GeoticOrderAssessment = {
    playerId: input.playerId,
    rankId: input.rankId,
    serviceWeeks: Math.max(0, Math.round(input.serviceWeeks)),
    hiddenCategory: input.hiddenCategory,
    status: input.status,
    sponsor: input.sponsor,
    trial: input.trial,
    publicNote: input.publicNote,
    internalNote: input.internalNote,
    updatedAt: timestamp,
    updatedBy: input.updatedBy,
  };

  await saveGeoticOrderAssessmentRecord(
    nextAssessment,
    [
      nextAssessment,
      ...existing.filter((assessment) => assessment.playerId !== input.playerId),
    ],
  );
  return { ok: true, assessment: nextAssessment };
}

export async function lockRound(id: string) {
  const rounds = await readRounds();
  const round = rounds.find((candidate) => candidate.id === id);
  if (!round) {
    return { ok: false, reason: "Runden finnes ikke i protokollen." };
  }
  if (round.status === "open") {
    return { ok: false, reason: "Runden er fortsatt åpen. Vent på frist eller alle svar før låsing." };
  }
  if (!canLockRound(round)) {
    return {
      ok: false,
      reason: "Minst fem geoter med gyldig km må registreres før protokollen kan låses.",
    };
  }

  const updated = { ...round, status: "locked" as RoundStatus, updatedAt: nowIso() };
  await saveRoundRecord(updated, rounds.map((candidate) => (candidate.id === id ? updated : candidate)));
  return { ok: true, round: updated };
}

export async function unlockRound(id: string) {
  const rounds = await readRounds();
  const round = rounds.find((candidate) => candidate.id === id);
  if (!round) {
    return { ok: false, reason: "Runden finnes ikke i protokollen." };
  }
  const updated = {
    ...round,
    status: round.challenge ? ("revealed" as RoundStatus) : ("draft" as RoundStatus),
    updatedAt: nowIso(),
  };
  await saveRoundRecord(updated, rounds.map((candidate) => (candidate.id === id ? updated : candidate)));
  return { ok: true, round: updated };
}

export function makeEmptyRound(): Round {
  const timestamp = nowIso();
  return {
    id: "",
    number: 0,
    date: new Date().toISOString().slice(0, 10),
    name: "",
    answer: "",
    answerLocation: null,
    mapSnapshot: null,
    challenge: null,
    slowGeoEraId: null,
    deadlineAt: null,
    revealedAt: null,
    country: "",
    continent: "",
    comment: "",
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    results: emptyResults(competingPlayers),
  };
}

export function emptyGameResults(): GameResult[] {
  return competingPlayers.map((player) => ({
    playerId: player.id,
    status: "ikke_deltatt",
    score: null,
    note: "",
  }));
}

export function makeEmptyGameSession(gameId: GameId = "geo"): GameSession {
  const timestamp = nowIso();
  return {
    id: "",
    gameId,
    number: 0,
    date: new Date().toISOString().slice(0, 10),
    title: "",
    context: "",
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    results: emptyGameResults(),
  };
}
