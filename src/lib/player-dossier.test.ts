import { describe, expect, it } from "vitest";

import { getPlayerDossier } from "@/lib/player-dossier";
import { computeStandings } from "@/lib/scoring";
import { players } from "@/lib/seed";
import type { Round } from "@/lib/types";

const baseRound = {
  answer: "Oslo",
  answerLocation: null,
  mapSnapshot: null,
  challenge: null,
  deadlineAt: null,
  revealedAt: null,
  comment: "",
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
  status: "locked",
} satisfies Partial<Round>;

describe("player dossier", () => {
  it("summarizes a player's best geography and latest moments", () => {
    const rounds: Round[] = [
      {
        ...baseRound,
        id: "r1",
        number: 1,
        date: "2026-01-01",
        name: "Oslo-testen",
        country: "Norge",
        continent: "Europa",
        results: players.slice(0, 5).map((player, index) => ({
          playerId: player.id,
          status: "deltatt",
          actualKm: player.id === "alf" ? 12 : 100 + index,
        })),
      },
      {
        ...baseRound,
        id: "r2",
        number: 2,
        date: "2026-01-02",
        name: "Kontinentfallet",
        country: "Chile",
        continent: "Sør-Amerika",
        results: players.slice(0, 5).map((player, index) => ({
          playerId: player.id,
          status: "deltatt",
          actualKm: player.id === "alf" ? 6200 : 100 + index,
        })),
      },
    ];
    const standings = computeStandings(players, rounds);
    const player = players.find((candidate) => candidate.id === "alf")!;
    const dossier = getPlayerDossier(player, players, rounds, standings.find((row) => row.player.id === player.id));

    expect(dossier.bestCountry?.key).toBe("Norge");
    expect(dossier.averageMiss).toBe(3106);
    expect(dossier.recentMoments[0]).toMatchObject({ label: "Fadese" });
    expect(dossier.recentMoments[1]).toMatchObject({ label: "Bragd" });
  });
});
