"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSession, destroySession, isCorrectPasscode, requireSession } from "@/lib/auth";
import { players } from "@/lib/seed";
import { lockRound, unlockRound, upsertRound } from "@/lib/store";
import type { PlayerResult, ResultStatus } from "@/lib/types";

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
  const passcode = field(formData, "passcode");
  if (!isCorrectPasscode(passcode)) {
    redirect("/login?error=avvist");
  }

  await createSession();
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
