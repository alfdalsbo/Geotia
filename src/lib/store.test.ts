import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

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

    const saved = await upsertRound({
      date: "2026-05-16",
      name: "Testprotokollen",
      answer: "Wien",
      country: "Østerrike",
      continent: "Europa",
      comment: "Embetsmessig prøve",
      results: [
        { playerId: "alf", status: "deltatt", actualKm: 10 },
        { playerId: "vegard", status: "deltatt", actualKm: 20 },
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
  });
});
