import { buildRoundMapSnapshot, haversineKm } from "@/lib/geo";
import type { Player, Round } from "@/lib/types";

export function isSlowGeoRound(round: Round) {
  return round.challenge?.source === "google_street_view";
}

export function isSlowGeoOpenRound(round: Round) {
  return isSlowGeoRound(round) && round.status === "open";
}

export function isRoundPastDeadline(round: Round, now = new Date()) {
  if (!round.deadlineAt) return false;
  const deadline = new Date(round.deadlineAt).getTime();
  return Number.isFinite(deadline) && now.getTime() >= deadline;
}

export function allPlayersHaveSlowGeoGuesses(round: Round, players: Player[]) {
  const competingPlayerIds = players.filter((player) => player.canCompete !== false).map((player) => player.id);
  return competingPlayerIds.every((playerId) => {
    const result = round.results.find((candidate) => candidate.playerId === playerId);
    return Boolean(result?.guessLocation);
  });
}

export function shouldRevealSlowGeoRound(round: Round, players: Player[], now = new Date()) {
  return isSlowGeoOpenRound(round) && (isRoundPastDeadline(round, now) || allPlayersHaveSlowGeoGuesses(round, players));
}

export function finalizeSlowGeoRound(round: Round, players: Player[], revealedAt = new Date().toISOString()): Round {
  if (!isSlowGeoRound(round) || !round.answerLocation) return round;

  const results = round.results.map((result) => {
    if (!result.guessLocation) {
      return {
        ...result,
        status: "ikke_deltatt" as const,
        actualKm: null,
        distanceSource: null,
      };
    }

    return {
      ...result,
      status: "deltatt" as const,
      actualKm: haversineKm(round.answerLocation!, result.guessLocation),
      distanceSource: "auto" as const,
      guessText: result.guessText || result.guessLocation.label,
    };
  });

  return {
    ...round,
    status: "revealed",
    revealedAt: round.revealedAt ?? revealedAt,
    updatedAt: revealedAt,
    results,
    mapSnapshot: buildRoundMapSnapshot({
      answerLocation: round.answerLocation,
      players,
      results,
    }),
  };
}
