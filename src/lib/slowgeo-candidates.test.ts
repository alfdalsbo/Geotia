import { afterEach, describe, expect, it } from "vitest";

import {
  getSlowGeoCandidatePoolStats,
  slowGeoCandidates,
  validateSlowGeoCandidates,
  type StreetViewCandidate,
} from "@/lib/slowgeo-candidates";

describe("SlowGeo candidate data", () => {
  const originalTargetUnused = process.env.SLOWGEO_POOL_TARGET_UNUSED;
  const originalLowWatermark = process.env.SLOWGEO_POOL_LOW_WATERMARK;

  afterEach(() => {
    if (originalTargetUnused === undefined) {
      delete process.env.SLOWGEO_POOL_TARGET_UNUSED;
    } else {
      process.env.SLOWGEO_POOL_TARGET_UNUSED = originalTargetUnused;
    }
    if (originalLowWatermark === undefined) {
      delete process.env.SLOWGEO_POOL_LOW_WATERMARK;
    } else {
      process.env.SLOWGEO_POOL_LOW_WATERMARK = originalLowWatermark;
    }
  });

  it("validates the checked-in candidate file schema", () => {
    expect(validateSlowGeoCandidates(slowGeoCandidates)).toHaveLength(slowGeoCandidates.length);
    expect(slowGeoCandidates.length).toBeGreaterThanOrEqual(500);
  });

  it("keeps candidate ids and stored pano ids unique", () => {
    const ids = slowGeoCandidates.map((candidate) => candidate.id);
    const panoIds = slowGeoCandidates.flatMap((candidate) => (candidate.panoId ? [candidate.panoId] : []));

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(panoIds).size).toBe(panoIds.length);
  });

  it("counts used and unused candidates for pool warnings", () => {
    process.env.SLOWGEO_POOL_TARGET_UNUSED = "4";
    process.env.SLOWGEO_POOL_LOW_WATERMARK = "1";
    const candidates: StreetViewCandidate[] = [
      {
        id: "alpha",
        label: "Alpha",
        country: "Norge",
        continent: "Europa",
        lat: 60,
        lon: 10,
        heading: 90,
        difficulty: "lett",
        theme: "test",
        signature: "test",
        tags: ["test"],
      },
      {
        id: "beta",
        label: "Beta",
        country: "Norge",
        continent: "Europa",
        lat: 61,
        lon: 11,
        heading: 180,
        difficulty: "middels",
        theme: "test",
        signature: "test",
        tags: ["test"],
        panoId: "beta-pano",
      },
    ];

    const lowStats = getSlowGeoCandidatePoolStats({
      candidates,
      usedCandidateIds: ["alpha"],
    });
    expect(lowStats).toMatchObject({
      totalCandidates: 2,
      usedCandidateCount: 1,
      unusedCandidateCount: 1,
      status: "low",
    });

    const emptyStats = getSlowGeoCandidatePoolStats({
      candidates,
      usedCandidateIds: ["alpha"],
      usedPanoIds: ["beta-pano"],
    });
    expect(emptyStats).toMatchObject({
      unusedCandidateCount: 0,
      status: "empty",
    });
  });
});
