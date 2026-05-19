import { haversineKm } from "@/lib/geo";
import type { ComputedRound, RoundMapMarker, ResultStatus } from "@/lib/types";

export type SlowGeoRevealMarker = RoundMapMarker;

export type SlowGeoRevealResult = {
  playerId: string;
  playerName: string;
  playerShortName: string;
  playerColor: string;
  status: ResultStatus;
  statusLabel: string;
  actualKm: number | null;
  chargedKm: number | null;
  chargedReason: "actual" | "kattometerstraff" | "pending";
  points: number;
  rank: number | null;
  isWinner: boolean;
  guessLabel: string | null;
  note: string | null;
};

function resultStatusLabel(status: ResultStatus, hasGuess: boolean) {
  if (status === "deltatt") return "Deltatt";
  if (status === "ugyldig") return "Ugyldig";
  return hasGuess ? "Levert" : "Ikke levert";
}

export function buildSlowGeoRevealMarkers(round: ComputedRound): SlowGeoRevealMarker[] {
  const storedMarkers = round.mapSnapshot?.markers ?? [];
  if (storedMarkers.length > 0) return storedMarkers;

  const answerLocation = round.answerLocation ?? null;
  const challenge = round.challenge ?? null;
  const answer =
    answerLocation ??
    (challenge
      ? {
          lat: challenge.lat,
          lon: challenge.lon,
          label: round.answer || challenge.label,
        }
      : null);

  if (!answer) return [];

  return [
    {
      id: "answer",
      type: "answer",
      label: answer.label,
      lat: answer.lat,
      lon: answer.lon,
      color: "#7c2430",
      distanceKm: 0,
    },
    ...round.results
      .filter((result) => result.guessLocation)
      .map((result) => {
        const location = result.guessLocation!;
        return {
          id: `guess-${result.playerId}`,
          type: "guess" as const,
          playerId: result.playerId,
          label: `${result.player.shortName}: ${location.label}`,
          lat: location.lat,
          lon: location.lon,
          color: result.player.color,
          distanceKm:
            typeof result.actualKm === "number"
              ? result.actualKm
              : answerLocation
                ? haversineKm(answerLocation, location)
                : null,
        };
      }),
  ];
}

export function buildSlowGeoRevealResults(round: ComputedRound): SlowGeoRevealResult[] {
  return [...round.results]
    .sort((a, b) => {
      const rankA = a.rank ?? Number.POSITIVE_INFINITY;
      const rankB = b.rank ?? Number.POSITIVE_INFINITY;
      return rankA - rankB || b.points - a.points || a.player.shortName.localeCompare(b.player.shortName, "nb");
    })
    .map((result) => ({
      playerId: result.playerId,
      playerName: result.player.name,
      playerShortName: result.player.shortName,
      playerColor: result.player.color,
      status: result.status,
      statusLabel: resultStatusLabel(result.status, Boolean(result.guessLocation)),
      actualKm: result.actualKm,
      chargedKm: result.chargedKm,
      chargedReason: result.chargedReason,
      points: result.points,
      rank: result.rank,
      isWinner: round.maxPoints > 0 && result.points === round.maxPoints,
      guessLabel: result.guessText || result.guessLocation?.label || null,
      note: result.note?.trim() || null,
    }));
}
