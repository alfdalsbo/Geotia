import { describe, expect, it } from "vitest";

import {
  getGeoGuessrTipCategories,
  getGeoGuessrTipSources,
  getGeoGuessrTips,
  selectGeoGuessrTips,
} from "@/lib/geoguessr-tips";

describe("GeoGuessr tips", () => {
  it("loads the local tips bank", () => {
    expect(getGeoGuessrTips()).toHaveLength(223);
    expect(getGeoGuessrTipSources().length).toBeGreaterThan(0);
    expect(getGeoGuessrTipCategories().length).toBeGreaterThan(0);
  });

  it("has unique ids and valid source references", () => {
    const tips = getGeoGuessrTips();
    const sources = new Set(getGeoGuessrTipSources().map((source) => source.id));
    const ids = new Set(tips.map((tip) => tip.id));

    expect(ids.size).toBe(tips.length);
    expect(tips.flatMap((tip) => tip.sourceRefs).filter((sourceRef) => !sources.has(sourceRef))).toEqual([]);
  });

  it("returns stable selections for the same seed", () => {
    const first = selectGeoGuessrTips({ placement: "dashboard", seed: "2026-05-17", count: 5 });
    const second = selectGeoGuessrTips({ placement: "dashboard", seed: "2026-05-17", count: 5 });

    expect(first.map((tip) => tip.id)).toEqual(second.map((tip) => tip.id));
  });

  it("does not use country or tag data for open SlowGeo tips", () => {
    const baseline = selectGeoGuessrTips({ placement: "slowgeo-open", seed: "round-123", count: 3 });
    const poisonedContext = {
      placement: "slowgeo-open",
      seed: "round-123",
      count: 3,
      country: "Nederland",
      tags: ["nederland", "gule-plater"],
    } as unknown as Parameters<typeof selectGeoGuessrTips>[0];
    const poisoned = selectGeoGuessrTips(poisonedContext);

    expect(poisoned.map((tip) => tip.id)).toEqual(baseline.map((tip) => tip.id));
    expect(poisoned.every((tip) => tip.countries.length === 0)).toBe(true);
  });

  it("prioritizes revealed country matches and falls back when there is no match", () => {
    const nederland = selectGeoGuessrTips({
      placement: "slowgeo-reveal",
      seed: "revealed-round",
      count: 4,
      country: "Nederland",
      continent: "Europa",
      tags: ["gule-plater"],
    });
    const unknown = selectGeoGuessrTips({
      placement: "slowgeo-reveal",
      seed: "revealed-round",
      count: 4,
      country: "Atlantis",
      continent: "Havbunn",
      tags: ["ukjent"],
    });

    expect(nederland.some((tip) => tip.countries.includes("Nederland"))).toBe(true);
    expect(unknown).toHaveLength(4);
    expect(new Set(unknown.map((tip) => tip.id)).size).toBe(unknown.length);
  });
});
