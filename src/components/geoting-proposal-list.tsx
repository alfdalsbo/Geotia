import { BellRing, CheckCircle2, Clock, Gavel, Landmark, ScrollText, Vote, XCircle } from "lucide-react";

import { saveGeotingPartyPositionAction, startGeotingVoteAction, voteGeotingProposalAction } from "@/app/actions";
import { GeotingCountdown } from "@/components/geoting-countdown";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import {
  GEO_OATH_TEXT,
  getConstitutionChangeParts,
  getGeotingLifecycle,
  partyPositionLabels,
  summarizeProposal,
} from "@/lib/geoting";
import type { GeotingProposal, PartyPositionValue, Player, VoteValue } from "@/lib/types";
import { getProposalPartyMechanics, type ProposalPartyMechanic } from "@/lib/party-mechanics";
import { dateLabel, dateTimeLabel } from "@/lib/utils";

const ruleTypeLabels = {
  grunnlov: "GeoGrunnlovsendring",
  mindre: "Mindre lovendring",
  annet: "Annet tingvedtak",
};

const voteLabels: Record<VoteValue, string> = {
  for: "For",
  mot: "Mot",
  blankt: "Blankt",
  avhold: "Blankt",
};

export function GeotingProposalList({
  currentCanVote,
  currentGeot,
  players,
  proposals,
  tingvitner,
  votingPlayers,
}: {
  currentCanVote: boolean;
  currentGeot: Player | null;
  players: Player[];
  proposals: GeotingProposal[];
  tingvitner: Player[];
  votingPlayers: Player[];
}) {
  if (!proposals.length) {
    return (
      <div className="rounded border border-dashed border-[#c49a3c] bg-[#c49a3c]/10 p-5">
        <p className="font-display text-2xl font-semibold text-[#654517]">
          Tingvollen er tom.
        </p>
        <p className="mt-2 text-sm text-[#60553f]">
          Første forslag vil trolig skape unødvendig, men verdifull uro.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          currentCanVote={currentCanVote}
          currentGeot={currentGeot}
          proposal={proposal}
          tingvitner={tingvitner}
          votingPlayers={votingPlayers}
          players={players}
        />
      ))}
    </div>
  );
}

function ProposalCard({
  currentCanVote,
  currentGeot,
  players,
  proposal,
  tingvitner,
  votingPlayers,
}: {
  currentCanVote: boolean;
  currentGeot: Player | null;
  players: Player[];
  proposal: GeotingProposal;
  tingvitner: Player[];
  votingPlayers: Player[];
}) {
  const summary = summarizeProposal(proposal, players);
  const proposer = players.find((player) => player.id === proposal.proposedBy);
  const voteStarter = players.find((player) => player.id === proposal.voteStartedBy);
  const ownVote = proposal.votes.find((vote) => vote.playerId === currentGeot?.id);
  const resultTone = summary.finished ? (summary.passed ? "green" : "red") : summary.started ? "gold" : "blue";
  const lifecycle = getGeotingLifecycle(proposal, players);
  const constitutionChange = getConstitutionChangeParts(proposal.body);
  const partyMechanics = getProposalPartyMechanics(proposal, players);

  return (
    <article className="geotia-frame rounded">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
                {ruleTypeLabels[proposal.ruleType]} · {dateLabel(proposal.createdAt.slice(0, 10))}
              </p>
              <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">
                {proposal.title}
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-[#4f412b]">{proposal.body}</p>
              {proposal.ruleType === "grunnlov" ? (
                <ConstitutionChangePanel before={constitutionChange.before} after={constitutionChange.after} />
              ) : null}
              <p className="mt-3 flex items-center gap-2 text-sm text-[#60553f]">
                <Landmark className="h-4 w-4 text-[#b8892f]" aria-hidden="true" />
                Fremmet av {proposer?.shortName ?? "ukjent geot"} · {summary.label}
              </p>
            </div>
            <div className="grid w-full min-w-0 grid-cols-3 gap-2 text-center text-sm sm:min-w-[260px] lg:w-auto">
              <VoteBox label="For" value={summary.forVotes} tone="green" />
              <VoteBox label="Mot" value={summary.againstVotes} tone="red" />
              <VoteBox label="Blankt" value={summary.blankVotes} tone="gold" />
            </div>
          </div>

          <LifecycleSteps steps={lifecycle} />

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <StatusPanel proposal={proposal} resultTone={resultTone} summary={summary} voteStarter={voteStarter} />
            <VoteMap proposal={proposal} summary={summary} votingPlayers={votingPlayers} />
          </div>

          <PartyPositionMap proposal={proposal} votingPlayers={votingPlayers} />
          <PartyMechanicsBoard currentGeot={currentGeot} mechanics={partyMechanics} />

          {tingvitner.length ? (
            <p className="mt-3 rounded border border-[#c49a3c]/30 bg-[#fff7e6] px-3 py-2 text-sm text-[#60553f]">
              Tingvitne: {tingvitner.map((player) => player.shortName).join(", ")} følger saken fra benken.
            </p>
          ) : null}
        </div>

        <div className="border-t border-[#c49a3c]/35 bg-[#061d2b] p-4 text-[#fff7e6] xl:border-l xl:border-t-0">
          <PartyPositionPanel currentCanVote={currentCanVote} currentGeot={currentGeot} proposal={proposal} summary={summary} />
          <ActionPanel
            currentCanVote={currentCanVote}
            ownVote={ownVote?.vote}
            proposal={proposal}
            summary={summary}
          />
        </div>
      </div>
    </article>
  );
}

function ConstitutionChangePanel({ before, after }: { before: string; after: string }) {
  return (
    <div className="mt-3 grid gap-2 rounded border border-[#c49a3c]/35 bg-[#fff7e6] p-3 sm:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">Før</p>
        <p className="mt-1 text-sm leading-6 text-[#4f412b]">{before || "Ikke strukturert. Bruk gjerne 'Før:' i pergamentet."}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">Etter</p>
        <p className="mt-1 text-sm leading-6 text-[#4f412b]">{after || "Ikke strukturert. Bruk gjerne 'Etter:' i pergamentet."}</p>
      </div>
    </div>
  );
}

function LifecycleSteps({
  steps,
}: {
  steps: ReturnType<typeof getGeotingLifecycle>;
}) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {steps.map((step) => (
        <div
          key={step.id}
          className={
            step.state === "done"
              ? "rounded border border-[#285c45]/25 bg-[#285c45]/8 p-3 text-[#194832]"
              : step.state === "current"
                ? "rounded border border-[#c49a3c]/45 bg-[#fff7e6] p-3 text-[#654517]"
                : "rounded border border-[#d8ded0] bg-white/70 p-3 text-[#5b6257]"
          }
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em]">{step.label}</p>
          <p className="mt-1 text-xs leading-5">{step.detail}</p>
        </div>
      ))}
    </div>
  );
}

