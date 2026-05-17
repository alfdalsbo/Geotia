import { describe, expect, it } from "vitest";

import { computeRound, emptyResults } from "@/lib/scoring";
import { getSlowGeoRoundInsights } from "@/lib/slowgeo-insights";
import { competingPlayers, players } from "@/lib/seed";
import type { Round } from "@/lib/types";

function revealedRound(): Round {
  return {
    id: "round-1",
    number: 1,
    date: "2026-05-16",
    name: "Innsiktsprøven",
    answer: "Sarajevo",
    answerLocation: {
      lat: 43.8594,
      lon: 18.4312,
      label: "Sarajevo",
      query: "sarajevo",
      country: "Bosnia-Hercegovina",
      source: "google_street_view",
    },
    mapSnapshot: null,
    challenge: {
      id: "challenge-1",
      candidateId: "sarajevo-bascarsija",
      source: "google_street_view",
      lat: 43.8594,
      lon: 18.4312,
      label: "Baščaršija, Sarajevo",
      country: "Bosnia-Hercegovina",
      continent: "Europa",
      heading: 88,
      pitch: 2,
      fov: 92,
      difficulty: "middels",
      theme: "Balkan og kulehull-lære",
      signature: "Sarajevodagen lurer alltid i murpussen.",
      tags: ["sarajevo", "europa", "by"],
      createdAt: "2026-05-16T10:00:00.000Z",
    },
    deadlineAt: "2026-05-16T12:00:00.000Z",
    revealedAt: "2026-05-16T12:00:00.000Z",
    country: "Bosnia-Hercegovina",
    continent: "Europa",
    comment: "",
    status: "revealed",
    createdAt: "2026-05-16T10:00:00.000Z",
    updatedAt: "2026-05-16T12:00:00.000Z",
    results: emptyResults(competingPlayers).map((result) => {
      if (result.playerId === "alf") {
        return {
          ...result,
          status: "deltatt",
          actualKm: 0.4,
          guessLocation: { lat: 43.86, lon: 18.43, label: "Pin Alf", query: "pin", source: "manual" },
          note: "Kulehull og sta selvtillit.",
        };
      }
      if (result.playerId === "vegard") {
        return {
          ...result,
          status: "deltatt",
          actualKm: 8,
          guessLocation: { lat: 43.88, lon: 18.45, label: "Pin Vegard", query: "pin", source: "manual" },
        };
      }
      if (result.playerId === "jorgen") {
        return {
          ...result,
          status: "deltatt",
          actualKm: 3600,
          guessLocation: { lat: 12, lon: 77, label: "Pin Jørgen", query: "pin", source: "manual" },
        };
      }
      if (result.playerId === "steinar") {
        return {
          ...result,
          status: "deltatt",
          actualKm: 2500,
          guessLocation: { lat: 20, lon: 20, label: "Pin Steinar", query: "pin", source: "manual" },
        };
      }
      if (result.playerId === "sverre") {
        return {
          ...result,
          status: "deltatt",
          actualKm: 1900,
          guessLocation: { lat: 35, lon: 10, label: "Pin Sverre", query: "pin", source: "manual" },
        };
      }
      return result;
    }),
  };
}

describe("SlowGeo insights", () => {
  it("finds ceremonial tags, notes and missing players", () => {
    const computed = computeRound(revealedRound(), players);
    const insights = getSlowGeoRoundInsights(computed);

    expect(insights.submittedCount).toBe(5);
    expect(insights.missingCount).toBeGreaterThan(0);
    expect(insights.bestResult?.player.shortName).toBe("Alf Kåre");
    expect(insights.notes[0]).toMatchObject({ playerName: "Alf Kåre" });
    expect(insights.insightCards.map((insight) => insight.id)).toEqual(
      expect.arrayContaining(["perfect-pin", "india-risk", "collective-collapse", "deserter-pressure", "canon-hook"]),
    );
  });
});
