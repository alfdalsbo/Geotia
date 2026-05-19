import {
  pickGeoticLines,
  renderGeoticTemplate,
  slowGeoOpenShareTemplates,
  slowGeoPersonalRevealShareTemplates,
  slowGeoRevealShareTemplates,
} from "@/lib/geotia-jargon";

function winnerSentence(winnerNames: string[]) {
  return winnerNames.length ? ` Vinner: ${winnerNames.join(", ")}.` : "";
}

export function buildOpenSlowGeoShareText(roundName: string) {
  return buildOpenSlowGeoShareTextOptions(roundName, roundName, 1)[0] ?? "";
}

export function buildOpenSlowGeoShareTextOptions(roundName: string, seed = roundName, count = 4) {
  return pickGeoticLines(slowGeoOpenShareTemplates, `${seed}:open`, count).map((template) =>
    renderGeoticTemplate(template, { roundName }),
  );
}

export function buildRevealedSlowGeoShareText({
  roundName,
  answerLabel,
  winnerNames = [],
  seed,
}: {
  roundName: string;
  answerLabel: string;
  winnerNames?: string[];
  seed?: string;
}) {
  return buildRevealedSlowGeoShareTextOptions({ roundName, answerLabel, winnerNames, seed, count: 1 })[0] ?? "";
}

export function buildRevealedSlowGeoShareTextOptions({
  roundName,
  answerLabel,
  winnerNames = [],
  seed = roundName,
  count = 4,
}: {
  roundName: string;
  answerLabel: string;
  winnerNames?: string[];
  seed?: string;
  count?: number;
}) {
  return pickGeoticLines(slowGeoRevealShareTemplates, `${seed}:reveal`, count).map((template) =>
    renderGeoticTemplate(template, {
      roundName,
      answerLabel,
      winnerSentence: winnerSentence(winnerNames),
    }),
  );
}

export function buildPersonalRevealedSlowGeoShareTextOptions({
  roundName,
  answerLabel,
  playerName,
  distance,
  winnerNames = [],
  seed = `${roundName}:${playerName}`,
  count = 4,
}: {
  roundName: string;
  answerLabel: string;
  playerName: string;
  distance: string;
  winnerNames?: string[];
  seed?: string;
  count?: number;
}) {
  return pickGeoticLines(slowGeoPersonalRevealShareTemplates, `${seed}:personal-reveal`, count).map((template) =>
    renderGeoticTemplate(template, {
      roundName,
      answerLabel,
      playerName,
      distance,
      winnerSentence: winnerSentence(winnerNames),
    }),
  );
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

function attributionTokens(value: string | null | undefined) {
  if (!value) return [];

  const normalized = value
    .normalize("NFKD")
    .replace(/[æÆ]/g, "ae")
    .replace(/[øØ]/g, "o")
    .replace(/[åÅ]/g, "a")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return normalized.match(/[a-z0-9]+/g) ?? [];
}

export function isSafeSlowGeoAttribution(value: string | null | undefined, unsafeHints: string[] = []) {
  if (!value) return true;

  const tokens = attributionTokens(value);
  const revealingTokens = tokens.filter((token) => {
    if (/^\d{4}$/.test(token)) return false;
    if (/^\d+$/.test(token)) return false;
    return !genericAttributionTokens.has(token);
  });

  if (unsafeHints.length > 0) {
    const unsafeHintTokens = new Set(
      unsafeHints
        .flatMap((hint) => attributionTokens(hint))
        .filter((token) => token.length >= 4 && !genericAttributionTokens.has(token)),
    );
    return !revealingTokens.some((token) => unsafeHintTokens.has(token));
  }

  return revealingTokens.length === 0;
}
