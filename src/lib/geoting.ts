import type { GeotingProposal, Player } from "@/lib/types";

export function summarizeProposal(proposal: GeotingProposal, players: Player[]) {
  const forVotes = proposal.votes.filter((vote) => vote.vote === "for").length;
  const againstVotes = proposal.votes.filter((vote) => vote.vote === "mot").length;
  const abstentions = proposal.votes.filter((vote) => vote.vote === "avhold").length;
  const voted = new Set(proposal.votes.map((vote) => vote.playerId));
  const missingPlayers = players.filter((player) => !voted.has(player.id));

  const required =
    proposal.ruleType === "grunnlov"
      ? players.length
      : proposal.ruleType === "mindre"
        ? 4
        : 4;
  const passed = proposal.ruleType === "grunnlov" ? forVotes === players.length : forVotes >= required;

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
        ? `Krever ${players.length}/${players.length}`
        : `Krever ${required} for-stemmer`,
  };
}
