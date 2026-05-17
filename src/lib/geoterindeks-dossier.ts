import type { getGeoterIndexRows } from "@/lib/geoterindeks";

type GeoterIndexRow = ReturnType<typeof getGeoterIndexRows>[number];

export type GeoterIndexDossierItem = {
  playerId: string;
  playerName: string;
  title: string;
  detail: string;
  action: string;
  tone: "blue" | "green" | "gold" | "red";
};

export function getGeoterIndexDossier(rows: GeoterIndexRow[]) {
  const riskRows = rows.filter((row) => row.score < 650);
  const fallingRows = rows.filter((row) => (row.lastAdjustment?.delta ?? 0) <= -20);
  const risingRows = rows.filter((row) => (row.lastAdjustment?.delta ?? 0) >= 20);
  const unobservedRows = rows.filter((row) => row.adjustments.length === 0);
  const volatileRows = [...rows]
    .map((row) => ({
      row,
      weight: row.adjustments.reduce((sum, adjustment) => sum + Math.abs(adjustment.delta), 0),
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  const items: GeoterIndexDossierItem[] = [
    ...riskRows.map((row) => ({
      playerId: row.player.id,
      playerName: row.player.shortName,
      title: row.tier.name,
      detail: `${row.score} poeng. ${row.tier.consequence}`,
      action: "Vurder prøvetid, frys eller sosial reparasjon før neste store runde.",
      tone: "red" as const,
    })),
    ...fallingRows.map((row) => ({
      playerId: row.player.id,
      playerName: row.player.shortName,
      title: "Nylig fall",
      detail: `${row.lastAdjustment?.delta} for ${row.lastAdjustment?.title}.`,
      action: "Se etter mønster før Kollegiet lar dette bli karakter.",
      tone: "gold" as const,
    })),
    ...risingRows.map((row) => ({
      playerId: row.player.id,
      playerName: row.player.shortName,
      title: "Positivt trykk",
      detail: `Siste føring: +${row.lastAdjustment?.delta} for ${row.lastAdjustment?.title}.`,
      action: "Kan brukes som sponsor, hintbærer eller sosial motor.",
      tone: "green" as const,
    })),
    ...unobservedRows.map((row) => ({
      playerId: row.player.id,
      playerName: row.player.shortName,
      title: "Uobservert",
      detail: "Ingen indeksføring. Det kan være uskyldig, men Tredje Kollegium liker ikke tomrom.",
      action: "Før første konkrete observasjon etter neste runde.",
      tone: "blue" as const,
    })),
  ];

  const uniqueItems = [...new Map(items.map((item) => [`${item.playerId}-${item.title}`, item])).values()].slice(0, 8);

  return {
    summary: {
      risk: riskRows.length,
      falling: fallingRows.length,
      rising: risingRows.length,
      unobserved: unobservedRows.length,
    },
    volatile: volatileRows.map(({ row, weight }) => ({
      playerId: row.player.id,
      playerName: row.player.shortName,
      weight,
      detail: weight > 0 ? `${weight} poeng i samlet svingning` : "Står stille på grunnscore",
    })),
    items: uniqueItems,
  };
}
