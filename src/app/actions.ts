"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSession, destroySession, isCorrectPasscode, playerIdFromUsername, requireSession } from "@/lib/auth";
import { games, players } from "@/lib/seed";
import {
  createGeotingProposal,
  lockRound,
  saveGeotingVote,
  unlockRound,
  upsertGameSession,
  upsertRound,
} from "@/lib/store";
import type { GameId, GameResult, PlayerResult, ProposalRuleType, ResultStatus, VoteValue } from "@/lib/types";

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

function statusField(value: string): ResultStatus {
  if (value === "deltatt" || value === "ikke_deltatt" || value === "ugyldig") return value;
  return "ikke_deltatt";
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

  const results: PlayerResult[] = players.map((player) => {
    const status = statusField(field(formData, `status_${player.id}`));
    const actualKm = status === "deltatt" ? kmField(formData, `km_${player.id}`) : null;
    return {
      playerId: player.id,
      status,
      actualKm,
      note: field(formData, `note_${player.id}`),
    };
  });

  await upsertRound({
    id: field(formData, "id") || undefined,
    date: field(formData, "date") || new Date().toISOString().slice(0, 10),
    name: field(formData, "name") || "Navnløs runde",
    answer: field(formData, "answer"),
    country: field(formData, "country"),
    continent: field(formData, "continent"),
    comment: field(formData, "comment"),
    results,
  });

  revalidatePath("/");
  revalidatePath("/runder");
  revalidatePath("/stilling");
  revalidatePath("/hall-of-fame");
  redirect("/runder?status=lagret");
}

function gameIdField(value: string): GameId {
  const game = games.find((candidate) => candidate.id === value);
  return game?.id === "slowgeo" ? "geo" : game?.id ?? "geo";
}

export async function saveGameSessionAction(formData: FormData) {
  await requireSession();
  const gameId = gameIdField(field(formData, "gameId"));

  const results: GameResult[] = players.map((player) => {
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
  redirect(`/runder/${id}?status=geovar`);
}

function proposalRuleType(value: string): ProposalRuleType {
  if (value === "grunnlov" || value === "mindre" || value === "annet") return value;
  return "annet";
}

function voteValue(value: string): VoteValue {
  if (value === "for" || value === "mot" || value === "avhold") return value;
  return "avhold";
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

export async function voteGeotingProposalAction(formData: FormData) {
  const session = await requireSession();
  await saveGeotingVote({
    proposalId: field(formData, "proposalId"),
    playerId: session.playerId,
    vote: voteValue(field(formData, "vote")),
    comment: field(formData, "comment"),
  });

  revalidatePath("/geotinget");
  revalidatePath("/");
  redirect("/geotinget?status=stemt");
}
