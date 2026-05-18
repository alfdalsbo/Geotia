import { FileText, Gavel, ScrollText, ShieldCheck } from "lucide-react";

import { updateGeotingProposalAction, withdrawGeotingProposalAction } from "@/app/actions";
import { GeotingSubnav } from "@/components/geoting-subnav";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Section } from "@/components/section";
import { Stamp, type StampTone } from "@/components/ui/stamp";
import { getCurrentGeot } from "@/lib/auth";
import { getGeotingLifecycle, geotingImplementationLabels, partyPositionLabels, summarizeProposal } from "@/lib/geoting";
import { isThirdCollegeMember } from "@/lib/kollegium";
import { archive } from "@/lib/seed";
import { getGeotingState, resolveDueGeotingProposals } from "@/lib/store";
import type { GeotingProposal, Player } from "@/lib/types";
import { dateTimeLabel } from "@/lib/utils";

export const metadata = {
  title: "Tingpergamentene",
};

const proposalRuleLabels = {
  grunnlov: "GeoGrunnlovsendring",
  mindre: "Mindre lovendring",
  annet: "Annet tingvedtak",
};

const proposalStatusLabels = {
  open: "Venter på geo-ed",
  voting: "I avstemning",
  passed: "Vedtatt",
  rejected: "Forkastet",
  archived: "Trukket",
};

const proposalStatusStamp: Record<keyof typeof proposalStatusLabels, { tone: StampTone; label: string }> = {
  open: { tone: "alarm", label: "VENTER GEO-ED" },
  voting: { tone: "alarm", label: "ÅPEN URNE" },
  passed: { tone: "signal", label: "VEDTATT" },
  rejected: { tone: "navy", label: "FORKASTET" },
  archived: { tone: "navy", label: "TRUKKET" },
};

