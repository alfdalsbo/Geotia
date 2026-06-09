import { buildRoundMapSnapshot, haversineKm } from "@/lib/geo";
import { computeStandings } from "@/lib/scoring";
import type { GeotiaEra, Player, Round, SlowGeoMode, SlowGeoVariant } from "@/lib/types";

export const slowGeoModes: SlowGeoMode[] = ["static", "panorama"];

export const slowGeoVariants: SlowGeoVariant[] = ["slowgeo", "bohemgeo"];

export const MIN_SLOWGEO_REVEAL_GUESSES = 4;

export const MIN_OFFICIAL_SLOWGEO_PLAY_MINUTES = 60;

export const DEFAULT_SLOWGEO_DEADLINE_LEGAL_MINUTES = 120;

export const DEFAULT_SLOWGEO_ERA_ID = "proveaeraen";

const OSLO_TIME_ZONE = "Europe/Oslo";
const MINUTE_MS = 60 * 1000;

export const slowGeoEras: GeotiaEra[] = [
  {
    id: DEFAULT_SLOWGEO_ERA_ID,
    name: "Den store prøveæraen",
    title: "Testperiodens høytidelige hvelv",
    description: "Alle testpoeng og tidlige SlowGeo-spor samles her når riket senere starter på nytt.",
    archivedAt: null,
  },
];

export const slowGeoModeLabels: Record<SlowGeoMode, string> = {
  static: "Statisk",
  panorama: "Panorama",
};

export const slowGeoVariantLabels: Record<SlowGeoVariant, string> = {
  slowgeo: "SlowGeo",
  bohemgeo: "BohemGeo",
};

export function normalizeSlowGeoMode(value: unknown): SlowGeoMode {
  return value === "panorama" ? "panorama" : "static";
}

export function normalizeSlowGeoVariant(value: unknown): SlowGeoVariant {
  return value === "bohemgeo" ? "bohemgeo" : "slowgeo";
}

export function getSlowGeoMode(round: Pick<Round, "slowGeoMode">): SlowGeoMode {
  return normalizeSlowGeoMode(round.slowGeoMode);
}

export function getSlowGeoVariant(round: Pick<Round, "slowGeoVariant">): SlowGeoVariant {
  return normalizeSlowGeoVariant(round.slowGeoVariant);
}

export function getActiveSlowGeoEra() {
  return slowGeoEras[0];
}

export function getSlowGeoEraId(round: Pick<Round, "slowGeoEraId">) {
  return round.slowGeoEraId || DEFAULT_SLOWGEO_ERA_ID;
}

export function filterSlowGeoRoundsForEra(rounds: Round[], eraId = getActiveSlowGeoEra().id) {
  return rounds.filter((round) => isScoreBearingSlowGeoRound(round) && getSlowGeoEraId(round) === eraId);
}

export function computeStandingsForEra(players: Player[], rounds: Round[], eraId = getActiveSlowGeoEra().id) {
  return computeStandings(players, filterSlowGeoRoundsForEra(rounds, eraId));
}

export function isBohemGeoRound(round: Pick<Round, "challenge" | "slowGeoVariant">) {
  return Boolean(round.challenge) && getSlowGeoVariant(round) === "bohemgeo";
}

export function isScoreBearingSlowGeoRound(round: Round) {
  return isSlowGeoRound(round) && getSlowGeoVariant(round) === "slowgeo" && hasMinimumSlowGeoRevealGuesses(round);
}

export function isScoreBearingRound(round: Round) {
  return isSlowGeoRound(round) ? isScoreBearingSlowGeoRound(round) : true;
}

export function filterScoreBearingRounds(rounds: Round[]) {
  return rounds.filter(isScoreBearingRound);
}

export function getSlowGeoStartedAt(round: Pick<Round, "slowGeoStartedAt" | "createdAt">) {
  return round.slowGeoStartedAt ?? round.createdAt;
}

export function getSlowGeoStarterLabel(round: Pick<Round, "slowGeoStartedBy">, allPlayers: Player[]) {
  if (!round.slowGeoStartedBy) return "Ukjent igangsetter";
  return allPlayers.find((player) => player.id === round.slowGeoStartedBy)?.shortName ?? round.slowGeoStartedBy;
}

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

export function countSlowGeoGuesses(round: Round) {
  return round.results.filter((result) => Boolean(result.guessLocation)).length;
}

export function hasMinimumSlowGeoRevealGuesses(round: Round) {
  return countSlowGeoGuesses(round) >= MIN_SLOWGEO_REVEAL_GUESSES;
}

export function hasLockedSlowGeoGuess(round: Round) {
  return round.results.some((result) => Boolean(result.guessLocation));
}

export function shouldRevealSlowGeoRound(round: Round, players: Player[], now = new Date()) {
  if (isBohemGeoRound(round)) {
    return isSlowGeoOpenRound(round) && isRoundPastDeadline(round, now);
  }

  return isSlowGeoOpenRound(round) && (isRoundPastDeadline(round, now) || allPlayersHaveSlowGeoGuesses(round, players));
}

