import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { GeoLocation } from "@/lib/types";

let tempDir: string | null = null;

afterEach(async () => {
  delete process.env.GEOTIA_DATA_FILE;
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
      rankId: "anerkjent_borger",
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
    expect(state.geoticOrderAssessments[0].rankId).toBe("anerkjent_borger");
    expect(state.geoticOrderAssessments[0].hiddenCategory).toBe("turist");
  });
});
