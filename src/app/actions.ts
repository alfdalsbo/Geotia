"use server";

import { redirect } from "next/navigation";

import { createSession, destroySession, isCorrectPasscode, playerIdFromUsername, requireSession } from "@/lib/auth";
import { GEO_OATH_TEXT } from "@/lib/geoting";
import { haversineKm, parseGeoLocationJson } from "@/lib/geo";
import { geoterIndexCategories } from "@/lib/geoterindeks";
import { geoticOrderHiddenCategories, geoticOrderRanks, geoticOrderStatuses } from "@/lib/geotisk-orden";
import { isThirdCollegeMember } from "@/lib/kollegium";
import {
  revalidateGameSessionPaths,
  revalidateGeoticOrderPaths,
  revalidateGeotingAdminPaths,
  revalidateGeotingPaths,
  revalidateRoundPaths,
  revalidateSlowGeoPaths,
  revalidateThirdCollegePaths,
} from "@/lib/revalidation";
import { competingPlayers, games, isVotingPlayerId, players } from "@/lib/seed";
import {
  addGeoterIndexAdjustment,
  createSlowGeoRound,
  createGeotingProposal,
  lockRound,
  saveGeotingVote,
  saveGeotingPartyPosition,
  startGeotingVote,
  submitSlowGeoGuess,
  updateGeotingProposal,
  unlockRound,
  upsertGeoticOrderAssessment,
  upsertGameSession,
  upsertRound,
  withdrawGeotingProposal,
} from "@/lib/store";
import type {
  DistanceSource,
  GameId,
  GameResult,
  GeoLocation,
  GeoterIndexCategory,
  GeoticOrderHiddenCategory,
  GeoticOrderRankId,
  GeoticOrderStatus,
  GeotingImplementationStatus,
  PartyPositionValue,
  PlayerResult,
  ProposalRuleType,
  ResultStatus,
  VoteValue,
} from "@/lib/types";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function limitedField(formData: FormData, key: string, maxLength: number) {
  return field(formData, key).slice(0, maxLength);
}

function safeRedirectPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return "/";
  return value;
}

