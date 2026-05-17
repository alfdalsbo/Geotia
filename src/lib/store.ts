import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { archive, competingPlayers, games, initialState, parties, players } from "@/lib/seed";
import { canLockRound, emptyResults } from "@/lib/scoring";
import { addVotingWindow, GEO_OATH_TEXT, normalizeVoteValue, resolveProposalIfReady } from "@/lib/geoting";
import { buildRoundMapSnapshot } from "@/lib/geo";
import { finalizeSlowGeoRound, isSlowGeoOpenRound, shouldRevealSlowGeoRound } from "@/lib/slowgeo";
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
  GeoticOrderRankId,
  GeoticOrderStatus,
  GeotingImplementationStatus,
  GeotingPartyPosition,
  GeotingProposal,
  GeotingProposalStatus,
  GeotingVote,
  PartyPositionValue,
  PlayerResult,
  ProposalRuleType,
  Round,
  RoundMapSnapshot,
  RoundStatus,
  SlowGeoChallenge,
  VoteValue,
} from "@/lib/types";

type RoundInput = {
  id?: string;
  date: string;
  name: string;
  answer: string;
  answerLocation?: GeoLocation | null;
  challenge?: SlowGeoChallenge | null;
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

type RoundLocationData = {
  answerLocation: GeoLocation | null;
  mapSnapshot: RoundMapSnapshot | null;
  challenge?: SlowGeoChallenge | null;
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
  geocodeCache: GeocodeCacheEntry[];
};

const dataFile =
  process.env.GEOTIA_DATA_FILE ||
  (process.env.VERCEL
    ? path.join("/tmp", "geotia-data.json")
    : path.join(process.cwd(), ".data", "geotia-data.json"));
const backupDataFile = `${dataFile}.bak`;
const fileStateSchemaVersion = "2";

let schemaReady = false;
let fileWriteQueue: Promise<void> = Promise.resolve();

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
  return {
    ...round,
    status,
    answerLocation,
    challenge: round.challenge ?? null,
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
          geocodeCache: [],
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
  return {
    meta: {
      schemaVersion: "1",
      ...(parsed.meta ?? {}),
    },
    rounds: (parsed.rounds ?? []).map(normalizeRound),
    gameSessions: (parsed.gameSessions ?? []).map(normalizeGameSession),
    geotingProposals: (parsed.geotingProposals ?? []).map(normalizeProposal),
    geoterIndexAdjustments: parsed.geoterIndexAdjustments ?? [],
    geoticOrderAssessments: parsed.geoticOrderAssessments ?? [],
    geocodeCache: parsed.geocodeCache ?? [],
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

async function getSql() {
  if (process.env.GEOTIA_FORCE_FILE_STORAGE === "1") return null;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  const { neon } = await import("@neondatabase/serverless");
  return neon(databaseUrl);
}

async function ensureSchema() {
  const sql = await getSql();
  if (!sql || schemaReady) return sql;

  await sql`
    CREATE TABLE IF NOT EXISTS geotia_meta (
      key text PRIMARY KEY,
      value text NOT NULL,
      updated_at text NOT NULL
    )
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
    CREATE TABLE IF NOT EXISTS geotia_geocode_cache (
      query_key text PRIMARY KEY,
      result_json jsonb,
      updated_at text NOT NULL
    )
  `;

  schemaReady = true;
  return sql;
}

function parseRoundLocationData(value: RoundLocationData | string | null | undefined): RoundLocationData {
  if (!value) return { answerLocation: null, mapSnapshot: null, challenge: null, deadlineAt: null, revealedAt: null };
  const parsed = typeof value === "string" ? (JSON.parse(value) as Partial<RoundLocationData>) : value;
  return {
    answerLocation: parsed.answerLocation ?? null,
    mapSnapshot: parsed.mapSnapshot ?? null,
    challenge: parsed.challenge ?? null,
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

async function readRounds(): Promise<Round[]> {
  const dbRounds = await readDbRounds();
  if (dbRounds) return dbRounds;
  return readFileRounds();
}

async function readGameSessions(): Promise<GameSession[]> {
  const dbSessions = await readDbGameSessions();
  if (dbSessions) return dbSessions;
  return (await readFileState()).gameSessions;
}

async function readProposals(): Promise<GeotingProposal[]> {
  const dbProposals = await readDbProposals();
  const proposals = dbProposals ?? (await readFileState()).geotingProposals;
  const finalized = proposals.map((proposal) => resolveProposalIfReady(proposal, players));
  const changed = finalized.some((proposal, index) => JSON.stringify(proposal) !== JSON.stringify(proposals[index]));
  if (changed) {
    await saveProposals(finalized);
  }
  return finalized;
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

async function saveRounds(rounds: Round[]) {
  const sql = await ensureSchema();
  if (sql) {
    await Promise.all(rounds.map(upsertDbRound));
    return;
  }
  await writeFileRounds(rounds);
}

async function saveGameSessions(gameSessions: GameSession[]) {
  const sql = await ensureSchema();
  if (sql) {
    await Promise.all(gameSessions.map(upsertDbGameSession));
    return;
  }
  const state = await readFileState();
  await writeFileState({ ...state, gameSessions });
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

async function saveGeoterIndexAdjustments(geoterIndexAdjustments: GeoterIndexAdjustment[]) {
  const sql = await ensureSchema();
  if (sql) {
    await Promise.all(geoterIndexAdjustments.map(upsertDbGeoterIndexAdjustment));
    return;
  }
  const state = await readFileState();
  await writeFileState({ ...state, geoterIndexAdjustments });
}

async function saveGeoticOrderAssessments(geoticOrderAssessments: GeoticOrderAssessment[]) {
  const sql = await ensureSchema();
  if (sql) {
    await Promise.all(geoticOrderAssessments.map(upsertDbGeoticOrderAssessment));
    return;
  }
  const state = await readFileState();
  await writeFileState({ ...state, geoticOrderAssessments });
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

export async function getAppState(): Promise<AppState> {
  await revealDueSlowGeoRounds();
  const [rounds, gameSessions, geotingProposals, geoterIndexAdjustments, geoticOrderAssessments] = await Promise.all([
    readRounds(),
    readGameSessions(),
    readProposals(),
    readGeoterIndexAdjustments(),
    readGeoticOrderAssessments(),
  ]);
  return {
    ...initialState,
    players,
    parties,
    games,
    archive,
    rounds,
    gameSessions,
    geotingProposals,
    geoterIndexAdjustments,
    geoticOrderAssessments,
  };
}

export async function getActiveGeotingProposals() {
  const proposals = await readProposals();
  return proposals.filter((proposal) => proposal.status === "voting" && proposal.voteEndsAt);
}

export async function getActiveSlowGeoRounds() {
  await revealDueSlowGeoRounds();
  const rounds = await readRounds();
  return rounds
    .filter((round) => isSlowGeoOpenRound(round) && round.deadlineAt)
    .sort((a, b) => String(a.deadlineAt).localeCompare(String(b.deadlineAt)));
}

export async function getRound(id: string) {
  const rounds = await readRounds();
  return rounds.find((round) => round.id === id) ?? null;
}

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

  await saveRounds(nextRounds);
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

export async function createSlowGeoRound(input: { title?: string; deadlineMinutes?: number; deadlineAt?: string } = {}) {
  const rounds = await readRounds();
  const timestamp = nowIso();
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

  const challenge = await createStreetViewChallenge({
    excludeCandidateIds: rounds
      .filter((round) => round.challenge)
      .slice(-8)
      .map((round) => round.challenge!.candidateId),
  });
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

  await saveRounds([...rounds, round]);
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
    await saveRounds(rounds.map((candidate) => (candidate.id === round.id ? finalized : candidate)));
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

  await saveRounds(rounds.map((candidate) => (candidate.id === round.id ? nextRound : candidate)));
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
  await saveRounds(rounds.map((candidate) => (candidate.id === id ? revealed : candidate)));
  return revealed;
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

  await saveGameSessions(nextSessions);
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

  await saveProposals([proposal, ...proposals]);
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
  await saveProposals(
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

  await saveProposals(
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
  await saveProposals(
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

  await saveProposals(
    proposals.map((candidate) => (candidate.id === proposal.id ? nextProposal : candidate)),
  );
  return { ok: true, proposal: nextProposal };
}

export async function saveGeotingVote(input: VoteInput) {
  const proposals = await readProposals();
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
    const resolved = resolveProposalIfReady(proposal, players);
    await saveProposals(
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
  const nextProposal = resolveProposalIfReady(votedProposal, players);

  await saveProposals(
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

  await saveGeoterIndexAdjustments([...existing, adjustment]);
  return adjustment;
}

export async function upsertGeoticOrderAssessment(input: GeoticOrderAssessmentInput) {
  const existing = await readGeoticOrderAssessments();
  const timestamp = nowIso();
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

  await saveGeoticOrderAssessments([
    nextAssessment,
    ...existing.filter((assessment) => assessment.playerId !== input.playerId),
  ]);
  return nextAssessment;
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
  await saveRounds(rounds.map((candidate) => (candidate.id === id ? updated : candidate)));
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
  await saveRounds(rounds.map((candidate) => (candidate.id === id ? updated : candidate)));
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
