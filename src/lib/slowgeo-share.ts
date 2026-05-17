export function buildOpenSlowGeoShareText(roundName: string) {
  return `Nytt SlowGeo-bilde er oppe: ${roundName}. Krangle først, sett pinnen etterpå.`;
}

export function buildRevealedSlowGeoShareText({
  roundName,
  answerLabel,
  winnerNames = [],
}: {
  roundName: string;
  answerLabel: string;
  winnerNames?: string[];
}) {
  const winnerText = winnerNames.length ? ` Vinner: ${winnerNames.join(", ")}.` : "";
  return `Fasit er avslørt i ${roundName}: ${answerLabel}.${winnerText}`;
}

const genericAttributionTokens = new Set([
  "all",
  "copyright",
  "data",
  "google",
  "imagery",
  "image",
  "images",
  "inc",
  "llc",
  "map",
  "maps",
  "reserved",
  "rights",
  "street",
  "view",
]);

export function isSafeSlowGeoAttribution(value: string | null | undefined) {
  if (!value) return true;

  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const tokens = normalized.match(/[a-z0-9]+/g) ?? [];
  const revealingTokens = tokens.filter((token) => {
    if (/^\d{4}$/.test(token)) return false;
    if (/^\d+$/.test(token)) return false;
    return !genericAttributionTokens.has(token);
  });

  return revealingTokens.length === 0;
}