function StatusPanel({
  proposal,
  resultTone,
  summary,
  voteStarter,
}: {
  proposal: GeotingProposal;
  resultTone: "blue" | "green" | "red" | "gold";
  summary: ReturnType<typeof summarizeProposal>;
  voteStarter?: Player;
}) {
  const tones = {
    blue: "border-[#062b40]/30 bg-[#062b40]/10 text-[#062b40]",
    green: "border-[#194832]/30 bg-[#194832]/10 text-[#194832]",
    red: "border-[#7c2430]/30 bg-[#7c2430]/10 text-[#7c2430]",
    gold: "border-[#c49a3c]/45 bg-[#c49a3c]/14 text-[#654517]",
  };
  const Icon = summary.finished ? (summary.passed ? CheckCircle2 : XCircle) : summary.started ? Clock : ScrollText;

  return (
    <div className={`rounded border p-4 ${tones[resultTone]}`}>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {summary.started ? "Avstemningsstatus" : "Forslagsstatus"}
      </p>
      <p className="font-display mt-2 text-3xl font-semibold">{summary.resultText}</p>
      {summary.started ? (
        <div className="mt-3 space-y-1 text-sm leading-6">
          <p>Åpnet av {voteStarter?.shortName ?? "ukjent parti"}.</p>
          <p>Åpnet: {dateTimeLabel(proposal.voteStartedAt)}</p>
          <p>Frist: {dateTimeLabel(proposal.voteEndsAt)}</p>
          {!summary.finished ? (
            <div className="pt-2">
              <GeotingCountdown endsAt={proposal.voteEndsAt} title="GeoTingets levende ur" />
            </div>
          ) : null}
          {summary.finished ? (
            <p>Resultatet er synlig og protokollført i riksarkivet.</p>
          ) : (
            <p>Resultatet vises etter 24 timer, eller straks alle syv har stemt.</p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6">
          Saken ligger på tingbordet. Et parti må sverge geo-eden for å åpne urnen.
        </p>
      )}
    </div>
  );
}

function PartyPositionMap({
  proposal,
  votingPlayers,
}: {
  proposal: GeotingProposal;
  votingPlayers: Player[];
}) {
  const parties = [...new Map(votingPlayers.filter((player) => player.partyId).map((player) => [player.partyId, player])).values()];

  return (
    <div className="mt-4 rounded border border-[#c49a3c]/30 bg-[#fff7e6] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
        Partienes offisielle posisjoner
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {parties.map((player) => {
          const partyPosition = proposal.partyPositions?.find((position) => position.partyId === player.partyId);
          return (
            <div key={player.partyId} className="rounded border border-[#d8ded0] bg-white px-3 py-2 text-sm">
              <p className="font-semibold text-[#203c62]">{player.partyId.toUpperCase()}</p>
              <p className="mt-1 text-[#4f412b]">
                {partyPosition ? partyPositionLabels[partyPosition.position] : "Ikke ført"}
              </p>
              {partyPosition?.comment ? (
                <p className="mt-1 text-xs leading-5 text-[#60553f]">{partyPosition.comment}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PartyMechanicsBoard({
  currentGeot,
  mechanics,
}: {
  currentGeot: Player | null;
  mechanics: ProposalPartyMechanic[];
}) {
  const ownPartyId = currentGeot?.partyId;
  return (
    <div className="mt-4 rounded border border-[#d8ded0] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
        Partimekanikker i saken
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {mechanics.map((mechanic) => (
          <div
            key={mechanic.partyId}
            className={
              mechanic.partyId === ownPartyId
                ? "rounded border border-[#7c2430]/45 bg-[#7c2430]/10 px-3 py-2 text-sm text-[#4f1d24]"
                : mechanic.state === "available"
                  ? "rounded border border-[#194832]/30 bg-[#194832]/10 px-3 py-2 text-sm text-[#194832]"
                  : mechanic.state === "satisfied"
                    ? "rounded border border-[#203c62]/25 bg-[#203c62]/8 px-3 py-2 text-sm text-[#203c62]"
                    : "rounded border border-[#d8ded0] bg-[#f7f8f5] px-3 py-2 text-sm text-[#5b6257]"
            }
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">
              {mechanic.partyId.toUpperCase()} · {mechanic.stateLabel}
            </p>
            <p className="mt-1 font-semibold">{mechanic.title}</p>
            <p className="mt-1 text-xs leading-5">{mechanic.stateDetail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VoteMap({
  proposal,
  summary,
  votingPlayers,
}: {
  proposal: GeotingProposal;
  summary: ReturnType<typeof summarizeProposal>;
  votingPlayers: Player[];
}) {
  return (
    <div className="rounded border border-[#c49a3c]/30 bg-[#fff7e6] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
        Stemmekart
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {votingPlayers.map((player) => {
          const vote = summary.votes.find((candidate) => candidate.playerId === player.id);
          return (
            <div key={player.id} className="flex items-center justify-between rounded border border-[#d8ded0] bg-white px-3 py-2 text-sm">
              <span className="font-semibold text-[#203c62]">{player.shortName}</span>
              <span className={vote?.automatic ? "text-[#7c2430]" : "text-[#60553f]"}>
                {vote ? `${voteLabels[vote.vote]}${vote.automatic ? " (frist)" : ""}` : proposal.voteStartedAt ? "Ikke stemt" : "Venter"}
              </span>
            </div>
          );
        })}
      </div>
      {summary.missingPlayers.length ? (
        <p className="mt-3 text-sm text-[#7c2430]">
          Mangler: {summary.missingPlayers.map((player) => player.shortName).join(", ")}
        </p>
      ) : null}
      {summary.automaticBlankPlayers.length ? (
        <p className="mt-3 text-sm text-[#7c2430]">
          Automatisk blankt etter tingfrist: {summary.automaticBlankPlayers.map((player) => player.shortName).join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function PartyPositionPanel({
  currentCanVote,
  currentGeot,
  proposal,
  summary,
}: {
  currentCanVote: boolean;
  currentGeot: Player | null;
  proposal: GeotingProposal;
  summary: ReturnType<typeof summarizeProposal>;
}) {
  if (!currentCanVote || !currentGeot?.partyId || summary.finished || proposal.status === "archived") return null;

  const ownPosition = proposal.partyPositions?.find((position) => position.partyId === currentGeot.partyId);

  return (
    <form action={saveGeotingPartyPositionAction} className="mb-3 rounded border border-[#c49a3c]/45 bg-[#fff7e6]/10 p-4">
      <input type="hidden" name="proposalId" value={proposal.id} />
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e1c06c]">
        Partilinje · {currentGeot.partyId.toUpperCase()}
      </p>
      <select
        name="position"
        defaultValue={ownPosition?.position ?? "fri"}
        className="mt-3 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713] outline-none focus:border-[#e1c06c]"
      >
        {(["fri", "for", "mot", "blankt"] as PartyPositionValue[]).map((position) => (
          <option key={position} value={position}>{partyPositionLabels[position]}</option>
        ))}
      </select>
      <input
        name="comment"
        defaultValue={ownPosition?.comment ?? ""}
        className="mt-3 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713] outline-none focus:border-[#e1c06c]"
        placeholder="Kort partibegrunnelse"
      />
      <PendingSubmitButton
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-[#e1c06c] px-3 text-sm font-semibold text-[#062b40]"
      >
        <Landmark className="h-4 w-4" aria-hidden="true" />
        Før partilinje
      </PendingSubmitButton>
    </form>
  );
}

function ActionPanel({
  currentCanVote,
  ownVote,
  proposal,
  summary,
}: {
  currentCanVote: boolean;
  ownVote?: VoteValue;
  proposal: GeotingProposal;
  summary: ReturnType<typeof summarizeProposal>;
}) {
  if (!currentCanVote) {
    return (
      <div className="rounded border border-[#c49a3c]/45 bg-[#fff7e6]/10 p-4 text-sm leading-6 text-[#eadcbd]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e1c06c]">
          Tingvitnebenken
        </p>
        <p className="mt-2">
          Du kan lese, mumle og sende inn forslag. Geo-ed, stemmeurne og partistiftelse venter til ordensveien har gjort deg farlig nok.
        </p>
      </div>
    );
  }

  if (!summary.started) {
    return (
      <form action={startGeotingVoteAction} className="rounded border border-[#c49a3c]/45 bg-[#fff7e6]/10 p-4">
        <input type="hidden" name="proposalId" value={proposal.id} />
        <input type="hidden" name="oathText" value={GEO_OATH_TEXT} />
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#e1c06c]">
          <BellRing className="h-4 w-4" aria-hidden="true" />
          Start avstemning
        </p>
        <p className="mt-3 text-sm leading-6 text-[#eadcbd]">{GEO_OATH_TEXT}</p>
        <label className="mt-4 flex items-start gap-3 rounded border border-[#c49a3c]/35 bg-[#061d2b]/50 p-3 text-sm leading-6 text-[#fff7e6]">
          <input
            name="geoOath"
            type="checkbox"
            value="on"
            className="mt-1 h-4 w-4 accent-[#e1c06c]"
            required
          />
          <span>Jeg sverger geo-eden og varsler alle geoter umiddelbart.</span>
        </label>
        <PendingSubmitButton
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-[#7c2430] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#641923]"
        >
          <Gavel className="h-4 w-4" aria-hidden="true" />
          Åpne stemmeurnen
        </PendingSubmitButton>
      </form>
    );
  }

  if (summary.finished) {
    return (
      <div className="rounded border border-[#c49a3c]/45 bg-[#fff7e6]/10 p-4 text-sm leading-6 text-[#eadcbd]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e1c06c]">
          Riksarkivet
        </p>
        <p className="font-display mt-2 text-3xl font-semibold text-[#fff7e6]">{summary.resultText}</p>
        <p className="mt-2">
          Urnen er lukket. Saken er automatisk ført i riksarkivet med stemmer, blanke og eventuell taushet.
        </p>
      </div>
    );
  }

  return (
    <form action={voteGeotingProposalAction} className="rounded border border-[#c49a3c]/45 bg-[#fff7e6]/10 p-4">
      <input type="hidden" name="proposalId" value={proposal.id} />
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e1c06c]">
        Din stemme {ownVote ? `(${voteLabels[ownVote]})` : ""}
      </p>
      <select
        name="vote"
        defaultValue={ownVote && ownVote !== "avhold" ? ownVote : "for"}
        className="mt-3 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713] outline-none focus:border-[#e1c06c]"
      >
        <option value="for">For</option>
        <option value="mot">Mot</option>
        <option value="blankt">Blankt</option>
      </select>
      <input
        name="comment"
        className="mt-3 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713] outline-none focus:border-[#e1c06c]"
        placeholder="Kort stikk, om nødvendig"
      />
      <PendingSubmitButton
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-[#203c62] px-3 text-sm font-semibold text-white"
      >
        <Vote className="h-4 w-4" aria-hidden="true" />
        Avgi stemme
      </PendingSubmitButton>
    </form>
  );
}

function VoteBox({ label, value, tone }: { label: string; value: number; tone: "green" | "red" | "gold" }) {
  const tones = {
    green: "border-[#194832]/30 bg-[#194832]/10 text-[#194832]",
    red: "border-[#7c2430]/30 bg-[#7c2430]/10 text-[#7c2430]",
    gold: "border-[#c49a3c]/45 bg-[#c49a3c]/14 text-[#654517]",
  };

  return (
    <div className={`rounded border p-3 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</p>
      <p className="font-display mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}
