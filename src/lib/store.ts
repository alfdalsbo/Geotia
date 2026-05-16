import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { archive, competingPlayers, games, initialState, parties, players } from "@/lib/seed";
import { canLockRound, emptyResults } from "@/lib/scoring";
import type {
  AppState,
  GameId,
  GameResult,
  GameSession,
  GeotingProposal,
  GeotingVote,
  PlayerResult,
  ProposalRuleType,
  Round,
  RoundStatus,
  VoteValue,
} from "@/lib/types";

type RoundInput = {
  id?: string;
  date: string;
  name: string;
  answer: string;
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

type VoteInput = {
  proposalId: string;
  playerId: string;
  vote: VoteValue;
  comment: string;
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
  status: "open" | "passed" | "rejected" | "archived";
  created_at: string;
  updated_at: string;
  votes_json: GeotingVote[] | string;
};

type FileState = {
  rounds: Round[];
  gameSessions: GameSession[];
  geotingProposals: GeotingProposal[];
};

const dataFile =
  process.env.GEOTIA_DATA_FILE ||
  (process.env.VERCEL
    ? path.join("/tmp", "geotia-data.json")
    : path.join(process.cwd(), ".data", "geotia-data.json"));

let schemaReady = false;

export function getStorageMode() {
  if (process.env.DATABASE_URL) return "Neon/Postgres";
  if (process.env.VERCEL) return "Midlertidig Vercel-lager";
  return "Lokal filprotokoll";
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeRound(round: Round): Round {
  const existing = new Map(round.results.map((result) => [result.playerId, result]));
  return {
    ...round,
    results: competingPlayers.map((player) => {
      return (
        existing.get(player.id) ?? {
          playerId: player.id,
          status: "ikke_deltatt",
          actualKm: null,
          note: "",
        }
      );
    }),
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
    votes: proposal.votes ?? [],
  };
}

async function ensureFileState() {
  try {
    await fs.access(dataFile);
  } catch {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(
      dataFile,
      JSON.stringify({ rounds: [], gameSessions: [], geotingProposals: [] }, null, 2),
      "utf8",
    );
  }
}

async function readFileState(): Promise<FileState> {
  await ensureFileState();
  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw) as Partial<FileState>;
  return {
    rounds: (parsed.rounds ?? []).map(normalizeRound),
    gameSessions: (parsed.gameSessions ?? []).map(normalizeGameSession),
    geotingProposals: (parsed.geotingProposals ?? []).map(normalizeProposal),
  };
}

async function writeFileState(state: FileState) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(state, null, 2), "utf8");
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

  const resetKey = "reset_active_scores_multigame_v1";
  const resetRows = (await sql`
    SELECT value FROM geotia_meta WHERE key = ${resetKey}
  `) as Array<{ value: string }>;
  if (resetRows.length === 0) {
    await sql`DELETE FROM geotia_rounds`;
    await sql`DELETE FROM geotia_game_sessions`;
    await sql`
      INSERT INTO geotia_meta (key, value, updated_at)
      VALUES (${resetKey}, 'done', ${nowIso()})
      ON CONFLICT (key) DO NOTHING
    `;
  }

  schemaReady = true;
  return sql;
}

function parseDbRound(row: DbRoundRow): Round {
  const results =
    typeof row.results_json === "string"
      ? (JSON.parse(row.results_json) as PlayerResult[])
      : row.results_json;

  return normalizeRound({
    id: row.id,
    number: row.number,
    date: row.date,
    name: row.name,
    answer: row.answer,
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

  return normalizeProposal({
    id: row.id,
    title: row.title,
    body: row.body,
    ruleType: row.rule_type,
    proposedBy: row.proposed_by,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    votes,
  });
}

async function readDbRounds(): Promise<Round[] | null> {
  const sql = await ensureSchema();
  if (!sql) return null;

  const rows = (await sql`
    SELECT id, number, date, name, answer, country, continent, comment, status, created_at, updated_at, results_json
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
      id, number, date, name, answer, country, continent, comment, status, created_at, updated_at, results_json
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
      ${JSON.stringify(round.results)}::jsonb
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
      results_json = EXCLUDED.results_json
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
    SELECT id, title, body, rule_type, proposed_by, status, created_at, updated_at, votes_json
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
      id, title, body, rule_type, proposed_by, status, created_at, updated_at, votes_json
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
      ${JSON.stringify(proposal.votes)}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      rule_type = EXCLUDED.rule_type,
      proposed_by = EXCLUDED.proposed_by,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at,
      votes_json = EXCLUDED.votes_json
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
  if (dbProposals) return dbProposals;
  return (await readFileState()).geotingProposals;
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

export async function getAppState(): Promise<AppState> {
  const [rounds, gameSessions, geotingProposals] = await Promise.all([
    readRounds(),
    readGameSessions(),
    readProposals(),
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
  };
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
    votes: [],
  };

  await saveProposals([proposal, ...proposals]);
  return proposal;
}

export async function saveGeotingVote(input: VoteInput) {
  const proposals = await readProposals();
  const proposal = proposals.find((candidate) => candidate.id === input.proposalId);
  if (!proposal) {
    return { ok: false, reason: "Saken finnes ikke i GeoTingets protokoll." };
  }

  const vote: GeotingVote = {
    playerId: input.playerId,
    vote: input.vote,
    comment: input.comment,
    createdAt: nowIso(),
  };
  const nextProposal: GeotingProposal = {
    ...proposal,
    updatedAt: vote.createdAt,
    votes: [...proposal.votes.filter((candidate) => candidate.playerId !== input.playerId), vote],
  };

  await saveProposals(
    proposals.map((candidate) => (candidate.id === proposal.id ? nextProposal : candidate)),
  );
  return { ok: true, proposal: nextProposal };
}

export async function lockRound(id: string) {
  const rounds = await readRounds();
  const round = rounds.find((candidate) => candidate.id === id);
  if (!round) {
    return { ok: false, reason: "Runden finnes ikke i protokollen." };
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
  const updated = { ...round, status: "draft" as RoundStatus, updatedAt: nowIso() };
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
