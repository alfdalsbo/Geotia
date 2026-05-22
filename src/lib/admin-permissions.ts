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