export default async function GeotingPergamentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  await resolveDueGeotingProposals();
  const [state, currentGeot] = await Promise.all([getGeotingState(), getCurrentGeot()]);
  const canEdit = isThirdCollegeMember(currentGeot?.id);
  const proposals = [...state.geotingProposals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const resolvedCount = proposals.filter((proposal) => proposal.status === "passed" || proposal.status === "rejected").length;
  const activeCount = proposals.filter((proposal) => proposal.status === "open" || proposal.status === "voting").length;

  return (
    <div className="space-y-6">
      <section className="geotia-frame rounded p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
          GeoTinget · Arkiv
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-normal text-[#062b40] sm:text-5xl">
          Tingpergamentene
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[#4f412b]">
          Innsendte saker, vedtak og gamle grunnpergamenter. {proposals.length}
          {" "}levende pergamenter, {activeCount} åpne og {resolvedCount} avgjort.
        </p>
      </section>

      <GeotingSubnav active="pergamenter" />

      <PergamentStatus status={params.status} error={params.error} />

      <Section
        title="Levende tingpergamenter"
        eyebrow={canEdit ? "Kollegiet kan rette blekket" : "Offentlig lesesal"}
        action={
          canEdit ? (
            <span className="inline-flex h-10 items-center gap-2 rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Tredje Kollegium
            </span>
          ) : null
        }
      >
        {proposals.length ? (
          <div className="grid gap-4">
            {proposals.map((proposal) => (
              <PergamentCard
                key={proposal.id}
                canEdit={canEdit}
                players={state.players}
                proposal={proposal}
              />
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed border-[#c49a3c] bg-[#c49a3c]/10 p-5 text-sm leading-6 text-[#60553f]">
            Ingen nye tingpergamenter er ført ennå.
          </div>
        )}
      </Section>

      <Section title="Grunnpergamentene" eyebrow="Historisk GeoTing-protokoll">
        <div className="grid gap-3 lg:grid-cols-2">
          {archive.geotingCases.map((item) => (
            <article key={`${item.date}-${item.caseName}`} className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
                {item.date} · {item.caseNumber ?? "Sak uten nummer"}
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-[#062b40]">
                {item.caseName}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#273125]">{item.proposal}</p>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <PergamentFact label="Fremmet av" value={item.proposedBy} />
                <PergamentFact label="Vedtak" value={item.decision} />
                <PergamentFact label="Stemmer" value={item.votes} />
                <PergamentFact label="Status" value={item.status} />
              </dl>
              {item.comment ? (
                <p className="mt-3 rounded border border-[#c49a3c]/30 bg-[#fff7e6] px-3 py-2 text-sm leading-6 text-[#4f412b]">
                  {item.comment}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </Section>
    </div>
  );
}

function PergamentStatus({ status, error }: { status?: string; error?: string }) {
  if (error) {
    return (
      <div className="rounded border border-[#7c2430]/25 bg-[#7c2430]/10 px-4 py-3 text-sm font-medium text-[#7c2430]">
        {error}
      </div>
    );
  }
  if (status === "geoting-redigert") {
    return (
      <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
        Pergamentet er rettet av Tredje Kollegium.
      </div>
    );
  }
  if (status === "geoting-trukket") {
    return (
      <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
        Pergamentet er trukket og lagt i lukket arkiv.
      </div>
    );
  }
  return null;
}

function PergamentCard({
  canEdit,
  players,
  proposal,
}: {
  canEdit: boolean;
  players: Player[];
  proposal: GeotingProposal;
}) {
  const summary = summarizeProposal(proposal, players);
  const lifecycle = getGeotingLifecycle(proposal, players);
  const proposer = players.find((player) => player.id === proposal.proposedBy);
  const starter = players.find((player) => player.id === proposal.voteStartedBy);
  const canWithdraw = proposal.status === "open" || proposal.status === "voting";
  const implementationStatus = proposal.implementationStatus ?? "pending";

  return (
    <article className="rounded border border-[#d8c48c] bg-[#fff7e6] p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
            {proposalStatusLabels[proposal.status]} · {dateTimeLabel(proposal.createdAt)}
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">
            {proposal.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#4f412b]">{proposal.body}</p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <Stamp tone={proposalStatusStamp[proposal.status].tone}>
            {proposalStatusStamp[proposal.status].label}
          </Stamp>
          <Stamp tone="brass">{proposalRuleLabels[proposal.ruleType]}</Stamp>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <PergamentFact label="Fremmet av" value={proposer?.shortName ?? "Ukjent geot"} />
        <PergamentFact label="Urne åpnet av" value={starter?.shortName ?? "Ikke åpnet"} />
        <PergamentFact label="Tingfrist" value={dateTimeLabel(proposal.voteEndsAt)} />
        <PergamentFact label="Vedtak" value={summary.label} />
        <PergamentFact label="Etterliv" value={geotingImplementationLabels[implementationStatus]} />
      </dl>

      {proposal.implementationNote ? (
        <p className="mt-3 rounded border border-[#c49a3c]/30 bg-white/72 px-3 py-2 text-sm leading-6 text-[#4f412b]">
          {proposal.implementationNote}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {lifecycle.map((step) => (
          <div
            key={step.id}
            className={
              step.state === "done"
                ? "rounded border border-[#285c45]/25 bg-[#285c45]/8 p-3 text-[#194832]"
                : step.state === "current"
                  ? "rounded border border-[#c49a3c]/45 bg-white p-3 text-[#654517]"
                  : "rounded border border-[#d8ded0] bg-white/70 p-3 text-[#5b6257]"
            }
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">{step.label}</p>
            <p className="mt-1 text-xs leading-5">{step.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <VoteMeasure label="For" value={summary.forVotes} tone="green" />
        <VoteMeasure label="Mot" value={summary.againstVotes} tone="red" />
        <VoteMeasure label="Blankt" value={summary.blankVotes} tone="gold" />
      </div>

      {proposal.partyPositions?.length ? (
        <div className="mt-4 rounded border border-[#c49a3c]/30 bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">Partilinjer</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {proposal.partyPositions.map((position) => (
              <div key={position.partyId} className="rounded border border-[#d8ded0] bg-white px-3 py-2 text-sm">
                <p className="font-semibold text-[#203c62]">{position.partyId.toUpperCase()} · {partyPositionLabels[position.position]}</p>
                {position.comment ? <p className="mt-1 text-xs leading-5 text-[#60553f]">{position.comment}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {canEdit ? (
        <div className="mt-4 rounded border border-[#c49a3c]/45 bg-white/72 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
            <ScrollText className="h-4 w-4" aria-hidden="true" />
            Kollegiets redigering
          </p>
          <form action={updateGeotingProposalAction} className="mt-3 grid gap-3 lg:grid-cols-[1fr_230px]">
            <input type="hidden" name="proposalId" value={proposal.id} />
            <input type="hidden" name="returnTo" value="/geotinget/pergamenter" />
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#273125]">Tittel</span>
              <input
                name="title"
                defaultValue={proposal.title}
                className="h-10 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#273125]">Sakstype</span>
              <select
                name="ruleType"
                defaultValue={proposal.ruleType}
                className="h-10 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
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
                defaultValue={proposal.body}
                className="min-h-28 w-full rounded border border-[#d8ded0] bg-white px-3 py-2 outline-none focus:border-[#203c62]"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#273125]">Ettervedtak</span>
              <select
                name="implementationStatus"
                defaultValue={implementationStatus}
                className="h-10 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
              >
                <option value="pending">Venter</option>
                <option value="implemented">Implementert</option>
                <option value="ignored">Ignorert</option>
              </select>
            </label>
            <label className="space-y-2 lg:col-span-2">
              <span className="text-sm font-semibold text-[#273125]">Ettervedtaksnotat</span>
              <input
                name="implementationNote"
                defaultValue={proposal.implementationNote ?? ""}
                className="h-10 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
                placeholder="Kort notat om saken faktisk ble iverksatt, sovnet eller ble ignorert."
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row lg:col-span-2">
              <PendingSubmitButton
                className="inline-flex h-10 items-center justify-center gap-2 rounded bg-[#203c62] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172d4b]"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Lagre pergament
              </PendingSubmitButton>
            </div>
          </form>
          {canWithdraw ? (
            <form action={withdrawGeotingProposalAction} className="mt-2">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="returnTo" value="/geotinget/pergamenter" />
              <PendingSubmitButton
                className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[#7c2430]/45 bg-[#7c2430]/10 px-3 text-sm font-semibold text-[#7c2430] transition hover:bg-[#7c2430]/15"
              >
                <Gavel className="h-4 w-4" aria-hidden="true" />
                Trekk pergament
              </PendingSubmitButton>
            </form>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function PergamentFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#c49a3c]/30 bg-white px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7c2430]">{label}</dt>
      <dd className="mt-1 leading-6 text-[#4f412b]">{value}</dd>
    </div>
  );
}

function VoteMeasure({ label, value, tone }: { label: string; value: number; tone: "green" | "red" | "gold" }) {
  const tones = {
    green: "border-[#194832]/30 bg-[#194832]/10 text-[#194832]",
    red: "border-[#7c2430]/30 bg-[#7c2430]/10 text-[#7c2430]",
    gold: "border-[#c49a3c]/45 bg-[#c49a3c]/14 text-[#654517]",
  };

  return (
    <div className={`rounded border px-3 py-2 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em]">{label}</p>
      <p className="font-display mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}
