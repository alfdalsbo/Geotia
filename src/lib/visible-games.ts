export const VISIBLE_GAME_IDS = ["slowgeo"] as const;

const visibleGameIds = new Set<string>(VISIBLE_GAME_IDS);

export function isVisibleGameId(gameId: string) {
  return visibleGameIds.has(gameId);
}

export function getVisibleGames<T extends { id: string }>(games: readonly T[]) {
  return games.filter((game) => isVisibleGameId(game.id));
}