function kmField(formData: FormData, key: string) {
  const raw = field(formData, key).replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function numberField(formData: FormData, key: string) {
  const parsed = Number(field(formData, key).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function osloDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
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

function osloWallTimeToDate(year: number, month: number, day: number, hour: number, minute: number) {
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

function slowGeoDeadlineAt(formData: FormData) {
  const rawTime = field(formData, "deadline_time");
  const match = /^(\d{1,2}):(\d{2})$/.exec(rawTime);
  if (!match) return undefined;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return undefined;

  const now = new Date();
  const today = osloDateParts(now);
  let candidate = osloWallTimeToDate(today.year, today.month, today.day, hour, minute);
  if (candidate.getTime() <= now.getTime()) {
    candidate = osloWallTimeToDate(today.year, today.month, today.day + 1, hour, minute);
  }
  return candidate.toISOString();
}

function statusField(value: string): ResultStatus {
  if (value === "deltatt" || value === "ikke_deltatt" || value === "ugyldig") return value;
  return "ikke_deltatt";
}

function distanceSourceField(value: string): DistanceSource | null {
  if (value === "auto" || value === "manual") return value;
  return null;
}

export async function loginAction(formData: FormData) {
  const username = field(formData, "username");
  const playerId = playerIdFromUsername(username);
  const passcode = field(formData, "passcode");
  const next = safeRedirectPath(field(formData, "next"));
  if (!playerId || !isCorrectPasscode(passcode)) {
    redirect(`/login?error=avvist&next=${encodeURIComponent(next)}`);
  }

  await createSession(playerId);
  redirect(next);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function saveRoundAction(formData: FormData) {
  await requireSession();
  const answerLocation = parseGeoLocationJson(field(formData, "answer_location_json"));

  const results: PlayerResult[] = competingPlayers.map((player) => {
    const status = statusField(field(formData, `status_${player.id}`));
    const guessLocation = parseGeoLocationJson(field(formData, `guess_location_json_${player.id}`));
    const distanceSource = distanceSourceField(field(formData, `distance_source_${player.id}`));
    const autoKm = answerLocation && guessLocation ? haversineKm(answerLocation, guessLocation) : kmField(formData, `auto_km_${player.id}`);
    const manualKm = kmField(formData, `km_${player.id}`);
    const actualKm =
      status === "deltatt"
        ? distanceSource === "auto" && autoKm !== null
          ? autoKm
          : manualKm ?? autoKm
        : null;
    return {
      playerId: player.id,
      status,
      actualKm,
      guessText: field(formData, `guess_text_${player.id}`),
      guessLocation,
      distanceSource: status === "deltatt" && actualKm !== null ? distanceSource ?? (autoKm !== null ? "auto" : "manual") : null,
      note: field(formData, `note_${player.id}`),
    };
  });

  await upsertRound({
    id: field(formData, "id") || undefined,
    date: field(formData, "date") || new Date().toISOString().slice(0, 10),
    name: field(formData, "name") || "Navnløs runde",
    answer: field(formData, "answer"),
    answerLocation,
    country: field(formData, "country"),
    continent: field(formData, "continent"),
    comment: field(formData, "comment"),
    results,
  });

  revalidateRoundPaths();
  redirect("/runder?status=lagret");
}

export async function createSlowGeoRoundAction(formData: FormData) {
  await requireSession();
  const title = field(formData, "title");
  const deadlineAt = slowGeoDeadlineAt(formData);

  const result = await createSlowGeoRound({
    title,
    deadlineAt,
  });

  revalidateSlowGeoPaths(result.ok ? result.round?.id : undefined);

  if (!result.ok || !result.round) {
    redirect(`/spill/slowgeo?error=${encodeURIComponent(result.reason ?? "SlowGeo-runden kunne ikke åpnes.")}`);
  }

  redirect(`/runder/${result.round.id}?status=apnet`);
}

export async function submitSlowGeoGuessAction(formData: FormData) {
  const session = await requireSession();
  const roundId = field(formData, "round_id");
  const lat = Number(field(formData, "guess_lat").replace(",", "."));
  const lon = Number(field(formData, "guess_lon").replace(",", "."));

  if (!roundId || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    redirect(`/runder/${roundId || ""}?error=${encodeURIComponent("Sett en pin på kartet før svaret sendes.")}`);
  }

  const location: GeoLocation = {
    lat,
    lon,
    label: field(formData, "guess_label") || "Pin-svar",
    query: "pin",
    source: "manual",
  };
  const result = await submitSlowGeoGuess({
    roundId,
    playerId: session.playerId,
    location,
    note: limitedField(formData, "guess_note", 280),
  });

  revalidateSlowGeoPaths(roundId);

  if (!result.ok) {
    redirect(`/runder/${roundId}?error=${encodeURIComponent(result.reason ?? "Svaret ble ikke ført.")}`);
  }

  redirect(`/runder/${roundId}?status=${result.revealed ? "avslort" : "gjettet"}`);
}

function gameIdField(value: string): GameId {
  const game = games.find((candidate) => candidate.id === value);
  return game?.id === "slowgeo" ? "geo" : game?.id ?? "geo";
}

export async function saveGameSessionAction(formData: FormData) {
  await requireSession();
  const gameId = gameIdField(field(formData, "gameId"));

  const results: GameResult[] = competingPlayers.map((player) => {
    const status = statusField(field(formData, `status_${player.id}`));
    const rawScore = kmField(formData, `score_${player.id}`);
    return {
      playerId: player.id,
      status,
      score: status === "deltatt" ? rawScore : null,
      note: field(formData, `note_${player.id}`),
    };
  });

  await upsertGameSession({
    gameId,
    date: field(formData, "date") || new Date().toISOString().slice(0, 10),
    title: field(formData, "title") || "Navnløs spilløkt",
    context: field(formData, "context"),
    results,
  });

  revalidateGameSessionPaths();
  redirect(`/spill/registrer?status=lagret&game=${gameId}`);
}

export async function lockRoundAction(formData: FormData) {
  await requireSession();
  const id = field(formData, "id");
  const result = await lockRound(id);
  revalidateSlowGeoPaths(id);

  if (!result.ok) {
    redirect(`/runder/${id}?error=${encodeURIComponent(result.reason ?? "GeoVAR fant en ukjent feil.")}`);
  }
  redirect("/runder?status=last");
}

export async function unlockRoundAction(formData: FormData) {
  await requireSession();
  const id = field(formData, "id");
  await unlockRound(id);
  revalidateSlowGeoPaths(id);
  redirect(`/runder/${id}?status=geovar`);
}

function proposalRuleType(value: string): ProposalRuleType {
  if (value === "grunnlov" || value === "mindre" || value === "annet") return value;
  return "annet";
}

function implementationStatusField(value: string): GeotingImplementationStatus | undefined {
  if (value === "pending" || value === "implemented" || value === "ignored") return value;
  return undefined;
}

function partyPositionField(value: string): PartyPositionValue {
  if (value === "for" || value === "mot" || value === "blankt" || value === "fri") return value;
  return "fri";
}

function voteValue(value: string): VoteValue {
  if (value === "for" || value === "mot" || value === "blankt") return value;
  return "blankt";
}

function geoterIndexCategory(value: string): GeoterIndexCategory {
  return geoterIndexCategories.some((category) => category.id === value)
    ? (value as GeoterIndexCategory)
    : "fellesskap";
}

function geoticOrderRank(value: string): GeoticOrderRankId {
  return geoticOrderRanks.some((rank) => rank.id === value) ? (value as GeoticOrderRankId) : "borger";
}

function geoticOrderHiddenCategory(value: string): GeoticOrderHiddenCategory {
  return geoticOrderHiddenCategories.some((category) => category.id === value)
    ? (value as GeoticOrderHiddenCategory)
    : "stolpe";
}

function geoticOrderStatus(value: string): GeoticOrderStatus {
  return geoticOrderStatuses.some((status) => status.id === value) ? (value as GeoticOrderStatus) : "normal";
}

function geotingAdminRedirect(formData: FormData, status: string, fallback: string) {
  const returnTo = field(formData, "returnTo");
  const basePath = returnTo === "/geotinget/pergamenter" ? returnTo : fallback;
  return `${basePath}?status=${encodeURIComponent(status)}`;
}

function geotingAdminErrorRedirect(formData: FormData, reason: string, fallback: string) {
  const returnTo = field(formData, "returnTo");
  const basePath = returnTo === "/geotinget/pergamenter" ? returnTo : fallback;
  return `${basePath}?error=${encodeURIComponent(reason)}`;
}

export async function submitGeotingProposalAction(formData: FormData) {
  const session = await requireSession();
  await createGeotingProposal({
    title: field(formData, "title") || "Navnløst forslag",
    body: field(formData, "body"),
    ruleType: proposalRuleType(field(formData, "ruleType")),
    proposedBy: session.playerId,
  });

  revalidateGeotingPaths();
  redirect("/geotinget?status=forslag");
}

export async function updateGeotingProposalAction(formData: FormData) {
  const session = await requireSession();
  if (!isThirdCollegeMember(session.playerId)) {
    redirect("/");
  }

  const result = await updateGeotingProposal({
    proposalId: field(formData, "proposalId"),
    title: field(formData, "title"),
    body: field(formData, "body"),
    ruleType: proposalRuleType(field(formData, "ruleType")),
    implementationStatus: implementationStatusField(field(formData, "implementationStatus")),
    implementationNote: formData.has("implementationNote") ? limitedField(formData, "implementationNote", 320) : undefined,
  });

  revalidateGeotingAdminPaths();

  if (!result.ok) {
    redirect(geotingAdminErrorRedirect(formData, result.reason ?? "Kollegiet fikk ikke endret saken.", "/tredje-kollegium"));
  }
  redirect(geotingAdminRedirect(formData, "geoting-redigert", "/tredje-kollegium"));
}

export async function saveGeotingPartyPositionAction(formData: FormData) {
  const session = await requireSession();
  const player = players.find((candidate) => candidate.id === session.playerId);
  if (!player?.partyId || player.canVote === false) {
    redirect("/geotinget/avstemninger?error=tingvitne");
  }

  const proposalId = field(formData, "proposalId");
  const result = await saveGeotingPartyPosition({
    proposalId,
    partyId: player.partyId,
    position: partyPositionField(field(formData, "position")),
    comment: limitedField(formData, "comment", 220),
    updatedBy: player.id,
  });

  revalidateGeotingAdminPaths();

  if (!result.ok) {
    redirect(`/geotinget/avstemninger?error=${encodeURIComponent(result.reason ?? "Partiposisjonen ble ikke ført.")}`);
  }
  redirect(`/geotinget/avstemninger?status=partiposisjon`);
}

export async function withdrawGeotingProposalAction(formData: FormData) {
  const session = await requireSession();
  if (!isThirdCollegeMember(session.playerId)) {
    redirect("/");
  }

  const result = await withdrawGeotingProposal({
    proposalId: field(formData, "proposalId"),
  });

  revalidateGeotingAdminPaths();

  if (!result.ok) {
    redirect(geotingAdminErrorRedirect(formData, result.reason ?? "Kollegiet fikk ikke trukket saken.", "/tredje-kollegium"));
  }
  redirect(geotingAdminRedirect(formData, "geoting-trukket", "/tredje-kollegium"));
}

export async function startGeotingVoteAction(formData: FormData) {
  const session = await requireSession();
  if (!isVotingPlayerId(session.playerId)) {
    redirect("/geotinget/avstemninger?error=tingvitne");
  }
  if (field(formData, "geoOath") !== "on") {
    redirect("/geotinget/avstemninger?error=geoed");
  }

  const result = await startGeotingVote({
    proposalId: field(formData, "proposalId"),
    playerId: session.playerId,
    oathText: field(formData, "oathText") || GEO_OATH_TEXT,
  });

  revalidateGeotingAdminPaths();

  if (!result.ok) {
    redirect(`/geotinget/avstemninger?error=${encodeURIComponent(result.reason ?? "Geo-eden sprakk i pergamentet.")}`);
  }
  redirect("/geotinget/avstemninger?status=avstemning");
}

export async function voteGeotingProposalAction(formData: FormData) {
  const session = await requireSession();
  if (!isVotingPlayerId(session.playerId)) {
    redirect("/geotinget/avstemninger?error=tingvitne");
  }

  const result = await saveGeotingVote({
    proposalId: field(formData, "proposalId"),
    playerId: session.playerId,
    vote: voteValue(field(formData, "vote")),
    comment: field(formData, "comment"),
  });

  revalidateGeotingAdminPaths();

  if (!result.ok || !result.proposal) {
    redirect(`/geotinget/avstemninger?error=${encodeURIComponent(result.reason ?? "Stemmen ble stoppet av embetsverket.")}`);
  }
  const proposal = result.proposal;
  redirect(
    proposal.status === "passed" || proposal.status === "rejected"
      ? "/geotinget/avstemninger?status=avgjort"
      : "/geotinget/avstemninger?status=stemt",
  );
}

export async function submitGeoterIndexAdjustmentAction(formData: FormData) {
  const session = await requireSession();
  if (!isThirdCollegeMember(session.playerId)) {
    redirect("/");
  }

  const playerId = field(formData, "playerId");
  const delta = Math.max(-100, Math.min(100, Math.round(numberField(formData, "delta"))));
  if (!players.some((player) => player.id === playerId) || delta === 0) {
    redirect("/tredje-kollegium?error=indeks");
  }

  await addGeoterIndexAdjustment({
    playerId,
    delta,
    category: geoterIndexCategory(field(formData, "category")),
    title: field(formData, "title") || (delta > 0 ? "Skjult kreditt" : "Skjult trekk"),
    reason: field(formData, "reason"),
    createdBy: session.playerId,
  });

  revalidateThirdCollegePaths();
  redirect("/tredje-kollegium?status=geoterindeks");
}

export async function submitGeoticOrderAssessmentAction(formData: FormData) {
  const session = await requireSession();
  if (!isThirdCollegeMember(session.playerId)) {
    redirect("/");
  }

  const playerId = field(formData, "playerId");
  if (!players.some((player) => player.id === playerId)) {
    redirect("/tredje-kollegium?error=orden");
  }

  await upsertGeoticOrderAssessment({
    playerId,
    rankId: geoticOrderRank(field(formData, "rankId")),
    serviceWeeks: Math.max(0, Math.min(999, Math.round(numberField(formData, "serviceWeeks")))),
    hiddenCategory: geoticOrderHiddenCategory(field(formData, "hiddenCategory")),
    status: geoticOrderStatus(field(formData, "status")),
    sponsor: field(formData, "sponsor"),
    trial: field(formData, "trial"),
    publicNote: field(formData, "publicNote"),
    internalNote: field(formData, "internalNote"),
    updatedBy: session.playerId,
  });

  revalidateGeoticOrderPaths();
  redirect("/tredje-kollegium?status=orden");
}
