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
    expect(standings[0].totalPoints).toBe(2);
    expect(standings.find((standing) => standing.player.id === "vegard")?.totalPoints).toBe(1);
  });

  it("ranks Globle by fewest attempts", () => {
    const game = games.find((candidate) => candidate.id === "globle")!;
    const standings = computeGameStandings(players, [session("globle", { alf: 5, vegard: 3 })], game);

    expect(standings[0].player.id).toBe("vegard");
    expect(standings[0].totalPoints).toBe(2);
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
      voteStartedAt: "2026-05-16T10:00:00.000Z",
      voteEndsAt: "2026-05-17T10:00:00.000Z",
      voteStartedBy: "alf",
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

  it("keeps Tingvitnet outside the voting count until a party exists", () => {
    const proposal: GeotingProposal = {
      id: "gt-tingvitne",
      title: "Tingvitneprøve",
      body: "Danny skal se uten å telle.",
      ruleType: "grunnlov",
      proposedBy: "danny",
      status: "open",
      createdAt: "2026-05-16T10:00:00.000Z",
      updatedAt: "2026-05-16T10:00:00.000Z",
      voteStartedAt: "2026-05-16T10:00:00.000Z",
      voteEndsAt: "2026-05-17T10:00:00.000Z",
      voteStartedBy: "alf",
      votes: players.map((player) => ({
        playerId: player.id,
        vote: player.id === "danny" ? "mot" : "for",
        comment: "",
        createdAt: "2026-05-16T10:00:00.000Z",
      })),
    };

    const summary = summarizeProposal(proposal, players);

    expect(summary.required).toBe(7);
    expect(summary.forVotes).toBe(7);
    expect(summary.againstVotes).toBe(0);
    expect(summary.passed).toBe(true);
  });

  it("turns missing votes blank after the 24 hour tingfrist", () => {
    const proposal: GeotingProposal = {
      id: "gt-frist",
      title: "Tingfristprøve",
      body: "Taushet skal bli blankt.",
      ruleType: "mindre",
      proposedBy: "alf",
      status: "voting",
      createdAt: "2026-05-16T10:00:00.000Z",
      updatedAt: "2026-05-16T10:00:00.000Z",
      voteStartedAt: "2026-05-16T10:00:00.000Z",
      voteEndsAt: "2026-05-17T10:00:00.000Z",
      voteStartedBy: "alf",
      votes: [
        {
          playerId: "alf",
          vote: "for",
          comment: "",
          createdAt: "2026-05-16T10:05:00.000Z",
        },
      ],
    };

    const summary = summarizeProposal(proposal, players, new Date("2026-05-17T10:01:00.000Z"));

    expect(summary.finished).toBe(true);
    expect(summary.forVotes).toBe(1);
    expect(summary.blankVotes).toBe(6);
    expect(summary.automaticBlankPlayers).toHaveLength(6);
    expect(summary.passed).toBe(false);
  });
});
