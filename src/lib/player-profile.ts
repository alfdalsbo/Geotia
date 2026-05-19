import type { Player, PlayerProfile } from "@/lib/types";

const nicknameMaxLength = 36;

export function normalizePlayerNickname(value: string | null | undefined) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, nicknameMaxLength);
  return normalized || null;
}

export function getPlayerOfficialFirstName(player: Player) {
  return player.officialShortName ?? player.shortName;
}

export function getPlayerDisplayName(player: Player) {
  return normalizePlayerNickname(player.nickname) ?? player.shortName;
}

export function applyPlayerProfiles(basePlayers: Player[], profiles: PlayerProfile[]) {
  const profileByPlayerId = new Map(profiles.map((profile) => [profile.playerId, profile]));
  return basePlayers.map((player) => {
    const officialShortName = player.officialShortName ?? player.shortName;
    const nickname = normalizePlayerNickname(profileByPlayerId.get(player.id)?.nickname);
    return {
      ...player,
      officialShortName,
      nickname,
      shortName: nickname ?? officialShortName,
    };
  });
}
