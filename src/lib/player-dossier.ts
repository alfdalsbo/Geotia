import { computeRound, roundNumber } from "@/lib/scoring";
import type { ComputedPlayerResult, ComputedRound, Player, Round, Standing } from "@/lib/types";

export type PlayerDossierStat = {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "green" | "gold" | "red";
};

export type PlayerDossierMoment = {
  roundId: string;
  title: string;
  date: string;
  label: string;
  detail: string;
  tone: "blue" | "green" | "gold" | "red";
};

type RoundEntry = {
  round: ComputedRound;
  result: ComputedPlayerResult;
};

function aggregateBest(entries: RoundEntry[], keyFor: (round: ComputedRound) => string) {
  const groups = new Map<string, { key: string; count: number; km: number; points: number }>();
  for (const entry of entries) {
    if (entry.result.status !== "deltatt" || typeof entry.result.actualKm !== "number") continue;
    const key = keyFor(entry.round) || "Ukjent";
    const existing = groups.get(key) ?? { key, count: 0, km: 0, points: 0 };
    existing.count += 1;
    existing.km += entry.result.actualKm;
    existing.points += entry.result.points;
    groups.set(key, existing);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      averageKm: roundNumber(group.km / Math.max(group.count, 1), 1),
      averagePoints: roundNumber(group.points / Math.max(group.count, 1), 2),
    }))
    .sort((a, b) => a.averageKm - b.averageKm || b.averagePoints - a.averagePoints || b.count - a.count)[0] ?? null;
}

function momentFor(entry: RoundEntry): PlayerDossierMoment {
  const { result, round } = entry;
  if (result.status === "ikke_deltatt") {
    return {
      roundId: round.id,
      title: round.name,
      date: round.date,
      label: "Fravær",
      detail: "Kattometerstraff eller tom stol i protokollen.",
      tone: "red",
    };
  }
  if (result.status === "ugyldig") {
    return {
      roundId: round.id,
      title: round.name,
      date: round.date,
      label: "Ugyldig spor",
      detail: "GeoVAR-materiale, om noen orker å åpne saken.",
      tone: "red",
    };
  }
  if (result.rank === 1) {
    return {
      roundId: round.id,
      title: round.name,
      date: round.date,
      label: "Bragd",
      detail: `${roundNumber(result.actualKm ?? 0, 1)} km fra fasit og runden på kne.`,
      tone: "gold",
    };
  }
  if ((result.actualKm ?? 0) <= 75) {
    return {
      roundId: round.id,
      title: round.name,
      date: round.date,
      label: "Presisjon",
      detail: `${roundNumber(result.actualKm ?? 0, 1)} km. Stolpene hvisket riktig.`,
      tone: "green",
    };
  }
  if ((result.actualKm ?? 0) >= 5000) {
    return {
      roundId: round.id,
      title: round.name,
      date: round.date,
      label: "Fadese",
      detail: `${roundNumber(result.actualKm ?? 0, 1)} km. Kontinentet fikk dramatisk frihet.`,
      tone: "red",
    };
  }
  if (result.rank === round.participantCount) {
    return {
      roundId: round.id,
      title: round.name,
      date: round.date,
      label: "Sisteplass",
      detail: `${roundNumber(result.actualKm ?? 0, 1)} km og et lite vedlegg til selvbildet.`,
      tone: "red",
    };
  }
  return {
    roundId: round.id,
    title: round.name,
    date: round.date,
    label: "Spor",
    detail: `${roundNumber(result.actualKm ?? 0, 1)} km og ${result.points} poeng.`,
    tone: "blue",
  };
}

export function getPlayerDossier(player: Player, players: Player[], rounds: Round[], standing?: Standing) {
  const entries = rounds
    .filter((round) => round.status === "locked")
    .map((round) => computeRound(round, players))
    .map((round) => {
      const result = round.results.find((candidate) => candidate.player.id === player.id);
      return result ? { round, result } : null;
    })
    .filter((entry): entry is RoundEntry => entry !== null)
    .sort((a, b) => b.round.date.localeCompare(a.round.date) || b.round.number - a.round.number);

  const validEntries = entries.filter(
    (entry) => entry.result.status === "deltatt" && typeof entry.result.actualKm === "number",
  );
  const bestCountry = aggregateBest(validEntries, (round) => round.country);
  const bestContinent = aggregateBest(validEntries, (round) => round.continent);
  const averageMiss =
    validEntries.length > 0
      ? roundNumber(validEntries.reduce((sum, entry) => sum + (entry.result.actualKm ?? 0), 0) / validEntries.length, 1)
      : null;
  const winRate = standing?.roundsPlayed ? Math.round((standing.wins / standing.roundsPlayed) * 100) : 0;
  const absenceRate = standing?.lockedRounds ? Math.round((standing.absences / standing.lockedRounds) * 100) : 0;

  return {
    bestCountry,
    bestContinent,
    averageMiss,
    winRate,
    absenceRate,
    recentMoments: entries.slice(0, 5).map(momentFor),
    stats: [
      {
        label: "Beste land",
        value: bestCountry?.key ?? "-",
        detail: bestCountry ? `${bestCountry.averageKm} km snitt over ${bestCountry.count} runder` : "Venter på låste spor",
        tone: "green",
      },
      {
        label: "Beste kontinent",
        value: bestContinent?.key ?? "-",
        detail: bestContinent ? `${bestContinent.averageKm} km snitt` : "Ikke nok protokoll",
        tone: "blue",
      },
      {
        label: "Snittbom",
        value: averageMiss === null ? "-" : `${averageMiss} km`,
        detail: `${standing?.roundsPlayed ?? 0} deltakelser`,
        tone: "gold",
      },
      {
        label: "Seiersrate",
        value: `${winRate}%`,
        detail: `${standing?.wins ?? 0} seire`,
        tone: "red",
      },
      {
        label: "Fravær",
        value: `${absenceRate}%`,
        detail: `${standing?.absences ?? 0} fravær i låste runder`,
        tone: "blue",
      },
    ] satisfies PlayerDossierStat[],
  };
}
