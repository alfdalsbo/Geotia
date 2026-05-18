import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { GeoLocation } from "@/lib/types";

let tempDir: string | null = null;

afterEach(async () => {
  delete process.env.GEOTIA_DATA_FILE;
  delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
  delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  delete process.env.SLOWGEO_MONTHLY_ROUND_CAP;
  vi.resetModules();
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe("Geotia file store", () => {
  it("creates, locks, and reads a round from the local protocol file", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "geotia-store-"));
    process.env.GEOTIA_DATA_FILE = path.join(tempDir, "state.json");
    vi.resetModules();

    const { upsertRound, lockRound, getAppState } = await import("@/lib/store");
    const answerLocation: GeoLocation = {
      lat: 48.2082,
      lon: 16.3738,
      label: "Wien, Østerrike",
      query: "Wien",
      country: "Østerrike",
      source: "nominatim",
    };
    const guessLocation: GeoLocation = {
      lat: 47.4979,
      lon: 19.0402,
      label: "Budapest, Ungarn",
      query: "Budapest",
      country: "Ungarn",
      source: "nominatim",
    };

    const saved = await upsertRound({
      date: "2026-05-16",
      name: "Testprotokollen",
      answer: "Wien",
      answerLocation,
      country: "Østerrike",
      continent: "Europa",
      comment: "Embetsmessig prøve",
      results: [
        {
          playerId: "alf",
          status: "deltatt",
          actualKm: 10,
          guessText: "Wien sentrum",
          guessLocation: answerLocation,
          distanceSource: "auto",
        },
        {
          playerId: "vegard",
          status: "deltatt",
          actualKm: 214,
          guessText: "Budapest",
          guessLocation,
          distanceSource: "manual",
        },
        { playerId: "jorgen", status: "deltatt", actualKm: 30 },
        { playerId: "steinar", status: "deltatt", actualKm: 40 },
        { playerId: "sverre", status: "deltatt", actualKm: 50 },
        { playerId: "fredrik", status: "ikke_deltatt", actualKm: null },
        { playerId: "ruben", status: "ugyldig", actualKm: null },
      ],
    });

    const lock = await lockRound(saved.id);
    const state = await getAppState();

    expect(lock.ok).toBe(true);
    expect(state.rounds).toHaveLength(1);
    expect(state.rounds[0].status).toBe("locked");
    expect(state.rounds[0].number).toBe(1);
    expect(state.rounds[0].answerLocation?.label).toBe("Wien, Østerrike");
    expect(state.rounds[0].results.find((result) => result.playerId === "vegard")?.distanceSource).toBe("manual");
    expect(state.rounds[0].mapSnapshot?.markers.map((marker) => marker.id)).toEqual([
      "answer",
      "guess-alf",
      "guess-vegard",
    ]);
  });

  it("persists Geoterindeksen adjustments in the local protocol file", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "geotia-store-"));
    process.env.GEOTIA_DATA_FILE = path.join(tempDir, "state.json");
    vi.resetModules();

    const { addGeoterIndexAdjustment, getAppState } = await import("@/lib/store");

    await addGeoterIndexAdjustment({
      playerId: "alf",
      delta: 30,
      category: "fellesskap",
      title: "Fellesskapsmobilisering",
      reason: "Fikk passive geoter inn i samtalen.",
      createdBy: "vegard",
    });

    const state = await getAppState();
    expect(state.geoterIndexAdjustments).toHaveLength(1);
    expect(state.geoterIndexAdjustments[0].delta).toBe(30);
  });

  it("persists Den Geotiske Orden assessments in the local protocol file", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "geotia-store-"));
    process.env.GEOTIA_DATA_FILE = path.join(tempDir, "state.json");
    vi.resetModules();

    const { upsertGeoticOrderAssessment, getAppState } = await import("@/lib/store");

    await upsertGeoticOrderAssessment({
      playerId: "danny",
      rankId: "borger",
      serviceWeeks: 4,
      hiddenCategory: "turist",
      status: "provetid",
      sponsor: "SS",
      trial: "Borgerløftet",
      publicNote: "Tingvitnet viser tegn til ordensbarhet.",
      internalNote: "Følges uten at han får vite av hvem.",
      updatedBy: "alf",
    });

    const state = await getAppState();
    expect(state.geoticOrderAssessments).toHaveLength(1);
    expect(state.geoticOrderAssessments[0].rankId).toBe("borger");
    expect(state.geoticOrderAssessments[0].hiddenCategory).toBe("turist");
  });

  it("blocks direct order promotion and requires unanimous Third College approval", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "geotia-store-"));
    process.env.GEOTIA_DATA_FILE = path.join(tempDir, "state.json");
    await writeFile(
      process.env.GEOTIA_DATA_FILE,
      JSON.stringify(
        {
          meta: {},
          rounds: [],
          gameSessions: [],
          geotingProposals: [],
          geoterIndexAdjustments: [],
          geoticOrderAssessments: [],
          geoticOrderPromotionCases: [
            {
              id: "promotion-danny-2",
              playerId: "danny",
              fromRankId: "borger",
              targetRankId: "anerkjent_borger",
              status: "pending",
              snapshot: {
                serviceWeeks: 4,
                roundsPlayed: 10,
                lifetimePoints: 25,
                trustScore: 700,
                eligibleRankId: "anerkjent_borger",
              },
              votes: [],
              publicNote: "Kriteriene er oppfylt. Protokollen føres videre.",
              internalNote: "Testsak.",
              createdAt: "2026-05-16T20:00:00.000Z",
              updatedAt: "2026-05-16T20:00:00.000Z",
              resolvedAt: null,
              openedBy: "system",
            },
          ],
          geocodeCache: [],
        },
        null,
        2,
      ),
      "utf8",
    );
    vi.resetModules();

    const { getAppState, upsertGeoticOrderAssessment, voteGeoticOrderPromotionCase } = await import("@/lib/store");

    const direct = await upsertGeoticOrderAssessment({
      playerId: "danny",
      rankId: "anerkjent_borger",
      serviceWeeks: 4,
      hiddenCategory: "turist",
      status: "normal",
      sponsor: "SS",
      trial: "Direkte trapp",
      publicNote: "",
      internalNote: "",
      updatedBy: "alf",
    });
    expect(direct.ok).toBe(false);

    await voteGeoticOrderPromotionCase({ caseId: "promotion-danny-2", voterId: "alf", vote: "for", comment: "Arkivnikker." });
    await voteGeoticOrderPromotionCase({ caseId: "promotion-danny-2", voterId: "steinar", vote: "for", comment: "Uro nikker." });
    let state = await getAppState();
    expect(state.geoticOrderAssessments).toHaveLength(0);
    expect(state.geoticOrderPromotionCases[0].status).toBe("pending");

    const approved = await voteGeoticOrderPromotionCase({
      caseId: "promotion-danny-2",
      voterId: "vegard",
      vote: "for",
      comment: "Paragrafen nikker.",
    });
    state = await getAppState();

    expect(approved.ok).toBe(true);
    expect(state.geoticOrderPromotionCases[0].status).toBe("approved");
    expect(state.geoticOrderAssessments[0].rankId).toBe("anerkjent_borger");
  });

  it("creates a SlowGeo round, accepts a pin, and reveals due rounds", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "geotia-store-"));
    process.env.GEOTIA_DATA_FILE = path.join(tempDir, "state.json");
    process.env.GOOGLE_MAPS_SERVER_API_KEY = "";
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "";
    vi.resetModules();

    const { createSlowGeoRound, submitSlowGeoGuess, revealDueSlowGeoRounds, getAppState } = await import("@/lib/store");

    const explicitDeadline = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const created = await createSlowGeoRound({ title: "Street View-prøven", deadlineAt: explicitDeadline });
    if (!created.ok || !created.round?.answerLocation) throw new Error("SlowGeo-runden ble ikke opprettet");

    expect(created.round.status).toBe("open");
    expect(created.round.deadlineAt).toBe(explicitDeadline);
    expect(created.round.answerLocation.source).toBe("google_street_view");
    expect(created.round.mapSnapshot).toBeNull();

    const submitted = await submitSlowGeoGuess({
      roundId: created.round.id,
      playerId: "alf",
      note: "Jeg så trikkeskinner og valgte å tro på meg selv.",
      location: {
        lat: created.round.answerLocation.lat,
        lon: created.round.answerLocation.lon,
        label: "Testpin",
        query: "pin",
        source: "manual",
      },
    });

    expect(submitted.ok).toBe(true);
    expect(submitted.round?.status).toBe("open");
    expect(submitted.round?.results.find((result) => result.playerId === "alf")?.guessLocation?.label).toBe("Testpin");
    expect(submitted.round?.results.find((result) => result.playerId === "alf")?.note).toBe(
      "Jeg så trikkeskinner og valgte å tro på meg selv.",
    );

    const resubmitted = await submitSlowGeoGuess({
      roundId: created.round.id,
      playerId: "alf",
      location: {
        lat: 0,
        lon: 0,
        label: "For sent å angre",
        query: "pin",
        source: "manual",
      },
    });

    expect(resubmitted.ok).toBe(false);
    expect(resubmitted.reason).toContain("låst");

    const reveal = await revealDueSlowGeoRounds(new Date(Date.now() + 25 * 60 * 60 * 1000));
    const state = await getAppState();
    const round = state.rounds.find((candidate) => candidate.id === created.round.id);

    expect(reveal.revealed).toBe(1);
    expect(round?.status).toBe("locked");
    expect(round?.revealedAt).toBeTruthy();
    expect(round?.results.find((result) => result.playerId === "alf")).toMatchObject({
      status: "deltatt",
      actualKm: 0,
      distanceSource: "auto",
      note: "Jeg så trikkeskinner og valgte å tro på meg selv.",
    });
    const raw = JSON.parse(await readFile(path.join(tempDir, "state.json"), "utf8")) as { meta?: Record<string, string> };
    const backups = await readdir(path.join(tempDir, "backups"));
    expect(raw.meta?.schemaVersion).toBe("2");
    expect(backups.some((file) => file.startsWith("geotia-data-"))).toBe(true);
  });

  it("keeps generic reads side-effect free until SlowGeo reveal is explicit", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "geotia-store-"));
    process.env.GEOTIA_DATA_FILE = path.join(tempDir, "state.json");
    process.env.GOOGLE_MAPS_SERVER_API_KEY = "";
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "";
    vi.resetModules();

    const { createSlowGeoRound, getAppState, revealDueSlowGeoRounds } = await import("@/lib/store");
    const deadlineAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const created = await createSlowGeoRound({ title: "Forfalt, men ren lesing", deadlineAt });
    if (!created.ok || !created.round) throw new Error("SlowGeo-runden ble ikke opprettet");
    const beforeRead = JSON.parse(await readFile(path.join(tempDir, "state.json"), "utf8")) as { meta?: Record<string, string> };

    const readState = await getAppState();
    const readRound = readState.rounds.find((candidate) => candidate.id === created.round?.id);
    const afterRead = JSON.parse(await readFile(path.join(tempDir, "state.json"), "utf8")) as { meta?: Record<string, string> };

    expect(readRound?.status).toBe("open");
    expect(afterRead.meta?.lastWriteAt).toBe(beforeRead.meta?.lastWriteAt);

    const reveal = await revealDueSlowGeoRounds();
    const revealedState = await getAppState();
    const revealedRound = revealedState.rounds.find((candidate) => candidate.id === created.round?.id);

    expect(reveal.revealed).toBe(1);
    expect(revealedRound?.status).toBe("locked");
  });

  it("returns the same slices through focused selectors as the compatibility state", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "geotia-store-"));
    process.env.GEOTIA_DATA_FILE = path.join(tempDir, "state.json");
    vi.resetModules();

    const {
      createGeotingProposal,
      getAppState,
      getGamesState,
      getGeotingState,
      getRoundsState,
      getScoreboardState,
      getSlowGeoState,
      upsertGameSession,
      upsertRound,
    } = await import("@/lib/store");

    await upsertRound({
      date: "2026-05-17",
      name: "Selector-runden",
      answer: "Bergen",
      answerLocation: null,
      country: "Norge",
      continent: "Europa",
      comment: "Selectorprøve",
      results: [],
    });
    await upsertGameSession({
      gameId: "geo",
      date: "2026-05-17",
      title: "Selector-økt",
      context: "Test",
      results: [],
    });
    await createGeotingProposal({
      title: "Selector-sak",
      body: "Velg bare det du trenger.",
      ruleType: "annet",
      proposedBy: "alf",
    });

    const appState = await getAppState();
    const [roundsState, gamesState, slowGeoState, geotingState, scoreboardState] = await Promise.all([
      getRoundsState(),
      getGamesState(),
      getSlowGeoState(),
      getGeotingState(),
      getScoreboardState(),
    ]);

    expect(roundsState.rounds).toEqual(appState.rounds);
    expect(gamesState.gameSessions).toEqual(appState.gameSessions);
    expect(gamesState.games).toEqual(appState.games);
    expect(slowGeoState.rounds).toEqual(appState.rounds);
    expect(geotingState.geotingProposals).toEqual(appState.geotingProposals);
    expect(scoreboardState.archive).toEqual(appState.archive);
  });

  it("lets Tredje Kollegium update and withdraw Geoting proposals", async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "geotia-store-"));
    process.env.GEOTIA_DATA_FILE = path.join(tempDir, "state.json");
    vi.resetModules();

    const { createGeotingProposal, getAppState, saveGeotingPartyPosition, updateGeotingProposal, withdrawGeotingProposal } = await import("@/lib/store");

    const proposal = await createGeotingProposal({
      title: "Lov om gammel ordlyd",
      body: "Første versjon.",
      ruleType: "annet",
      proposedBy: "alf",
    });

    const edited = await updateGeotingProposal({
      proposalId: proposal.id,
      title: "Lov om presis ordlyd",
      body: "Kollegiet har redigert teksten.",
      ruleType: "mindre",
      implementationStatus: "implemented",
      implementationNote: "Ført i embetsverket.",
    });
    const partyPosition = await saveGeotingPartyPosition({
      proposalId: proposal.id,
      partyId: "ss",
      position: "for",
      comment: "Embetslig ryddig.",
      updatedBy: "alf",
    });
    const withdrawn = await withdrawGeotingProposal({ proposalId: proposal.id });
    const archivedEdit = await updateGeotingProposal({
      proposalId: proposal.id,
      title: "Lov om endelig pergament",
      body: "Kollegiet kan rette arkivert tekst.",
      ruleType: "mindre",
    });
    const state = await getAppState();
    const stored = state.geotingProposals.find((candidate) => candidate.id === proposal.id);

    expect(edited.ok).toBe(true);
    expect(partyPosition.ok).toBe(true);
    expect(withdrawn.ok).toBe(true);
    expect(archivedEdit.ok).toBe(true);
    expect(stored).toMatchObject({
      title: "Lov om endelig pergament",
      body: "Kollegiet kan rette arkivert tekst.",
      ruleType: "mindre",
      status: "archived",
      implementationStatus: "implemented",
      implementationNote: "Ført i embetsverket.",
    });
    expect(stored?.partyPositions).toHaveLength(1);
    expect(stored?.resolvedAt).toBeTruthy();
    expect(stored?.implementedAt).toBeTruthy();
  });
});