export function canRevealBohemGeoNow(round: Round) {
  return isSlowGeoOpenRound(round) && isBohemGeoRound(round);
}

export function osloDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: OSLO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function osloWallTimeToDate(year: number, month: number, day: number, hour: number, minute: number) {
  const desiredWallTime = Date.UTC(year, month - 1, day, hour, minute, 0);
  const actualParts = osloDateParts(new Date(desiredWallTime));
  const actualWallTime = Date.UTC(
    actualParts.year,
    actualParts.month - 1,
    actualParts.day,
    actualParts.hour,
    actualParts.minute,
    actualParts.second,
  );
  return new Date(desiredWallTime + (desiredWallTime - actualWallTime));
}

function ceilToMinute(date: Date) {
  const time = date.getTime();
  const remainder = time % MINUTE_MS;
  return new Date(remainder === 0 ? time : time + (MINUTE_MS - remainder));
}

export function isOfficialSlowGeoPlayTime(date: Date) {
  const { hour } = osloDateParts(date);
  return hour >= 7 && hour < 23;
}

function isOfficialSlowGeoPlayMinute(date: Date) {
  return isOfficialSlowGeoPlayTime(date);
}

function isOfficialSlowGeoDeadline(date: Date) {
  const { hour, minute, second } = osloDateParts(date);
  return (hour >= 7 && hour < 23) || (hour === 23 && minute === 0 && second === 0);
}

export function countOfficialSlowGeoPlayMinutes(from: Date, to: Date) {
  const end = to.getTime();
  let cursor = ceilToMinute(from).getTime();
  let minutes = 0;

  while (cursor < end) {
    if (isOfficialSlowGeoPlayMinute(new Date(cursor))) minutes += 1;
    cursor += MINUTE_MS;
  }

  return minutes;
}

export function addOfficialSlowGeoPlayMinutes(from: Date, minutes: number) {
  const targetMinutes = Math.max(0, Math.round(minutes));
  let cursor = ceilToMinute(from).getTime();
  let counted = 0;

  while (counted < targetMinutes) {
    if (isOfficialSlowGeoPlayMinute(new Date(cursor))) counted += 1;
    cursor += MINUTE_MS;
  }

  return new Date(cursor);
}

export function normalizeOfficialSlowGeoDeadlineAt(candidate: Date, now = new Date()) {
  const latest = Number.isFinite(candidate.getTime()) && candidate.getTime() > now.getTime()
    ? candidate
    : addOfficialSlowGeoPlayMinutes(now, MIN_OFFICIAL_SLOWGEO_PLAY_MINUTES);

  if (
    isOfficialSlowGeoDeadline(latest) &&
    countOfficialSlowGeoPlayMinutes(now, latest) >= MIN_OFFICIAL_SLOWGEO_PLAY_MINUTES
  ) {
    return latest;
  }

  let cursor = ceilToMinute(latest).getTime();
  const maxCursor = cursor + 14 * 24 * 60 * MINUTE_MS;

  while (cursor <= maxCursor) {
    const deadline = new Date(cursor);
    if (
      isOfficialSlowGeoDeadline(deadline) &&
      countOfficialSlowGeoPlayMinutes(now, deadline) >= MIN_OFFICIAL_SLOWGEO_PLAY_MINUTES
    ) {
      return deadline;
    }
    cursor += MINUTE_MS;
  }

  return addOfficialSlowGeoPlayMinutes(now, MIN_OFFICIAL_SLOWGEO_PLAY_MINUTES);
}

export function defaultOfficialSlowGeoDeadlineAt(now = new Date()) {
  return addOfficialSlowGeoPlayMinutes(now, DEFAULT_SLOWGEO_DEADLINE_LEGAL_MINUTES);
}

export function formatOsloTime(date: Date) {
  const values = osloDateParts(date);
  return `${String(values.hour).padStart(2, "0")}:${String(values.minute).padStart(2, "0")}`;
}

export function nextOfficialSlowGeoPlayOpeningAt(now = new Date()) {
  const values = osloDateParts(now);
  const opensToday = values.hour < 7;
  return osloWallTimeToDate(values.year, values.month, values.day + (opensToday ? 0 : 1), 7, 0);
}

export type SlowGeoGuessWindowState =
  | { canSubmit: true; reason: "open"; nextOpensAt?: undefined }
  | { canSubmit: false; reason: "closed" | "deadline"; nextOpensAt?: undefined }
  | { canSubmit: false; reason: "night"; nextOpensAt: string };

export function getSlowGeoGuessWindowState(round: Round, now = new Date()): SlowGeoGuessWindowState {
  if (!isSlowGeoOpenRound(round)) {
    return { canSubmit: false, reason: "closed" };
  }
  if (isRoundPastDeadline(round, now)) {
    return { canSubmit: false, reason: "deadline" };
  }
  if (isBohemGeoRound(round) || isOfficialSlowGeoPlayTime(now)) {
    return { canSubmit: true, reason: "open" };
  }
  return {
    canSubmit: false,
    reason: "night",
    nextOpensAt: nextOfficialSlowGeoPlayOpeningAt(now).toISOString(),
  };
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
    status: "locked",
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
