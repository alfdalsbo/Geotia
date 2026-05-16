import { describe, expect, it } from "vitest";

import {
  getGeoterIndexAdjustmentTrail,
  getGeoterIndexRows,
  getGeoterIndexTier,
} from "@/lib/geoterindeks";
import { players } from "@/lib/seed";
import type { GeoterIndexAdjustment } from "@/lib/types";

describe("Geoterindeksen", () => {
  it("starts every geot at 700 and applies hidden adjustments", () => {
    const adjustments: GeoterIndexAdjustment[] = [
      {
        id: "one",
        playerId: "alf",
        delta: 50,
        category: "fellesskap",
        title: "Tok en Sarajevo",
        reason: "Høyt ut og blink.",
        createdAt: "2026-05-16T10:00:00.000Z",
        createdBy: "steinar",
      },
      {
        id: "two",
        playerId: "alf",
        delta: -10,
        category: "anti_sabotasje",
        title: "Uutholdelig etterpå",
        reason: "Automatisk sosial balanse.",
        createdAt: "2026-05-16T10:10:00.000Z",
        createdBy: "vegard",
      },
    ];

    const rows = getGeoterIndexRows(players, adjustments);
    const alf = rows.find((row) => row.player.id === "alf");
    const danny = rows.find((row) => row.player.id === "danny");

    expect(alf?.score).toBe(740);
    expect(alf?.history.map((point) => point.score)).toEqual([700, 750, 740]);
    expect(alf?.history[1]).toMatchObject({
      scoreBefore: 700,
      scoreAfter: 750,
      reason: "Høyt ut og blink.",
      createdBy: "steinar",
    });
    expect(getGeoterIndexAdjustmentTrail("alf", adjustments)[1]).toMatchObject({
      scoreBefore: 750,
      scoreAfter: 740,
      reason: "Automatisk sosial balanse.",
    });
    expect(danny?.score).toBe(700);
  });

  it("classifies tiers according to the hidden law text", () => {
    expect(getGeoterIndexTier(960).name).toBe("Geosofisk Overklasse");
    expect(getGeoterIndexTier(700).name).toBe("Alminnelig Geot");
    expect(getGeoterIndexTier(240).name).toBe("El Tari-Klassen");
  });
});
