import type { ComputedPlayerResult, ComputedRound, Round } from "@/lib/types";

export type SlowGeoInsightTone = "green" | "blue" | "gold" | "red";

export type SlowGeoInsight = {
  id: string;
  title: string;
  body: string;
  tone: SlowGeoInsightTone;
};

export type SlowGeoRoundInsights = {
  submittedCount: number;
  totalCount: number;
  missingCount: number;
  missingPlayerNames: string[];
  bestResult: ComputedPlayerResult | null;
  secondBestResult: ComputedPlayerResult | null;
  worstResult: ComputedPlayerResult | null;
  notes: Array<{
    playerName: string;
    playerColor: string;
    note: string;
  }>;
  insightCards: SlowGeoInsight[];
};

export const slowGeoDifficultyLabels = {
  lett: "Lett",
  middels: "Middels",
  hard: "Hard",
  absurd: "Absurd",
} as const;

export function getSlowGeoProgress(round: Pick<Round, "results">) {
  const submittedCount = round.results.filter((result) => Boolean(result.guessLocation)).length;
  return {
    submittedCount,
    totalCount: round.results.length,
    missingCount: Math.max(round.results.length - submittedCount, 0),
  };
}

function resultKm(result: ComputedPlayerResult) {
  return typeof result.actualKm === "number" ? result.actualKm : null;
}

function noteLooksLikeGeoVar(note: string) {
  return /geovar|geo-var|manuell|overstyr|kontroll/i.test(note);
}

function kmText(value: number, digits = 0) {
  return `${new Intl.NumberFormat("nb-NO", { maximumFractionDigits: digits }).format(value)} km`;
}

function uniqueInsights(insights: SlowGeoInsight[]) {
  const seen = new Set<string>();
  return insights.filter((insight) => {
    if (seen.has(insight.id)) return false;
    seen.add(insight.id);
    return true;
  });
}

export function getSlowGeoRoundInsights(round: ComputedRound): SlowGeoRoundInsights {
  const progress = getSlowGeoProgress(round);
  const validResults = round.results
    .filter((result) => result.status === "deltatt" && resultKm(result) !== null)
    .sort((a, b) => (a.actualKm ?? Infinity) - (b.actualKm ?? Infinity));
  const bestResult = validResults[0] ?? null;
  const secondBestResult = validResults[1] ?? null;
  const worstResult = validResults.at(-1) ?? null;
  const missingPlayerNames = round.results
    .filter((result) => !result.guessLocation && result.status !== "deltatt")
    .map((result) => result.player.shortName);
  const notes = round.results
    .filter((result) => result.note?.trim())
    .map((result) => ({
      playerName: result.player.shortName,
      playerColor: result.player.color,
      note: result.note!.trim(),
    }));

  const insights: SlowGeoInsight[] = [];
  const bestKm = bestResult?.actualKm ?? null;
  const secondBestKm = secondBestResult?.actualKm ?? null;
  const worstKm = worstResult?.actualKm ?? null;

  if (typeof bestKm === "number" && bestKm <= 1) {
    insights.push({
      id: "perfect-pin",
      title: "Nålestikk mot fasit",
      body: `${bestResult.player.shortName} var innenfor 1 km. Dette er presisjon som bør arkiveres med vokssegl.`,
      tone: "green",
    });
  } else if (typeof bestKm === "number" && bestKm <= 25) {
    insights.push({
      id: "sarajevo-candidate",
      title: "Sarajevo-kandidat",
      body: `${bestResult?.player.shortName} gikk høyt nok inn til at selvtilliten nesten blir et bevismiddel.`,
      tone: "green",
    });
  }

  if (typeof bestKm === "number" && typeof secondBestKm === "number" && secondBestKm - bestKm <= 15) {
    const gap = secondBestKm - bestKm;
    insights.push({
      id: "tight-round",
      title: "Tett dom",
      body: `Bare ${kmText(gap, 1)} skilte første og andre geot. GeoTinget kan puste rolig, men ikke dypt.`,
      tone: "blue",
    });
  }

  if (typeof worstKm === "number" && worstKm >= 2500) {
    insights.push({
      id: "india-risk",
      title: "India-alarm",
      body: `${worstResult?.player.shortName} var ${kmText(worstKm)} ute. Her burde flokken ha holdt hardere i kartet.`,
      tone: "red",
    });
  }

  if (typeof round.worstThreeAverage === "number" && round.worstThreeAverage >= 1500) {
    insights.push({
      id: "collective-collapse",
      title: "Kollektivt ras",
      body: `Kattometerstraffen landet på ${kmText(round.worstThreeAverage)}. Runden var ikke bare vanskelig, den var statsbærende vond.`,
      tone: "red",
    });
  }

  if (progress.missingCount > 0 && typeof round.worstThreeAverage === "number") {
    insights.push({
      id: "deserter-pressure",
      title: "Desertering koster",
      body: `${progress.missingCount} manglet pin og får kjenne snittet av de tre verste. Kattometeret glemmer ikke.`,
      tone: "gold",
    });
  }

  if (
    round.results.some((result) => result.distanceSource === "manual" || noteLooksLikeGeoVar(result.note ?? ""))
  ) {
    insights.push({
      id: "geo-var-material",
      title: "GeoVAR-materiale",
      body: "Runden har manuell avstand eller kontrollspråk i begrunnelsene. Den er egnet for etterprøving.",
      tone: "gold",
    });
  }

  if (round.challenge?.tags?.some((tag) => ["sarajevo", "hoyde", "baltikum", "peru"].includes(tag))) {
    insights.push({
      id: "canon-hook",
      title: "Kanonisk terreng",
      body: "Bildet treffer en etablert læresetning fra Geotia. Her er gamle dogmer relevante, men farlige.",
      tone: "blue",
    });
  }

  return {
    ...progress,
    missingPlayerNames,
    bestResult,
    secondBestResult,
    worstResult,
    notes,
    insightCards: uniqueInsights(insights),
  };
}
