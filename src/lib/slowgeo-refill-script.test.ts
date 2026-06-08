import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

type RefillUtils = {
  refillCandidates: (input: Record<string, unknown>) => Promise<{
    changed: boolean;
    added: Array<{ id: string; panoId?: string | null }>;
    reason: string;
  }>;
};

function baseCandidate(id = "alpha") {
  return {
    id,
    label: "Alpha sentrum",
    country: "Norge",
    continent: "Europa",
    lat: 60.3913,
    lon: 5.3221,
    heading: 90,
    pitch: 0,
    fov: 88,
    difficulty: "middels",
    theme: "testgate med fjordluft",
    signature: "En testkandidat som ikke skal røpe mer enn nødvendig.",
    tags: ["test", "norge"],
  };
}

async function importRefillUtils() {
  return (await import("../../scripts/slowgeo-pool-utils.mjs")) as RefillUtils;
}

describe("SlowGeo refill script", () => {
  it("does not require Google metadata when the pool is already healthy", async () => {
    const { refillCandidates } = await importRefillUtils();
    const result = await refillCandidates({
      candidates: [baseCandidate("alpha"), baseCandidate("beta")],
      usedHistory: { usedCandidateIds: [], usedPanoIds: [] },
      targetUnused: 2,
      lowWatermark: 0,
      apiKey: "",
    });

    expect(result).toMatchObject({ changed: false, reason: "pool-ok" });
  });

  it("skips used pano ids and unsafe attribution before accepting a refill candidate", async () => {
    const { refillCandidates } = await importRefillUtils();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "OK", pano_id: "used-pano", copyright: "© Google" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "OK", pano_id: "unsafe-pano", copyright: "© Alpha" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "OK",
          pano_id: "fresh-pano",
          date: "2026-01",
          copyright: "© Google",
          location: { lat: 60.392, lng: 5.323 },
        }),
      });

    const result = await refillCandidates({
      candidates: [baseCandidate()],
      usedHistory: { usedCandidateIds: ["alpha"], usedPanoIds: ["used-pano"] },
      targetUnused: 1,
      lowWatermark: 1,
      apiKey: "unit-test-key",
      fetchImpl: fetchMock,
      maxAttempts: 5,
      now: "2026-05-20T12:00:00.000Z",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.changed).toBe(true);
    expect(result.added).toHaveLength(1);
    expect(result.added[0].panoId).toBe("fresh-pano");
  });

  it("fails without changing the candidate file when refill needs metadata but no key exists", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "slowgeo-refill-"));
    const candidateFile = path.join(tempDir, "candidates.json");
    const original = `${JSON.stringify([baseCandidate()], null, 2)}\n`;
    await writeFile(candidateFile, original, "utf8");

    try {
      const result = spawnSync(process.execPath, ["scripts/slowgeo-refill.mjs"], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          GEOTIA_DATA_FILE: path.join(tempDir, "state.json"),
          SLOWGEO_CANDIDATE_FILE: candidateFile,
          SLOWGEO_USED_CHALLENGES_JSON: JSON.stringify([{ candidateId: "alpha", usedAt: "2026-05-20T12:00:00.000Z" }]),
          SLOWGEO_POOL_TARGET_UNUSED: "1",
          SLOWGEO_POOL_LOW_WATERMARK: "1",
          GOOGLE_MAPS_SERVER_API_KEY: "",
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "",
        },
        encoding: "utf8",
      });

      expect(result.status).not.toBe(0);
      expect(result.stderr + result.stdout).toContain("GOOGLE_MAPS_SERVER_API_KEY is required");
      await expect(readFile(candidateFile, "utf8")).resolves.toBe(original);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
