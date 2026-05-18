import type { ComputedPlayerResult } from "@/lib/types";

export type SlowGeoAnswerStatusItem = {
  playerId: string;
  name: string;
  shortName: string;
  color: string;
  hasAnswered: boolean;
  isCurrent: boolean;
};

export function buildSlowGeoAnswerStatusItems(
  results: ComputedPlayerResult[],
  currentPlayerId?: string | null,
): SlowGeoAnswerStatusItem[] {
  return results.map((result) => ({
    playerId: result.playerId,
    name: result.player.name,
    shortName: result.player.shortName,
    color: result.player.color,
    hasAnswered: Boolean(result.guessLocation),
    isCurrent: result.playerId === currentPlayerId,
  }));
}
