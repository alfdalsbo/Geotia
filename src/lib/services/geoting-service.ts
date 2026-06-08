import {
  createGeotingProposal as createGeotingProposalCore,
  getCachedGeocodeLocation,
  resolveDueGeotingProposals as resolveDueGeotingProposalsCore,
  saveGeotingPartyPosition as saveGeotingPartyPositionCore,
  saveGeotingVote as saveGeotingVoteCore,
  setCachedGeocodeLocation,
  startGeotingVote as startGeotingVoteCore,
  updateGeotingProposal as updateGeotingProposalCore,
  withdrawGeotingProposal as withdrawGeotingProposalCore,
} from "@/lib/data/geotia-store";
import { withDataMutationLock } from "@/lib/data/mutation-lock";

export { getCachedGeocodeLocation, setCachedGeocodeLocation };

export function createGeotingProposal(...args: Parameters<typeof createGeotingProposalCore>) {
  return withDataMutationLock("geoting", () => createGeotingProposalCore(...args));
}

export function updateGeotingProposal(...args: Parameters<typeof updateGeotingProposalCore>) {
  return withDataMutationLock("geoting", () => updateGeotingProposalCore(...args));
}

export function saveGeotingPartyPosition(...args: Parameters<typeof saveGeotingPartyPositionCore>) {
  return withDataMutationLock("geoting", () => saveGeotingPartyPositionCore(...args));
}

export function withdrawGeotingProposal(...args: Parameters<typeof withdrawGeotingProposalCore>) {
  return withDataMutationLock("geoting", () => withdrawGeotingProposalCore(...args));
}

export function startGeotingVote(...args: Parameters<typeof startGeotingVoteCore>) {
  return withDataMutationLock("geoting", () => startGeotingVoteCore(...args));
}

export function saveGeotingVote(...args: Parameters<typeof saveGeotingVoteCore>) {
  return withDataMutationLock("geoting", () => saveGeotingVoteCore(...args));
}

export function resolveDueGeotingProposals(...args: Parameters<typeof resolveDueGeotingProposalsCore>) {
  return withDataMutationLock("geoting", () => resolveDueGeotingProposalsCore(...args));
}
