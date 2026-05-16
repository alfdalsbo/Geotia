import type {
  ComputedPlayerResult,
  ComputedRound,
  Player,
  PlayerResult,
  Round,
  Standing,
} from "@/lib/types";

const MAX_POINTS = 7;

export function roundNumber(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function computeWorstThreeAverage(results: PlayerResult[]) {
  const validKm = results
    .filter((result) => result.status === "deltatt" && typeof result.actualKm === "number")
    .map((result) => result.actualKm as number)
    .sort((a, b) => b - a);

  if (validKm.length < 3) {
    return null;
  }

  const worstThree = validKm.slice(0, 3);
  return roundNumber(worstThree.reduce((sum, km) => sum + km, 0) / worstThree.length, 1);
}

export function computeRound(round: Round, players: Player[]): ComputedRound {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const worstThreeAverage = computeWorstThreeAverage(round.results);
  const validResults = round.results.filter(
    (result) => result.status === "deltatt" && typeof result.actualKm === "number",
  );

  const computedResults: ComputedPlayerResult[] = round.results.map((result) => {
    const player = playerById.get(result.playerId);
    if (!player) {
      throw new Error(`Ukjent geot i protokollen: ${result.playerId}`);
    }

    if (result.status === "deltatt" && typeof result.actualKm === "number") {
      const rank =
        1 +
        validResults.filter((candidate) => {
          return typeof candidate.actualKm === "number" && candidate.actualKm < result.actualKm!;
        }).length;
      const points = Math.max(MAX_POINTS - rank + 1, 0);

      return {
        ...result,
        player,
        rank,
        points,
        chargedKm: result.actualKm,
        chargedReason: "actual",
      };
    }

    return {
      ...result,
      player,
      rank: null,
      points: 0,
      chargedKm: worstThreeAverage,
      chargedReason: worstThreeAverage === null ? "pending" : "kattometerstraff",
    };
  });

  const winnerNames = computedResults
    .filter((result) => result.points === MAX_POINTS)
    .map((result) => result.player.shortName);

  return {
    ...round,
    participantCount: validResults.length,
    worstThreeAverage,
    results: computedResults,
    winnerNames,
  };
}

export function canLockRound(round: Round) {
  const participantCount = round.results.filter(
    (result) => result.status === "deltatt" && typeof result.actualKm === "number",
  ).length;

  return participantCount >= 5 && computeWorstThreeAverage(round.results) !== null;
}

export function computeStandings(players: Player[], rounds: Round[]): Standing[] {
  const lockedRounds = rounds
    .filter((round) => round.status === "locked")
    .map((round) => computeRound(round, players));

  const rows = players.map((player) => {
    let totalPoints = 0;
    let totalKattometer = 0;
    let roundsPlayed = 0;
    let wins = 0;
    let top3 = 0;
    let lastPlaces = 0;
    let absences = 0;
    let invalids = 0;
    let bestKm: number | null = null;
    let worstKm: number | null = null;
    let bestSinglePoints = 0;

    for (const round of lockedRounds) {
      const result = round.results.find((candidate) => candidate.player.id === player.id);
      if (!result) {
        continue;
      }

      const maxRank = Math.max(
        ...round.results
          .filter((candidate) => candidate.status === "deltatt" && candidate.rank !== null)
          .map((candidate) => candidate.rank ?? 0),
      );

      totalPoints += result.points;
      totalKattometer += result.chargedKm ?? 0;
      bestSinglePoints = Math.max(bestSinglePoints, result.points);

      if (result.status === "deltatt") {
        roundsPlayed += 1;
        if (result.points === MAX_POINTS) wins += 1;
        if (result.points >= 5) top3 += 1;
        if (result.rank !== null && result.rank === maxRank) lastPlaces += 1;
        if (typeof result.actualKm === "number") {
          bestKm = bestKm === null ? result.actualKm : Math.min(bestKm, result.actualKm);
          worstKm = worstKm === null ? result.actualKm : Math.max(worstKm, result.actualKm);
        }
      } else if (result.status === "ikke_deltatt") {
        absences += 1;
      } else {
        invalids += 1;
      }
    }

    const lockedRoundCount = lockedRounds.length;

    return {
      rank: 0,
      player,
      totalPoints,
      totalKattometer: roundNumber(totalKattometer, 1),
      lockedRounds: lockedRoundCount,
      roundsPlayed,
      wins,
      top3,
      lastPlaces,
      absences,
      invalids,
      averagePoints: roundsPlayed > 0 ? roundNumber(totalPoints / roundsPlayed, 2) : 0,
      averageKattometer:
        lockedRoundCount > 0 ? roundNumber(totalKattometer / lockedRoundCount, 1) : 0,
      bestKm,
      worstKm,
      bestSinglePoints,
    };
  });

  rows.sort((a, b) => {
    return (
      b.totalPoints - a.totalPoints ||
      a.totalKattometer - b.totalKattometer ||
      b.wins - a.wins ||
      a.player.shortName.localeCompare(b.player.shortName, "nb")
    );
  });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function getHallOfFame(standings: Standing[], rounds: Round[], players: Player[]) {
  const computedRounds = rounds
    .filter((round) => round.status === "locked")
    .map((round) => computeRound(round, players));

  const allResults = computedRounds.flatMap((round) =>
    round.results.map((result) => ({ round, result })),
  );

  const bestSingle = allResults
    .filter(({ result }) => result.status === "deltatt" && typeof result.actualKm === "number")
    .sort((a, b) => (a.result.actualKm ?? Infinity) - (b.result.actualKm ?? Infinity))[0];

  const worstSingle = allResults
    .filter(({ result }) => result.status === "deltatt" && typeof result.actualKm === "number")
    .sort((a, b) => (b.result.actualKm ?? -Infinity) - (a.result.actualKm ?? -Infinity))[0];

  return {
    mostPoints: [...standings].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 3),
    lowestKattometer: [...standings]
      .filter((standing) => standing.lockedRounds > 0)
      .sort((a, b) => a.totalKattometer - b.totalKattometer)
      .slice(0, 3),
    mostWins: [...standings].sort((a, b) => b.wins - a.wins || b.totalPoints - a.totalPoints).slice(0, 3),
    mostTop3: [...standings].sort((a, b) => b.top3 - a.top3 || b.totalPoints - a.totalPoints).slice(0, 3),
    bestSingle,
    worstSingle,
  };
}

export function emptyResults(players: Player[]): PlayerResult[] {
  return players.map((player) => ({
    playerId: player.id,
    status: "ikke_deltatt",
    actualKm: null,
    note: "",
  }));
}
