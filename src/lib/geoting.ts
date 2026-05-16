import type { GeotingProposal, Player } from "@/lib/types";

export function summarizeProposal(proposal: GeotingProposal, players: Player[]) {
  const votingPlayers = players.filter((player) => player.canVote !== false);
  const votingPlayerIds = new Set(votingPlayers.map((player) => player.id));
  const eligibleVotes = proposal.votes.filter((vote) => votingPlayerIds.has(vote.playerId));
  const forVotes = eligibleVotes.filter((vote) => vote.vote === "for").length;
  const againstVotes = eligibleVotes.filter((vote) => vote.vote === "mot").length;
  const abstentions = eligibleVotes.filter((vote) => vote.vote === "avhold").length;
  const voted = new Set(eligibleVotes.map((vote) => vote.playerId));
  const missingPlayers = votingPlayers.filter((player) => !voted.has(player.id));

  const required =
    proposal.ruleType === "grunnlov"
      ? votingPlayers.length
      : proposal.ruleType === "mindre"
        ? 4
        : 4;
  const passed = proposal.ruleType === "grunnlov" ? forVotes === votingPlayers.length : forVotes >= required;

  return {
    forVotes,
    againstVotes,
    abstentions,
    missingPlayers,
    required,
    passed,
    label: passed
      ? "Vedtatt av tinget"
      : proposal.ruleType === "grunnlov"
        ? `Krever ${votingPlayers.length}/${votingPlayers.length}`
        : `Krever ${required} for-stemmer`,
  };
}
