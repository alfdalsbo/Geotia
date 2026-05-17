import { describe, expect, it } from "vitest";

import { getEarnedPlayerBadges } from "@/lib/geotia-badges";
import { players } from "@/lib/seed";
import type { GeoterIndexAdjustment, Standing } from "@/lib/types";

describe("Geotia badges", () => {
  it("awards identity, precision, and index-driven badges without requiring new forms", () => {
    const player = players.find((candidate) => candidate.id === "alf")!;
    const standing = {
      player,
      bestKm: 12,
      worstKm: 5100,
      top3: 1,
      lastPlaces: 3,
    } as Standing;
    const adjustments: GeoterIndexAdjustment[] = [
      {
        id: "adj-1",
        playerId: player.id,
        delta: 20,
        category: "anti_sabotasje",
        title: "India-varsling",
        reason: "Stanset en India-kollaps.",
        createdAt: "2026-05-17T10:00:00.000Z",
        createdBy: "vegard",
      },
      {
        id: "adj-2",
        playerId: player.id,
        delta: 50,
        category: "geografisk",
        title: "Ta en Sarajevo",
        reason: "Høyt ut, hånet, og blink.",
        createdAt: "2026-05-17T11:00:00.000Z",
        createdBy: "vegard",
      },
    ];

    const badges = getEarnedPlayerBadges({ adjustments, player, rounds: [], standing }).map((badge) => badge.id);

    expect(badges).toContain("embetsbygger");
    expect(badges).toContain("stolpeobservator");
    expect(badges).toContain("india-redder");
    expect(badges).toContain("sarajevo-baerer");
    expect(badges).toContain("kartlig-ustabil");
    expect(badges).toContain("tingkraft");
  });
});
