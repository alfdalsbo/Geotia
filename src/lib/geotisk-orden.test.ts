import { describe, expect, it } from "vitest";

import {
  formatServiceTime,
  getEligibleOrderRank,
  getGeoticOrderRows,
  getOrderProgressToRank,
  getServiceWeeksSince,
  geoticOrderFoundingGate,
  geoticOrderRanks,
} from "@/lib/geotisk-orden";
import { players } from "@/lib/seed";
import type { Player, Standing } from "@/lib/types";

describe("Den Geotiske Orden", () => {
  it("uses time, rounds, points and hidden trust to find eligible rank", () => {
    expect(
      getEligibleOrderRank({
        serviceWeeks: 12,
        roundsPlayed: 40,
        lifetimePoints: 125,
        trustScore: 765,
      }).id,
    ).toBe("geomentariker");

    expect(
      getEligibleOrderRank({
        serviceWeeks: 20,
        roundsPlayed: 80,
        lifetimePoints: 280,
        trustScore: 700,
      }).id,
    ).toBe("anerkjent_borger");
  });

  it("keeps public progress free of the hidden trust score", () => {
    const partimedlem = geoticOrderRanks.find((rank) => rank.id === "partimedlem")!;
    expect(getOrderProgressToRank({ serviceWeeks: 8, roundsPlayed: 25, lifetimePoints: 75 }, partimedlem)).toBe(100);
  });

  it("formats long service time from the 2020 start point", () => {
    expect(getServiceWeeksSince("2020-04-01", new Date("2026-05-17T12:00:00.000Z"))).toBe(319);
    expect(formatServiceTime(319)).toBe("319 uker · 6 år og 7 uker");
  });

  it("lets a college assessment set a visible order rank", () => {
    const danny = players.find((player) => player.id === "danny")!;
    const standing: Standing = {
      rank: 1,
      player: danny,
      totalPoints: 30,
      totalKattometer: 0,
      lockedRounds: 12,
      roundsPlayed: 12,
      wins: 0,
      top3: 0,
      lastPlaces: 0,
      absences: 0,
      invalids: 0,
      averagePoints: 2.5,
      averageKattometer: 0,
      bestKm: null,
      worstKm: null,
      bestSinglePoints: 5,
    };

    const rows = getGeoticOrderRows(
      [danny],
      [standing],
      [],
      [
        {
          playerId: "danny",
          rankId: "anerkjent_borger",
          serviceWeeks: 4,
          hiddenCategory: "turist",
          status: "provetid",
          sponsor: "SS",
          trial: "Borgerløftet",
          publicNote: "Offentlig verdig, men fortsatt under herding.",
          internalNote: "Skal ikke se vurderingen.",
          updatedAt: "2026-05-16T20:00:00.000Z",
          updatedBy: "alf",
        },
      ],
    );

    expect(rows[0].rank.id).toBe("anerkjent_borger");
    expect(rows[0].trustScore).toBe(700);
    expect(rows[0].status.publicLabel).toBe("På prøve");
  });

  it("does not promote visible rank automatically when raw thresholds are met", () => {
    const candidate: Player = {
      id: "testgeot",
      name: "Test Geot",
      shortName: "Test",
      partyId: "",
      role: "geot",
      color: "#123456",
      title: "Prøvegeot",
      specialty: "Test",
      strengths: "Møter opp",
      weaknesses: "Forstår for mye",
      moment: "Ble nesten rangert",
      mark: "T",
    };
    const standing: Standing = {
      rank: 1,
      player: candidate,
      totalPoints: 140,
      totalKattometer: 0,
      lockedRounds: 45,
      roundsPlayed: 45,
      wins: 0,
      top3: 0,
      lastPlaces: 0,
      absences: 0,
      invalids: 0,
      averagePoints: 3,
      averageKattometer: 0,
      bestKm: null,
      worstKm: null,
      bestSinglePoints: 7,
    };

    const rows = getGeoticOrderRows(
      [candidate],
      [standing],
      [
        {
          id: "trust-test",
          playerId: "testgeot",
          delta: 65,
          category: "fellesskap",
          title: "Testtillit",
          reason: "Nok til rå terskel.",
          createdAt: "2026-05-16T20:00:00.000Z",
          createdBy: "alf",
        },
      ],
      [],
    );

    expect(rows[0].rank.id).toBe("borger");
    expect(rows[0].eligibleRank.id).toBe("geomentariker");
    expect(rows[0].promotionReady).toBe(true);
  });

  it("keeps Danny on the order path before any party founding rights", () => {
    const danny = players.find((player) => player.id === "danny")!;
    const rows = getGeoticOrderRows([danny], [], [], []);

    expect(rows[0].rank.id).toBe("borger");
    expect(rows[0].player.canVote).toBe(false);
    expect(geoticOrderFoundingGate.title).toBe("Partistiftelse er nivå 7");
    expect(geoticOrderFoundingGate.requirements.join(" ")).toContain("Partigründer");
  });
});
