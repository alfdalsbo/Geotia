import { describe, expect, it } from "vitest";

import { getGeoterIndexDossier } from "@/lib/geoterindeks-dossier";
import { getGeoterIndexRows } from "@/lib/geoterindeks";
import { players } from "@/lib/seed";
import type { GeoterIndexAdjustment } from "@/lib/types";

describe("Geoterindeks dossier", () => {
  it("finds risk, rising pressure, and unobserved geots", () => {
    const adjustments: GeoterIndexAdjustment[] = [
      {
        id: "a1",
        playerId: "alf",
        delta: 30,
        category: "initiativ",
        title: "Startet riksapparatet",
        reason: "Fikk alle i gang.",
        createdAt: "2026-05-17T10:00:00.000Z",
        createdBy: "vegard",
      },
      {
        id: "a2",
        playerId: "steinar",
        delta: -80,
        category: "anti_sabotasje",
        title: "Sen panikkendring",
        reason: "Forlot et riktig spor.",
        createdAt: "2026-05-17T11:00:00.000Z",
        createdBy: "alf",
      },
    ];

    const dossier = getGeoterIndexDossier(getGeoterIndexRows(players, adjustments));

    expect(dossier.summary.rising).toBe(1);
    expect(dossier.summary.falling).toBe(1);
    expect(dossier.summary.unobserved).toBeGreaterThan(0);
    expect(dossier.items.some((item) => item.playerId === "steinar")).toBe(true);
  });
});
