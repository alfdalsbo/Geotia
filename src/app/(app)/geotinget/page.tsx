import { BellRing, CheckCircle2, Clock, Gavel, Landmark, ScrollText, Vote, XCircle } from "lucide-react";

import { startGeotingVoteAction, submitGeotingProposalAction, voteGeotingProposalAction } from "@/app/actions";
import { Section, StatTile } from "@/components/section";
import { getCurrentGeot } from "@/lib/auth";
import { GEO_OATH_TEXT, summarizeProposal } from "@/lib/geoting";
import { getAppState } from "@/lib/store";
import type { GeotingProposal, Player, VoteValue } from "@/lib/types";
import { dateLabel, dateTimeLabel } from "@/lib/utils";

export const metadata = {
  title: "GeoTinget",
};

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

export default async function GeotingPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const state = await getAppState();
  const currentGeot = await getCurrentGeot();
  const votingPlayers = state.players.filter((player) => player.canVote !== false);
  const tingvitner = state.players.filter((player) => player.canVote === false);
  const currentCanVote = Boolean(currentGeot && currentGeot.canVote !== false);
  const voterIds = new Set(votingPlayers.map((player) => player.id));
  const proposals = state.geotingProposals;
  const activeVotes = proposals.filter((proposal) => proposal.status === "voting").length;
  const awaitingOath = proposals.filter((proposal) => proposal.status === "open").length;
  const resolvedVotes = proposals.filter((proposal) => proposal.status === "passed" || proposal.status === "rejected").length;
  const votesCast = proposals.reduce(
    (sum, proposal) => sum + proposal.votes.filter((vote) => voterIds.has(vote.playerId)).length,
    0,
  );

  return (
    <div className="space-y-7">
      <section className="geotia-frame geotia-agora rounded p-5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
          GeoTinget · tingvoll · agora · kranglekammer
        </p>
        <h1 className="font-display mt-2 text-5xl font-semibold tracking-normal text-[#062b40]">
          GeoTinget
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-[#4f412b]">
          Her møtes partiene for å avgjøre Geotias fremtid. Forslag kan sendes
          inn fra tingvollen, men avstemning åpnes først når et parti sverger
          geo-eden og varsler alle geoter. Derfra har riket 24 timer, med mindre
          alle syv stemmer før fristen.
        </p>
      </section>

      <GeotingStatus status={params.status} error={params.error} />

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Innlogget embete" value={currentGeot?.shortName ?? "-"} detail={currentGeot?.title} tone="blue" />
        <StatTile label="Venter på geo-ed" value={awaitingOath} detail="Forslag til tinget" tone="gold" />
        <StatTile label="Avstemninger" value={activeVotes} detail="24 timers tingfrist" tone="red" />
        <StatTile label="Protokollført" value={resolvedVotes} detail={`${votesCast} stemmer ført`} tone="green" />
      </div>

      {currentGeot?.role === "tingvitne" ? (
        <div className="rounded border border-[#c49a3c]/45 bg-[#fff7e6] p-4 text-sm leading-6 text-[#4f412b]">
          <strong className="text-[#062b40]">Tingvitneprotokoll:</strong> Danny har
          forslagsrett og kan sende saker til tingvollen, men har ikke stemmerett
          og kan ikke åpne avstemning før eget parti er stiftet.
        </div>
      ) : null}

      <Section title="Send inn forslag" eyebrow="Innkomne saker">
        <form action={submitGeotingProposalAction} className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#273125]">Tittel</span>
            <input
              name="title"
              className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
              placeholder="F.eks. Lov om obligatorisk India-varsling"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#273125]">Sakstype</span>
            <select
              name="ruleType"
              className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
              defaultValue="annet"
            >
              <option value="grunnlov">GeoGrunnlovsendring</option>
              <option value="mindre">Mindre lovendring</option>
              <option value="annet">Annet tingvedtak</option>
            </select>
          </label>
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold text-[#273125]">Forslag / innhold</span>
            <textarea
              name="body"
              className="min-h-32 w-full rounded border border-[#d8ded0] bg-white px-3 py-2 outline-none focus:border-[#203c62]"
              placeholder="Skriv forslaget slik at også motstanderne forstår hva de skal krangle med."
              required
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#7c2430] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#641923] lg:col-span-2 lg:w-fit"
          >
            <Gavel className="h-4 w-4" aria-hidden="true" />
            Send til GeoTinget
          </button>
        </form>
      </Section>

      <Section title="Tingets avstemningssal" eyebrow="Forslag, geo-ed og protokoll">
        {proposals.length ? (
          <div className="space-y-5">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                currentCanVote={currentCanVote}
                currentGeot={currentGeot}
                proposal={proposal}
                tingvitner={tingvitner}
                votingPlayers={votingPlayers}
                players={state.players}
              />
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed border-[#c49a3c] bg-[#c49a3c]/10 p-5">
            <p className="font-display text-2xl font-semibold text-[#654517]">
              Tingvollen er tom.
            </p>
            <p className="mt-2 text-sm text-[#60553f]">
              Første forslag vil trolig skape unødvendig, men verdifull uro.
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}

function GeotingStatus({ status, error }: { status?: string; error?: string }) {
  if (error === "tingvitne") {
    return (
      <div className="rounded border border-[#7c2430]/25 bg-[#7c2430]/10 px-4 py-3 text-sm font-medium text-[#7c2430]">
        Tingvitnet er notert, men stemmeurnen åpnes først når Danny har stiftet parti.
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
              <p className="mt-3 flex items-center gap-2 text-sm text-[#60553f]">
                <Landmark className="h-4 w-4 text-[#b8892f]" aria-hidden="true" />
                Fremmet av {proposer?.shortName ?? "ukjent geot"} · {summary.label}
              </p>
            </div>
            <div className="grid min-w-[260px] grid-cols-3 gap-2 text-center text-sm">
              <VoteBox label="For" value={summary.forVotes} tone="green" />
              <VoteBox label="Mot" value={summary.againstVotes} tone="red" />
              <VoteBox label="Blankt" value={summary.blankVotes} tone="gold" />
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <StatusPanel proposal={proposal} resultTone={resultTone} summary={summary} voteStarter={voteStarter} />
            <VoteMap proposal={proposal} summary={summary} votingPlayers={votingPlayers} />
          </div>

          {tingvitner.length ? (
            <p className="mt-3 rounded border border-[#c49a3c]/30 bg-[#fff7e6] px-3 py-2 text-sm text-[#60553f]">
              Tingvitne: {tingvitner.map((player) => player.shortName).join(", ")} følger saken fra benken.
            </p>
          ) : null}
        </div>

        <div className="border-t border-[#c49a3c]/35 bg-[#061d2b] p-4 text-[#fff7e6] xl:border-l xl:border-t-0">
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
          Du kan lese, mumle og sende inn forslag. Geo-ed og stemmeurne er reservert for partiene.
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
        <button
          type="submit"
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-[#7c2430] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#641923]"
        >
          <Gavel className="h-4 w-4" aria-hidden="true" />
          Åpne stemmeurnen
        </button>
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
      <button
        type="submit"
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-[#203c62] px-3 text-sm font-semibold text-white"
      >
        <Vote className="h-4 w-4" aria-hidden="true" />
        Avgi stemme
      </button>
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
