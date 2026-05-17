import type { GeotingProposal, GeotingProposalStatus, GeotingVote, Player, VoteValue } from "@/lib/types";

const VOTING_WINDOW_MS = 24 * 60 * 60 * 1000;

export const GEO_OATH_TEXT =
  "Jeg sverger ved kattometeret, GeoKodeksen og all rimelig geografisk skam at jeg umiddelbart varsler alle geoter om at avstemningen har startet.";

export function normalizeVoteValue(value: VoteValue | string): VoteValue {
  if (value === "for" || value === "mot" || value === "blankt") return value;
  return "blankt";
}

export function addVotingWindow(startIso: string) {
  return new Date(new Date(startIso).getTime() + VOTING_WINDOW_MS).toISOString();
}

export function votingPlayers(players: Player[]) {
  return players.filter((player) => player.canVote !== false);
}

function nowTime(now = new Date()) {
  return now.getTime();
}

function proposalEndedByTime(proposal: GeotingProposal, now = new Date()) {
  return Boolean(proposal.voteEndsAt && nowTime(now) >= new Date(proposal.voteEndsAt).getTime());
}

function proposalHasAllVotes(proposal: GeotingProposal, players: Player[]) {
  const voterIds = new Set(votingPlayers(players).map((player) => player.id));
  const voted = new Set(
    proposal.votes
      .filter((vote) => voterIds.has(vote.playerId))
      .map((vote) => vote.playerId),
  );
  return voted.size >= voterIds.size;
}

export function isProposalFinished(proposal: GeotingProposal, players: Player[], now = new Date()) {
  if (proposal.status === "passed" || proposal.status === "rejected" || proposal.status === "archived") return true;
  if (!proposal.voteStartedAt) return false;
  return proposalHasAllVotes(proposal, players) || proposalEndedByTime(proposal, now);
}

function requiredVotes(proposal: GeotingProposal, playerCount: number) {
  if (proposal.ruleType === "grunnlov") return playerCount;
  return 4;
}

function effectiveVotes(proposal: GeotingProposal, players: Player[], now = new Date()) {
  const votingPlayers = players.filter((player) => player.canVote !== false);
  const votingPlayerIds = new Set(votingPlayers.map((player) => player.id));
  const eligibleVotes = proposal.votes
    .filter((vote) => votingPlayerIds.has(vote.playerId))
    .map((vote) => ({ ...vote, vote: normalizeVoteValue(vote.vote) }));
  const voted = new Set(eligibleVotes.map((vote) => vote.playerId));
  const shouldBlankMissing = isProposalFinished(proposal, players, now);
  const automaticBlankVotes: GeotingVote[] = shouldBlankMissing
    ? votingPlayers
        .filter((player) => !voted.has(player.id))
        .map((player) => ({
          playerId: player.id,
          vote: "blankt",
          comment: "Automatisk blank stemme etter 24 timers tingfrist.",
          createdAt: proposal.voteEndsAt ?? now.toISOString(),
          automatic: true,
        }))
    : [];

  return [...eligibleVotes, ...automaticBlankVotes];
}

export function summarizeProposal(proposal: GeotingProposal, players: Player[], now = new Date()) {
  const voters = votingPlayers(players);
  const votes = effectiveVotes(proposal, players, now);
  const forVotes = votes.filter((vote) => vote.vote === "for").length;
  const againstVotes = votes.filter((vote) => vote.vote === "mot").length;
  const blankVotes = votes.filter((vote) => vote.vote === "blankt" || vote.vote === "avhold").length;
  const voted = new Set(votes.map((vote) => vote.playerId));
  const missingPlayers = voters.filter((player) => !voted.has(player.id));
  const automaticBlankPlayers = voters.filter((player) => {
    const vote = votes.find((candidate) => candidate.playerId === player.id);
    return vote?.automatic === true;
  });
  const archived = proposal.status === "archived";
  const started = Boolean(proposal.voteStartedAt);
  const finished = isProposalFinished(proposal, players, now);
  const required = requiredVotes(proposal, voters.length);
  const passed = !archived && finished && (proposal.ruleType === "grunnlov" ? forVotes === voters.length : forVotes >= required);
  const rejected = !archived && finished && !passed;
  const phase =
    archived
      ? "archived"
      : !started
        ? "proposal"
        : finished
          ? "resolved"
          : "voting";

  const label = archived
    ? "Trukket og arkivert"
    : !started
      ? "Venter på geo-ed"
      : finished
        ? passed
          ? "Vedtatt og protokollført"
          : "Forkastet og protokollført"
        : proposal.ruleType === "grunnlov"
          ? `Krever ${voters.length}/${voters.length}`
          : `Krever ${required} for-stemmer`;

  return {
    forVotes,
    againstVotes,
    blankVotes,
    abstentions: blankVotes,
    votes,
    missingPlayers,
    automaticBlankPlayers,
    required,
    passed,
    rejected,
    started,
    finished,
    phase,
    label,
    status: (
      archived ? "archived" : passed ? "passed" : rejected ? "rejected" : started ? "voting" : "open"
    ) as GeotingProposalStatus,
    resultText: archived ? "Trukket" : finished ? (passed ? "Vedtatt" : "Forkastet") : "Ikke avgjort",
  };
}

export function resolveProposalIfReady(
  proposal: GeotingProposal,
  players: Player[],
  now = new Date(),
): GeotingProposal {
  if (
    !proposal.voteStartedAt ||
    proposal.status === "passed" ||
    proposal.status === "rejected" ||
    proposal.status === "archived"
  ) {
    return proposal;
  }

  const summary = summarizeProposal(proposal, players, now);
  if (!summary.finished) {
    return {
      ...proposal,
      status: "voting",
    };
  }

  return {
    ...proposal,
    status: summary.passed ? "passed" : "rejected",
    resolvedAt: proposal.resolvedAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
    votes: summary.votes,
  };
}
