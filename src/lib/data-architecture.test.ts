import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { postgresSchemaMigrations } from "@/lib/data/migrations";
import {
  parseRoundResultsPayload,
  safeParseFileStatePayload,
} from "@/lib/data/persistence-schemas";

let tempDir: string | null = null;
const originalVercel = process.env.VERCEL;
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalForceFileStorage = process.env.GEOTIA_FORCE_FILE_STORAGE;

afterEach(async () => {
  delete process.env.GEOTIA_DATA_FILE;
  delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
  delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  delete process.env.SLOWGEO_MONTHLY_ROUND_CAP;
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalForceFileStorage === undefined) delete process.env.GEOTIA_FORCE_FILE_STORAGE;
  else process.env.GEOTIA_FORCE_FILE_STORAGE = originalForceFileStorage;

  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe("Geotia data architecture boundaries", () => {
  it("keeps schema migrations explicitly ordered and uniquely named", () => {
    const ids = postgresSchemaMigrations.map((migration) => migration.id);

    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toMatch(/^\d{12}_/);
  });

  it("validates persistent JSON payloads before they enter domain normalization", () => {
    expect(safeParseFileStatePayload("{not-json")).toBeNull();
    expect(
      safeParseFileStatePayload({
        meta: { schemaVersion: "2" },
        rounds: [],
        gameSessions: [],
        geotingProposals: [],
        geoterIndexAdjustments: [],
        geoticOrderAssessments: [],
        geoticOrderPromotionCases: [],
        playerProfiles: [],
        geocodeCache: [],
        slowGeoUsedChallenges: [],
      }),
    ).toMatchObject({ meta: { schemaVersion: "2" } });

    expect(() =>
      parseRoundResultsPayload([
        {
          playerId: "alf",
          status: "deltatt",
          actualKm: "kort vei",
        },
      ]),
    ).toThrow("Round results JSON");
  });

  it("serializes concurrent SlowGeo creation through the service facade", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "geotia-data-architecture-"));
    process.env.GEOTIA_DATA_FILE = path.join(tempDir, "state.json");
    process.env.GOOGLE_MAPS_SERVER_API_KEY = "";
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "";
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.resetModules();

    const { createSlowGeoRound, getAppState } = await import("@/lib/store");
    const [first, second] = await Promise.all([
      createSlowGeoRound({ title: "Parallell A" }),
      createSlowGeoRound({ title: "Parallell B" }),
    ]);
    const state = await getAppState();

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(state.rounds.map((round) => round.number)).toEqual([1, 2]);
    expect(state.rounds[0].challenge?.candidateId).not.toBe(state.rounds[1].challenge?.candidateId);
  });

  it("serializes mutations across different service keys", async () => {
    vi.resetModules();
    const { withDataMutationLock } = await import("@/lib/data/mutation-lock");
    const events: string[] = [];
    let releaseFirst: () => void = () => {};
    const firstCanFinish = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = withDataMutationLock("profiles", async () => {
      events.push("profiles-start");
      await firstCanFinish;
      events.push("profiles-end");
    });
    const second = withDataMutationLock("slowgeo", async () => {
      events.push("slowgeo-start");
      events.push("slowgeo-end");
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(events).toEqual(["profiles-start"]);

    releaseFirst();
    await Promise.all([first, second]);

    expect(events).toEqual(["profiles-start", "profiles-end", "slowgeo-start", "slowgeo-end"]);
  });

  it("serializes concurrent GeoTing votes so no vote is lost", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "geotia-data-architecture-"));
    process.env.GEOTIA_DATA_FILE = path.join(tempDir, "state.json");
    vi.resetModules();

    const { createGeotingProposal, getAppState, saveGeotingVote, startGeotingVote } = await import("@/lib/store");
    const proposal = await createGeotingProposal({
      title: "Parallell urne",
      body: "Stemmer skal ikke trakke hverandre ned.",
      ruleType: "mindre",
      proposedBy: "alf",
    });
    const started = await startGeotingVote({
      proposalId: proposal.id,
      playerId: "alf",
      oathText: "Geo-eden er avlagt.",
    });

    expect(started.ok).toBe(true);

    const voterIds = ["alf", "vegard", "jorgen", "steinar", "sverre", "fredrik", "ruben"];
    await Promise.all(
      voterIds.map((playerId) =>
        saveGeotingVote({
          proposalId: proposal.id,
          playerId,
          vote: "for",
          comment: `Stemmer for ${playerId}.`,
        }),
      ),
    );
    const state = await getAppState();
    const stored = state.geotingProposals.find((candidate) => candidate.id === proposal.id);

    expect(stored?.votes.map((vote) => vote.playerId).sort()).toEqual([...voterIds].sort());
    expect(stored?.status).toBe("passed");
  });

  it("fails clearly on Vercel when durable storage is missing", async () => {
    process.env.VERCEL = "1";
    delete process.env.DATABASE_URL;
    delete process.env.GEOTIA_FORCE_FILE_STORAGE;
    vi.resetModules();

    const { getAppState, getStorageMode } = await import("@/lib/store");

    expect(getStorageMode()).toContain("DATABASE_URL");
    await expect(getAppState()).rejects.toThrow("DATABASE_URL");
  });
});
