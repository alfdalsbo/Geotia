import { describe, expect, it } from "vitest";

import { computeRound, computeStandings, computeWorstThreeAverage, geotStatus } from "@/lib/scoring";
import type { Standing } from "@/lib/types";
import { players } from "@/lib/seed";
import type { Round } from "@/lib/types";

function round(results: Round["results"]): Round {
  return {
    id: "runde-1",
    number: 1,
    date: "2026-05-16",
    name: "GeoVAR-prøven",
    answer: "Sarajevo",
    country: "Bosnia-Hercegovina",
    continent: "Europa",
    comment: "",
    status: "locked",
    createdAt: "2026-05-16T10:00:00.000Z",
    updatedAt: "2026-05-16T10:00:00.000Z",
    results,
  };
}

describe("SlowGeo scoring", () => {
  it("gives tied players the points for their shared rank", () => {
    const computed = computeRound(
      round([
        { playerId: "alf", status: "deltatt", actualKm: 10 },
        { playerId: "vegard", status: "deltatt", actualKm: 10 },
        { playerId: "jorgen", status: "deltatt", actualKm: 20 },
        { playerId: "steinar", status: "deltatt", actualKm: 30 },
        { playerId: "sverre", status: "deltatt", actualKm: 40 },
        { playerId: "fredrik", status: "deltatt", actualKm: 50 },
        { playerId: "ruben", status: "deltatt", actualKm: 60 },
      ]),
      players,
    );

    expect(computed.results.find((result) => result.player.id === "alf")?.points).toBe(7);
    expect(computed.results.find((result) => result.player.id === "vegard")?.points).toBe(7);
    expect(computed.results.find((result) => result.player.id === "jorgen")?.points).toBe(5);
  });

  it("uses the valid participant count as the max score", () => {
    const sixPlayers = computeRound(
      round([
        { playerId: "alf", status: "deltatt", actualKm: 10 },
        { playerId: "vegard", status: "deltatt", actualKm: 20 },
        { playerId: "jorgen", status: "deltatt", actualKm: 30 },
        { playerId: "steinar", status: "deltatt", actualKm: 40 },
        { playerId: "sverre", status: "deltatt", actualKm: 50 },
        { playerId: "danny", status: "deltatt", actualKm: 60 },
      ]),
      players,
    );
    const eightPlayers = computeRound(
      round([
        { playerId: "alf", status: "deltatt", actualKm: 10 },
        { playerId: "vegard", status: "deltatt", actualKm: 20 },
        { playerId: "jorgen", status: "deltatt", actualKm: 30 },
        { playerId: "steinar", status: "deltatt", actualKm: 40 },
        { playerId: "sverre", status: "deltatt", actualKm: 50 },
        { playerId: "fredrik", status: "deltatt", actualKm: 60 },
        { playerId: "ruben", status: "deltatt", actualKm: 70 },
        { playerId: "danny", status: "deltatt", actualKm: 80 },
      ]),
      players,
    );

    expect(sixPlayers.maxPoints).toBe(6);
    expect(sixPlayers.results.find((result) => result.player.id === "alf")?.points).toBe(6);
    expect(sixPlayers.results.find((result) => result.player.id === "danny")?.points).toBe(1);
    expect(eightPlayers.maxPoints).toBe(8);
    expect(eightPlayers.results.find((result) => result.player.id === "alf")?.points).toBe(8);
    expect(eightPlayers.results.find((result) => result.player.id === "danny")?.points).toBe(1);
  });

  it("includes Danny in SlowGeo standings without changing his voting status", () => {
    const danny = players.find((player) => player.id === "danny");
    const standings = computeStandings(players, [
      round([
        { playerId: "alf", status: "deltatt", actualKm: 10 },
        { playerId: "vegard", status: "deltatt", actualKm: 20 },
        { playerId: "jorgen", status: "deltatt", actualKm: 30 },
        { playerId: "steinar", status: "deltatt", actualKm: 40 },
        { playerId: "sverre", status: "deltatt", actualKm: 50 },
        { playerId: "danny", status: "deltatt", actualKm: 60 },
      ]),
    ]);

    expect(danny?.canCompete).toBe(true);
    expect(danny?.canVote).toBe(false);
    expect(standings.find((standing) => standing.player.id === "danny")?.roundsPlayed).toBe(1);
  });

  it("charges non-participants with the average of the three worst valid km results", () => {
    const results: Round["results"] = [
      { playerId: "alf", status: "deltatt", actualKm: 10 },
      { playerId: "vegard", status: "deltatt", actualKm: 20 },
      { playerId: "jorgen", status: "deltatt", actualKm: 30 },
      { playerId: "steinar", status: "deltatt", actualKm: 40 },
      { playerId: "sverre", status: "deltatt", actualKm: 50 },
      { playerId: "fredrik", status: "ikke_deltatt", actualKm: null },
      { playerId: "ruben", status: "ugyldig", actualKm: null },
    ];

    expect(computeWorstThreeAverage(results)).toBe(40);

    const computed = computeRound(round(results), players);
    expect(computed.results.find((result) => result.player.id === "fredrik")?.chargedKm).toBe(40);
    expect(computed.results.find((result) => result.player.id === "ruben")?.chargedKm).toBe(40);
    expect(computed.results.find((result) => result.player.id === "fredrik")?.points).toBe(0);
  });

  it("sorts standings by points, then lower kattometer, then wins", () => {
    const rounds: Round[] = [
      round([
        { playerId: "alf", status: "deltatt", actualKm: 10 },
        { playerId: "vegard", status: "deltatt", actualKm: 20 },
        { playerId: "jorgen", status: "deltatt", actualKm: 30 },
        { playerId: "steinar", status: "deltatt", actualKm: 40 },
        { playerId: "sverre", status: "deltatt", actualKm: 50 },
        { playerId: "fredrik", status: "deltatt", actualKm: 60 },
        { playerId: "ruben", status: "deltatt", actualKm: 70 },
      ]),
      {
        ...round([
          { playerId: "alf", status: "deltatt", actualKm: 20 },
          { playerId: "vegard", status: "deltatt", actualKm: 10 },
          { playerId: "jorgen", status: "deltatt", actualKm: 30 },
          { playerId: "steinar", status: "deltatt", actualKm: 40 },
          { playerId: "sverre", status: "deltatt", actualKm: 50 },
          { playerId: "fredrik", status: "deltatt", actualKm: 60 },
          { playerId: "ruben", status: "deltatt", actualKm: 70 },
        ]),
        id: "runde-2",
        number: 2,
      },
    ];

    const standings = computeStandings(players, rounds);
    expect(standings[0].player.id).toBe("alf");
    expect(standings[0].totalPoints).toBe(13);
    expect(standings[1].player.id).toBe("vegard");
    expect(standings[1].totalPoints).toBe(13);
  });
});

