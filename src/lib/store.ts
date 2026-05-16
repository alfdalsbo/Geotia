import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { initialState, players, parties, archive } from "@/lib/seed";
import { canLockRound, emptyResults } from "@/lib/scoring";
import type { AppState, PlayerResult, Round, RoundStatus } from "@/lib/types";

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
    results: players.map((player) => {
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

async function ensureFileState() {
  try {
    await fs.access(dataFile);
  } catch {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify({ rounds: [] }, null, 2), "utf8");
  }
}

async function readFileRounds(): Promise<Round[]> {
  await ensureFileState();
  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw) as { rounds?: Round[] };
  return (parsed.rounds ?? []).map(normalizeRound);
}

async function writeFileRounds(rounds: Round[]) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify({ rounds }, null, 2), "utf8");
}

async function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  const { neon } = await import("@neondatabase/serverless");
  return neon(databaseUrl);
}

async function ensureSchema() {
  const sql = await getSql();
  if (!sql || schemaReady) return sql;

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

async function readRounds(): Promise<Round[]> {
  const dbRounds = await readDbRounds();
  if (dbRounds) return dbRounds;
  return readFileRounds();
}

async function saveRounds(rounds: Round[]) {
  const sql = await ensureSchema();
  if (sql) {
    await Promise.all(rounds.map(upsertDbRound));
    return;
  }
  await writeFileRounds(rounds);
}

export async function getAppState(): Promise<AppState> {
  const rounds = await readRounds();
  return {
    ...initialState,
    players,
    parties,
    archive,
    rounds,
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
    results: emptyResults(players),
  };
}
