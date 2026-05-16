"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSession, destroySession, isCorrectPasscode, playerIdFromUsername, requireSession } from "@/lib/auth";
import { GEO_OATH_TEXT } from "@/lib/geoting";
import { haversineKm, parseGeoLocationJson } from "@/lib/geo";
import { geoterIndexCategories } from "@/lib/geoterindeks";
import { geoticOrderHiddenCategories, geoticOrderRanks, geoticOrderStatuses } from "@/lib/geotisk-orden";
import { isThirdCollegeMember } from "@/lib/kollegium";
import { competingPlayers, games, isVotingPlayerId, players } from "@/lib/seed";
import {
  addGeoterIndexAdjustment,
  createGeotingProposal,
  lockRound,
  saveGeotingVote,
  startGeotingVote,
  unlockRound,
  upsertGeoticOrderAssessment,
  upsertGameSession,
  upsertRound,
} from "@/lib/store";
import type {
  DistanceSource,
  GameId,
  GameResult,
  GeoterIndexCategory,
  GeoticOrderHiddenCategory,
  GeoticOrderRankId,
  GeoticOrderStatus,
  PlayerResult,
  ProposalRuleType,
  ResultStatus,
  VoteValue,
} from "@/lib/types";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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
  if (!playerId || !isCorrectPasscode(passcode)) {
    redirect("/login?error=avvist");
  }

  await createSession(playerId);
  redirect("/");
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

  revalidatePath("/");
  revalidatePath("/runder");
  revalidatePath("/stilling");
  revalidatePath("/hall-of-fame");
  revalidatePath("/min-geot");
  redirect("/runder?status=lagret");
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

  revalidatePath("/");
  revalidatePath("/spill");
  revalidatePath("/min-geot");
  redirect("/spill?status=lagret");
}

export async function lockRoundAction(formData: FormData) {
  await requireSession();
  const id = field(formData, "id");
  const result = await lockRound(id);
  revalidatePath("/");
  revalidatePath("/runder");
  revalidatePath("/stilling");
  revalidatePath("/hall-of-fame");
  revalidatePath("/min-geot");

  if (!result.ok) {
    redirect(`/runder/${id}?error=${encodeURIComponent(result.reason ?? "GeoVAR fant en ukjent feil.")}`);
  }
  redirect("/runder?status=last");
}

export async function unlockRoundAction(formData: FormData) {
  await requireSession();
  const id = field(formData, "id");
  await unlockRound(id);
  revalidatePath("/");
  revalidatePath("/runder");
  revalidatePath("/stilling");
  revalidatePath("/hall-of-fame");
  revalidatePath("/min-geot");
  redirect(`/runder/${id}?status=geovar`);
}

function proposalRuleType(value: string): ProposalRuleType {
  if (value === "grunnlov" || value === "mindre" || value === "annet") return value;
  return "annet";
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

export async function submitGeotingProposalAction(formData: FormData) {
  const session = await requireSession();
  await createGeotingProposal({
    title: field(formData, "title") || "Navnløst forslag",
    body: field(formData, "body"),
    ruleType: proposalRuleType(field(formData, "ruleType")),
    proposedBy: session.playerId,
  });

  revalidatePath("/geotinget");
  revalidatePath("/");
  redirect("/geotinget?status=forslag");
}

export async function startGeotingVoteAction(formData: FormData) {
  const session = await requireSession();
  if (!isVotingPlayerId(session.playerId)) {
    redirect("/geotinget?error=tingvitne");
  }
  if (field(formData, "geoOath") !== "on") {
    redirect("/geotinget?error=geoed");
  }

  const result = await startGeotingVote({
    proposalId: field(formData, "proposalId"),
    playerId: session.playerId,
    oathText: field(formData, "oathText") || GEO_OATH_TEXT,
  });

  revalidatePath("/geotinget");
  revalidatePath("/arkiv/geotinget");
  revalidatePath("/");

  if (!result.ok) {
    redirect(`/geotinget?error=${encodeURIComponent(result.reason ?? "Geo-eden sprakk i pergamentet.")}`);
  }
  redirect("/geotinget?status=avstemning");
}

export async function voteGeotingProposalAction(formData: FormData) {
  const session = await requireSession();
  if (!isVotingPlayerId(session.playerId)) {
    redirect("/geotinget?error=tingvitne");
  }

  const result = await saveGeotingVote({
    proposalId: field(formData, "proposalId"),
    playerId: session.playerId,
    vote: voteValue(field(formData, "vote")),
    comment: field(formData, "comment"),
  });

  revalidatePath("/geotinget");
  revalidatePath("/arkiv/geotinget");
  revalidatePath("/");

  if (!result.ok || !result.proposal) {
    redirect(`/geotinget?error=${encodeURIComponent(result.reason ?? "Stemmen ble stoppet av embetsverket.")}`);
  }
  const proposal = result.proposal;
  redirect(
    proposal.status === "passed" || proposal.status === "rejected"
      ? "/geotinget?status=avgjort"
      : "/geotinget?status=stemt",
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

  revalidatePath("/tredje-kollegium");
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

  revalidatePath("/tredje-kollegium");
  revalidatePath("/ordenen");
  revalidatePath("/");
  redirect("/tredje-kollegium?status=orden");
}
