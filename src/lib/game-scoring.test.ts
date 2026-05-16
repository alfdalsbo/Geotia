import { describe, expect, it } from "vitest";

import { summarizeProposal } from "@/lib/geoting";
import { computeGameStandings } from "@/lib/scoring";
import { games, players } from "@/lib/seed";
import type { GameSession, GeotingProposal } from "@/lib/types";

function session(gameId: GameSession["gameId"], scores: Record<string, number>): GameSession {
  return {
    id: `${gameId}-test`,
    gameId,
    number: 1,
    date: "2026-05-16",
    title: "Testting",
    context: "",
    status: "locked",
    createdAt: "2026-05-16T10:00:00.000Z",
    updatedAt: "2026-05-16T10:00:00.000Z",
    results: players.map((player) => ({
      playerId: player.id,
      status: scores[player.id] === undefined ? "ikke_deltatt" : "deltatt",
      score: scores[player.id] ?? null,
      note: "",
    })),
  };
}

describe("multi-game scoring", () => {
  it("ranks Geo by highest score", () => {
    const game = games.find((candidate) => candidate.id === "geo")!;
    const standings = computeGameStandings(players, [session("geo", { alf: 1000, vegard: 900 })], game);

    expect(standings[0].player.id).toBe("alf");
    expect(standings[0].totalPoints).toBe(7);
    expect(standings.find((standing) => standing.player.id === "vegard")?.totalPoints).toBe(6);
  });

  it("ranks Globle by fewest attempts", () => {
    const game = games.find((candidate) => candidate.id === "globle")!;
    const standings = computeGameStandings(players, [session("globle", { alf: 5, vegard: 3 })], game);

    expect(standings[0].player.id).toBe("vegard");
    expect(standings[0].totalPoints).toBe(7);
  });
});

describe("GeoTinget", () => {
  it("requires consensus for constitutional changes", () => {
    const proposal: GeotingProposal = {
      id: "gt-test",
      title: "Grunnlovsprøve",
      body: "Alt skal være gyldig.",
      ruleType: "grunnlov",
      proposedBy: "alf",
      status: "open",
      createdAt: "2026-05-16T10:00:00.000Z",
      updatedAt: "2026-05-16T10:00:00.000Z",
      votes: players.slice(0, 6).map((player) => ({
        playerId: player.id,
        vote: "for",
        comment: "",
        createdAt: "2026-05-16T10:00:00.000Z",
      })),
    };

    expect(summarizeProposal(proposal, players).passed).toBe(false);
    proposal.votes.push({
      playerId: players[6].id,
      vote: "for",
      comment: "",
      createdAt: "2026-05-16T10:00:00.000Z",
    });
    expect(summarizeProposal(proposal, players).passed).toBe(true);
  });
});
