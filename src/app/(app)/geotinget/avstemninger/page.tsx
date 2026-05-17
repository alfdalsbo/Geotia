import { Vote } from "lucide-react";

import { GeotingProposalList } from "@/components/geoting-proposal-list";
import { GeotingSubnav } from "@/components/geoting-subnav";
import { GeotingVoteAlarm } from "@/components/geoting-vote-alarm";
import { Section, StatTile } from "@/components/section";
import { getCurrentGeot } from "@/lib/auth";
import { geotiaGeotingLines, pickGeoticLine } from "@/lib/geotia-jargon";
import { getGeotingState, resolveDueGeotingProposals } from "@/lib/store";

export const metadata = {
  title: "Stemmeurnen",
};

export default async function GeotingVotesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  await resolveDueGeotingProposals();
  const [state, currentGeot] = await Promise.all([getGeotingState(), getCurrentGeot()]);
  const votingPlayers = state.players.filter((player) => player.canVote !== false);
  const tingvitner = state.players.filter((player) => player.canVote === false);
  const currentCanVote = Boolean(currentGeot && currentGeot.canVote !== false);
  const voterIds = new Set(votingPlayers.map((player) => player.id));
  const proposals = state.geotingProposals;
  const activeVotingProposals = proposals.filter((proposal) => proposal.status === "voting");
  const activeVotes = activeVotingProposals.length;
  const awaitingOath = proposals.filter((proposal) => proposal.status === "open").length;
  const resolvedVotes = proposals.filter((proposal) => proposal.status === "passed" || proposal.status === "rejected").length;
  const votesCast = proposals.reduce(
    (sum, proposal) => sum + proposal.votes.filter((vote) => voterIds.has(vote.playerId)).length,
    0,
  );
  const geotingLine = pickGeoticLine(geotiaGeotingLines, `urnen:${currentGeot?.id ?? "ukjent"}:${activeVotes}`);

  return (
    <div className="space-y-6">
      <section className="geotia-frame geotia-agora rounded p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430] sm:tracking-[0.22em]">
          GeoTinget · stemmeurne · geo-ed
        </p>
        <h1 className="font-display mt-2 flex items-center gap-3 text-4xl font-semibold tracking-normal text-[#062b40] sm:text-5xl">
          <Vote className="h-9 w-9 text-[#7c2430]" aria-hidden="true" />
          Stemmeurnen
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-[#4f412b]">
          Her åpnes GeoTingets urne, stemmer føres, og levende tingfrister
          telles ned. Tingvollen holder nye forslag samlet, mens ferdige og
          trukne saker finnes i Tingpergamentene.
        </p>
      </section>

      <GeotingSubnav active="avstemninger" />

      <GeotingVoteStatus status={params.status} error={params.error} />

      <GeotingVoteAlarm proposals={activeVotingProposals} context="geotinget" />

      <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6] px-4 py-3 text-sm font-semibold text-[#654517]">
        {geotingLine}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Innlogget embete" value={currentGeot?.shortName ?? "-"} detail={currentGeot?.title} tone="blue" />
        <StatTile label="Venter på geo-ed" value={awaitingOath} detail="Kan åpnes av partiene" tone="gold" />
        <StatTile label="Åpne urner" value={activeVotes} detail="24 timers tingfrist" tone="red" />
        <StatTile label="Protokollført" value={resolvedVotes} detail={`${votesCast} stemmer ført`} tone="green" />
      </div>

      <Section title="Saker i Stemmeurnen" eyebrow="Forslag, geo-ed og stemmer">
        <GeotingProposalList
          currentCanVote={currentCanVote}
          currentGeot={currentGeot}
          players={state.players}
          proposals={proposals}
          tingvitner={tingvitner}
          votingPlayers={votingPlayers}
        />
      </Section>
    </div>
  );
}

function GeotingVoteStatus({ status, error }: { status?: string; error?: string }) {
  if (error === "tingvitne") {
    return (
      <div className="rounded border border-[#7c2430]/25 bg-[#7c2430]/10 px-4 py-3 text-sm font-medium text-[#7c2430]">
        Tingvitnet er notert, men stemmeurnen åpnes først etter ordensvei til nivå 7 og godkjent partistiftelse.
      </div>
    );
  }
  if (error === "geoed") {
    return (
      <div className="rounded border border-[#7c2430]/25 bg-[#7c2430]/10 px-4 py-3 text-sm font-medium text-[#7c2430]">
        Geo-eden mangler. Ingen får åpne stemmeurnen med tørre lepper.
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded border border-[#7c2430]/25 bg-[#7c2430]/10 px-4 py-3 text-sm font-medium text-[#7c2430]">
        {error}
      </div>
    );
  }
  if (!status) return null;

  const text =
    status === "stemt"
      ? "Stemmen er ført. Tingvollen dirrer svakt."
      : status === "partiposisjon"
        ? "Partiets offisielle posisjon er ført. Nå kan motstanderne tolke den i verste mening."
      : status === "avstemning"
        ? "Geo-eden er avlagt. Stemmeurnen er åpnet, og alle geoter skal varsles umiddelbart."
        : status === "avgjort"
          ? "Alle stemmer er inne. Embetsverket har lukket urnen og ført resultatet."
          : "Forslaget er mottatt. Kranglingen kan begynne.";

  return (
    <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
      {text}
    </div>
  );
}
