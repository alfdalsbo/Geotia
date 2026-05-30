import { describe, expect, it } from "vitest";

import {
  allPlayersHaveSlowGeoGuesses,
  computeStandingsForEra,
  countSlowGeoGuesses,
  filterSlowGeoRoundsForEra,
  finalizeSlowGeoRound,
  getSlowGeoEraId,
  hasMinimumSlowGeoRevealGuesses,
  isRoundPastDeadline,
  MIN_SLOWGEO_REVEAL_GUESSES,
  shouldRevealSlowGeoRound,
} from "@/lib/slowgeo";
import { competingPlayers, players } from "@/lib/seed";
import { emptyResults } from "@/lib/scoring";
import type { GeoLocation, Round, SlowGeoChallenge } from "@/lib/types";

const answerLocation: GeoLocation = {
  lat: 48.2082,
  lon: 16.3738,
  label: "Wien",
  query: "wien",
  country: "Østerrike",
  source: "google_street_view",
};

const challenge: SlowGeoChallenge = {
  id: "challenge-1",
  candidateId: "wien-test",
  source: "google_street_view",
  lat: answerLocation.lat,
  lon: answerLocation.lon,
  label: answerLocation.label,
  country: "Østerrike",
  continent: "Europa",
  heading: 90,
  pitch: 0,
  fov: 90,
  panoId: "pano",
  createdAt: "2026-05-16T10:00:00.000Z",
};

function openRound(overrides: Partial<Round> = {}): Round {
  return {
    id: "round-1",
    number: 1,
    date: "2026-05-16",
    name: "SlowGeo-test",
    answer: "Wien",
    answerLocation,
    mapSnapshot: null,
    challenge,
    deadlineAt: "2026-05-16T12:00:00.000Z",
    revealedAt: null,
    country: "Østerrike",
    continent: "Europa",
    comment: "",
    status: "open",
    createdAt: "2026-05-16T10:00:00.000Z",
    updatedAt: "2026-05-16T10:00:00.000Z",
    results: emptyResults(competingPlayers),
    ...overrides,
  };
}

describe("SlowGeo reveal rules", () => {
  function resultWithGuess(index: number) {
    return {
      guessText: `Pin ${index}`,
      guessLocation: {
        lat: answerLocation.lat + index * 0.01,
        lon: answerLocation.lon,
        label: `Pin ${index}`,
        query: "pin",
        source: "manual" as const,
      },
    };
  }

  it("requires four pin answers before a deadline can reveal the round", () => {
    const round = openRound();
    const threeAnswerRound = openRound({
      results: emptyResults(competingPlayers).map((result, index) =>
        index < MIN_SLOWGEO_REVEAL_GUESSES - 1 ? { ...result, ...resultWithGuess(index) } : result,
      ),
    });
    const fourAnswerRound = openRound({
      results: emptyResults(competingPlayers).map((result, index) =>
        index < MIN_SLOWGEO_REVEAL_GUESSES ? { ...result, ...resultWithGuess(index) } : result,
      ),
    });

    expect(isRoundPastDeadline(round, new Date("2026-05-16T11:59:00.000Z"))).toBe(false);
    expect(isRoundPastDeadline(round, new Date("2026-05-16T12:00:00.000Z"))).toBe(true);
    expect(allPlayersHaveSlowGeoGuesses(round, players)).toBe(false);
    expect(countSlowGeoGuesses(threeAnswerRound)).toBe(3);
    expect(hasMinimumSlowGeoRevealGuesses(threeAnswerRound)).toBe(false);
    expect(shouldRevealSlowGeoRound(threeAnswerRound, players, new Date("2026-05-16T12:01:00.000Z"))).toBe(false);
    expect(hasMinimumSlowGeoRevealGuesses(fourAnswerRound)).toBe(true);
    expect(shouldRevealSlowGeoRound(fourAnswerRound, players, new Date("2026-05-16T12:01:00.000Z"))).toBe(true);
  });

  it("reveals immediately when every competing geot has pinned", () => {
    const results = emptyResults(competingPlayers).map((result, index) => ({
      ...result,
      ...resultWithGuess(index),
    }));
    const round = openRound({ results });

    expect(allPlayersHaveSlowGeoGuesses(round, players)).toBe(true);
    expect(shouldRevealSlowGeoRound(round, players, new Date("2026-05-16T10:30:00.000Z"))).toBe(true);
  });

  it("computes automatic km and keeps missing players out until kattometer scoring", () => {
    const round = openRound({
      results: emptyResults(competingPlayers).map((result) =>
        result.playerId === "alf"
          ? {
              ...result,
              guessText: "Budapest",
              guessLocation: {
                lat: 47.4979,
                lon: 19.0402,
                label: "Budapest",
                query: "pin",
                source: "manual",
              },
            }
          : result,
      ),
    });

    const revealed = finalizeSlowGeoRound(round, players, "2026-05-16T12:00:00.000Z");
    const alf = revealed.results.find((result) => result.playerId === "alf");
    const vegard = revealed.results.find((result) => result.playerId === "vegard");

    expect(revealed.status).toBe("locked");
    expect(revealed.revealedAt).toBe("2026-05-16T12:00:00.000Z");
    expect(alf).toMatchObject({ status: "deltatt", actualKm: 214, distanceSource: "auto" });
    expect(vegard).toMatchObject({ status: "ikke_deltatt", actualKm: null, distanceSource: null });
    expect(revealed.mapSnapshot?.markers.map((marker) => marker.id)).toEqual(["answer", "guess-alf"]);
    expect(shouldRevealSlowGeoRound(revealed, players, new Date("2026-05-16T12:05:00.000Z"))).toBe(false);
  });

  it("leaves old non-challenge rounds untouched", () => {
    const legacy = openRound({ challenge: null, status: "draft" });
    expect(finalizeSlowGeoRound(legacy, players)).toBe(legacy);
    expect(shouldRevealSlowGeoRound(legacy, players, new Date("2026-05-16T12:01:00.000Z"))).toBe(false);
  });

  it("defaults legacy SlowGeo rounds into the test era and filters era standings", () => {
    const legacyEraRound = finalizeSlowGeoRound(
      openRound({
        id: "legacy-era",
        results: emptyResults(competingPlayers).map((result) =>
          result.playerId === "alf"
            ? {
                ...result,
                guessLocation: {
                  lat: answerLocation.lat,
                  lon: answerLocation.lon,
                  label: "Blink",
                  query: "pin",
                  source: "manual",
                },
              }
            : result,
        ),
      }),
      players,
      "2026-05-16T12:00:00.000Z",
    );
    const futureEraRound = finalizeSlowGeoRound(
      openRound({
        id: "future-era",
        slowGeoEraId: "neste-aera",
        results: emptyResults(competingPlayers).map((result) =>
          result.playerId === "vegard"
            ? {
                ...result,
                guessLocation: {
                  lat: answerLocation.lat,
                  lon: answerLocation.lon,
                  label: "Blink 2",
                  query: "pin",
                  source: "manual",
                },
              }
            : result,
        ),
      }),
      players,
      "2026-05-16T12:00:00.000Z",
    );

    expect(getSlowGeoEraId(legacyEraRound)).toBe("proveaeraen");
    expect(filterSlowGeoRoundsForEra([legacyEraRound, futureEraRound], "proveaeraen").map((round) => round.id)).toEqual([
      "legacy-era",
    ]);
    expect(computeStandingsForEra(players, [legacyEraRound, futureEraRound], "proveaeraen")[0].player.id).toBe("alf");
  });
});
