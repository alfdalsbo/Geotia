import {
  createSlowGeoRound as createSlowGeoRoundCore,
  deleteSlowGeoRound as deleteSlowGeoRoundCore,
  maybeRevealRound as maybeRevealRoundCore,
  replaceSlowGeoPanoramaRound as replaceSlowGeoPanoramaRoundCore,
  revealBohemGeoRoundNow as revealBohemGeoRoundNowCore,
  revealDueSlowGeoRounds as revealDueSlowGeoRoundsCore,
  submitSlowGeoGuess as submitSlowGeoGuessCore,
} from "@/lib/data/geotia-store";
import { withDataMutationLock } from "@/lib/data/mutation-lock";

export function createSlowGeoRound(...args: Parameters<typeof createSlowGeoRoundCore>) {
  return withDataMutationLock("slowgeo", () => createSlowGeoRoundCore(...args));
}

export function replaceSlowGeoPanoramaRound(...args: Parameters<typeof replaceSlowGeoPanoramaRoundCore>) {
  return withDataMutationLock("slowgeo", () => replaceSlowGeoPanoramaRoundCore(...args));
}

export function deleteSlowGeoRound(...args: Parameters<typeof deleteSlowGeoRoundCore>) {
  return withDataMutationLock("slowgeo", () => deleteSlowGeoRoundCore(...args));
}

export function submitSlowGeoGuess(...args: Parameters<typeof submitSlowGeoGuessCore>) {
  return withDataMutationLock("slowgeo", () => submitSlowGeoGuessCore(...args));
}

export function revealDueSlowGeoRounds(...args: Parameters<typeof revealDueSlowGeoRoundsCore>) {
  return withDataMutationLock("slowgeo", () => revealDueSlowGeoRoundsCore(...args));
}

export function maybeRevealRound(...args: Parameters<typeof maybeRevealRoundCore>) {
  return withDataMutationLock("slowgeo", () => maybeRevealRoundCore(...args));
}

export function revealBohemGeoRoundNow(...args: Parameters<typeof revealBohemGeoRoundNowCore>) {
  return withDataMutationLock("slowgeo", () => revealBohemGeoRoundNowCore(...args));
}
