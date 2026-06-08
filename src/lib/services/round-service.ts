import {
  emptyGameResults,
  lockRound as lockRoundCore,
  makeEmptyGameSession,
  makeEmptyRound,
  unlockRound as unlockRoundCore,
  upsertGameSession as upsertGameSessionCore,
  upsertRound as upsertRoundCore,
} from "@/lib/data/geotia-store";
import { withDataMutationLock } from "@/lib/data/mutation-lock";

export { emptyGameResults, makeEmptyGameSession, makeEmptyRound };

export function upsertRound(...args: Parameters<typeof upsertRoundCore>) {
  return withDataMutationLock("rounds", () => upsertRoundCore(...args));
}

export function upsertGameSession(...args: Parameters<typeof upsertGameSessionCore>) {
  return withDataMutationLock("game-sessions", () => upsertGameSessionCore(...args));
}

export function lockRound(...args: Parameters<typeof lockRoundCore>) {
  return withDataMutationLock("rounds", () => lockRoundCore(...args));
}

export function unlockRound(...args: Parameters<typeof unlockRoundCore>) {
  return withDataMutationLock("rounds", () => unlockRoundCore(...args));
}
