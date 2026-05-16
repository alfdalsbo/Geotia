import { describe, expect, it } from "vitest";

import { computeRound, computeStandings, computeWorstThreeAverage } from "@/lib/scoring";
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
