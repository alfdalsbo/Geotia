import type { GeoterIndexAdjustment, Player, Round, Standing } from "@/lib/types";

export type GeotiaBadgeTone = "blue" | "green" | "gold" | "red";

export type GeotiaBadge = {
  id: string;
  title: string;
  description: string;
  detail: string;
  tone: GeotiaBadgeTone;
  earned: boolean;
};

export function getPlayerBadges({
  adjustments,
  player,
  rounds,
  standing,
}: {
  adjustments: GeoterIndexAdjustment[];
  player: Player;
  rounds: Round[];
  standing?: Standing;
}) {
  const playerAdjustments = adjustments.filter((adjustment) => adjustment.playerId === player.id);
  const lockedRounds = rounds.filter((round) => round.status === "locked");
  const playerResults = lockedRounds
    .map((round) => round.results.find((result) => result.playerId === player.id))
    .filter(Boolean);
  const validDistances = playerResults
    .filter((result) => result?.status === "deltatt" && typeof result.actualKm === "number")
    .map((result) => result?.actualKm ?? 0);
  const bestKm = standing?.bestKm ?? (validDistances.length ? Math.min(...validDistances) : null);
  const worstKm = standing?.worstKm ?? (validDistances.length ? Math.max(...validDistances) : null);
  const hasAdjustment = (category: GeoterIndexAdjustment["category"], text?: string) =>
    playerAdjustments.some((adjustment) => {
      const haystack = `${adjustment.title} ${adjustment.reason}`.toLowerCase();
      return adjustment.category === category && (!text || haystack.includes(text.toLowerCase()));
    });

  return [
    {
      id: "embetsbygger",
      title: "Embetsbygger",
      description: "Bygger struktur, ritualer eller språk som gjør riket lettere å holde i live.",
      detail: hasAdjustment("initiativ") ? "Ført i Geoterindeksen." : player.title,
      tone: "blue",
      earned: hasAdjustment("initiativ") || /institusjon|bygger|arkiv|struktur/i.test(`${player.title} ${player.specialty}`),
    },
    {
      id: "flokkredder",
      title: "Flokkredder",
      description: "Får andre med, deler hint eller gjør en runde mer levende enn den ellers ville vært.",
      detail: hasAdjustment("fellesskap") ? "Har fellesskapsføring." : `${standing?.top3 ?? 0} topp 3-plasseringer.`,
      tone: "green",
      earned: hasAdjustment("fellesskap") || (standing?.top3 ?? 0) >= 3,
    },
    {
      id: "stolpeobservator",
      title: "Stolpeobservatør",
      description: "Ser konkrete spor og ender mistenkelig nær fasit.",
      detail: bestKm === null ? "Venter på låste spor." : `${Math.round(bestKm)} km beste treff.`,
      tone: "gold",
      earned: bestKm !== null && bestKm <= 75,
    },
    {
      id: "india-redder",
      title: "India-redder",
      description: "Beskytter flokken mot store kontinentale selvbedrag.",
      detail: hasAdjustment("anti_sabotasje", "india") ? "India-føring registrert." : "Aktiveres ved anti-sabotasje.",
      tone: "red",
      earned: hasAdjustment("anti_sabotasje", "india"),
    },
    {
      id: "kartlig-ustabil",
      title: "Kartlig ustabil",
      description: "Har nok store utslag til at riket følger ekstra nøye med.",
      detail: worstKm === null ? "Ingen registrert kollaps." : `${Math.round(worstKm)} km verste utslag.`,
      tone: "red",
      earned: (standing?.lastPlaces ?? 0) >= 3 || (worstKm ?? 0) >= 5000,
    },
    {
      id: "tingkraft",
      title: "Tingkraft",
      description: "Har partifarge, stemmerett og evne til å skade staten formelt.",
      detail: player.partyId ? player.partyId.toUpperCase() : "Tingvitne",
      tone: "blue",
      earned: player.canVote !== false && Boolean(player.partyId),
    },
  ] satisfies GeotiaBadge[];
}

export function getEarnedPlayerBadges(input: Parameters<typeof getPlayerBadges>[0]) {
  return getPlayerBadges(input).filter((badge) => badge.earned);
}
