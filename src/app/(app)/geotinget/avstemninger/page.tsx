import { redirect } from "next/navigation";

import { GeotingProposalList } from "@/components/geoting-proposal-list";
import { GeotingSubnav } from "@/components/geoting-subnav";
import { GeotingVoteAlarm } from "@/components/geoting-vote-alarm";
import { Section } from "@/components/section";
import { getCurrentGeot } from "@/lib/auth";
import { geotiaGeotingLines, pickGeoticLine } from "@/lib/geotia-jargon";
import { getGeoticOrderRows, getOrderCapabilities } from "@/lib/geotisk-orden";
import { isLiveGeotingProposal, isResolvedGeotingProposal } from "@/lib/geoting";
import { computeStandings } from "@/lib/scoring";
import { getGeotingAccessState } from "@/lib/store";

export const metadata = {
  title: "Stemmeurnen",
};

export default async function GeotingVotesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string; sak?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [state, currentGeot] = await Promise.all([getGeotingAccessState(), getCurrentGeot()]);
  const standings = computeStandings(state.players, state.rounds);
  const orderRows = getGeoticOrderRows(
    state.players,
    standings,
    state.geoterIndexAdjustments,
    state.geoticOrderAssessments,
  );
  const rowByPlayerId = new Map(orderRows.map((row) => [row.player.id, row]));
  const votingPlayers = state.players.filter((player) => getOrderCapabilities(rowByPlayerId.get(player.id) ?? null).canVote);
  const tingvitner = state.players.filter((player) => !getOrderCapabilities(rowByPlayerId.get(player.id) ?? null).canVote);
  const currentCapabilities = getOrderCapabilities(currentGeot ? (rowByPlayerId.get(currentGeot.id) ?? null) : null);
  const proposals = state.geotingProposals;
  const requestedProposal = params.sak ? proposals.find((proposal) => proposal.id === params.sak) : null;
  if (requestedProposal && isResolvedGeotingProposal(requestedProposal)) {
    redirect(`/geotinget/pergamenter?status=avgjort&sak=${encodeURIComponent(requestedProposal.id)}`);
  }

  const liveProposals = proposals.filter(isLiveGeotingProposal);
  const activeVotingProposals = liveProposals.filter((proposal) => proposal.status === "voting");
  const activeVotes = activeVotingProposals.length;
  const geotingLine = pickGeoticLine(geotiaGeotingLines, `urnen:${currentGeot?.id ?? "ukjent"}:${activeVotes}`);

  return (
    <div className="space-y-6">
      <GeotingSubnav active="avstemninger" />

      <section className="geotia-frame rounded p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
          GeoTinget · Stemmeurne
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-normal text-[#062b40] sm:text-5xl">
          Stemmeurnen
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[#4f412b]">
          Åpne urner, geo-ed og stemmer ligger her. Tingvollen og
          Tingpergamentene er ett klikk unna i fanen under.
        </p>
      </section>

      <GeotingVoteStatus status={params.status} error={params.error} />

      <GeotingVoteAlarm proposals={activeVotingProposals} context="geotinget" />

      <div className="rounded border border-[#c49a3c]/35 bg-[#fdf7e8] px-4 py-3 text-sm font-semibold text-[#654517]">
        {geotingLine}
      </div>

      <Section title="Saker i Stemmeurnen" eyebrow="Forslag, geo-ed og stemmer">
        <GeotingProposalList
          currentCanSetPartyPosition={currentCapabilities.canSetPartyPosition}
          currentCanStartVote={currentCapabilities.canStartVote}
          currentCanVote={currentCapabilities.canVote}
          currentGeot={currentGeot}
          currentOrderSummary={currentCapabilities.lockedSummary}
          openProposalId={params.sak}
          players={state.players}
          proposals={liveProposals}
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
        Ordensporten stanset handlingen. Stemmerett åpner på nivå 4, og geo-eden kan først løftes på nivå 5.
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