function standing(overrides: Partial<Standing>): Standing {
  const base: Standing = {
    rank: 1,
    player: {
      id: "test",
      shortName: "Test",
      title: "",
      specialty: "",
      partyId: null,
      color: "#000000",
    },
    totalPoints: 30,
    totalKattometer: 1000,
    lockedRounds: 6,
    roundsPlayed: 6,
    wins: 1,
    top3: 4,
    lastPlaces: 0,
    absences: 0,
    invalids: 0,
    averagePoints: 5,
    averageKattometer: 167,
    bestKm: 5,
    worstKm: 400,
    bestSinglePoints: 7,
  };
  return { ...base, ...overrides };
}

describe("geotStatus", () => {
  it("returnerer JEVN for spillere uten låste runder", () => {
    expect(geotStatus(standing({ lockedRounds: 0 }))).toBe("JEVN");
  });

  it("returnerer SOLID for høyt snitt og lavt kattometer", () => {
    expect(
      geotStatus(standing({ averagePoints: 5.2, averageKattometer: 800 })),
    ).toBe("SOLID");
  });

  it("returnerer JEVN for normal prestasjon", () => {
    expect(
      geotStatus(standing({ averagePoints: 3.5, averageKattometer: 2000, worstKm: 1200 })),
    ).toBe("JEVN");
  });

  it("returnerer UROLIG for lavt snitt og solid verste-km", () => {
    expect(
      geotStatus(standing({ averagePoints: 2.5, averageKattometer: 2500, worstKm: 2200 })),
    ).toBe("UROLIG");
  });

  it("returnerer INDIA-RISK for høy desertering", () => {
    expect(
      geotStatus(standing({ lockedRounds: 10, absences: 4, averagePoints: 3 })),
    ).toBe("INDIA-RISK");
  });

  it("returnerer INDIA-RISK for ekstreme enkelt-bommer", () => {
    expect(
      geotStatus(standing({ averagePoints: 4, worstKm: 8000 })),
    ).toBe("INDIA-RISK");
  });
});
