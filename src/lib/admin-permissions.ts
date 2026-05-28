import { players } from "@/lib/seed";
import { isThirdCollegeMember } from "@/lib/kollegium";

export function canManageRounds(playerId: string | null | undefined) {
  return isThirdCollegeMember(playerId);
}

export function canManageGameSessions(playerId: string | null | undefined) {
  return isThirdCollegeMember(playerId);
}

export function canManageSlowGeoAdmin(playerId: string | null | undefined) {
  return isThirdCollegeMember(playerId);
}

export function canStartSlowGeoRound(playerId: string | null | undefined) {
  const player = players.find((candidate) => candidate.id === playerId);
  return Boolean(player && player.role !== "tingvitne");
}
