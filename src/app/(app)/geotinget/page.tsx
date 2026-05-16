import { Gavel, Landmark, Vote } from "lucide-react";

import { submitGeotingProposalAction, voteGeotingProposalAction } from "@/app/actions";
import { Section, StatTile } from "@/components/section";
import { getCurrentGeot } from "@/lib/auth";
import { summarizeProposal } from "@/lib/geoting";
import { getAppState } from "@/lib/store";
import { dateLabel } from "@/lib/utils";

export const metadata = {
  title: "GeoTinget",
};

const ruleTypeLabels = {
  grunnlov: "GeoGrunnlovsendring",
  mindre: "Mindre lovendring",
  annet: "Annet tingvedtak",
};

const voteLabels = {
  for: "For",
  mot: "Mot",
  avhold: "Avhold",
};

export default async function GeotingPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const state = await getAppState();
  const currentGeot = await getCurrentGeot();
  const proposals = state.geotingProposals;
  const openProposals = proposals.filter((proposal) => proposal.status === "open").length;
  const votesCast = proposals.reduce((sum, proposal) => sum + proposal.votes.length, 0);

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
          Her møtes partiene for å avgjøre Geotias fremtid, slipe reglene mot
          hverandre og føre uenighet inn i former som nesten ser siviliserte ut.
          Hver geot stemmer individuelt, og ingen kan gjemme seg bak tåke, drue
          eller komite.
        </p>
      </section>

      {params.status ? (
        <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
          {params.status === "stemt"
            ? "Stemmen er ført. Tingvollen dirrer svakt."
            : "Forslaget er mottatt. Kranglingen kan begynne."}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <StatTile label="Innlogget geot" value={currentGeot?.shortName ?? "-"} detail={currentGeot?.title} tone="blue" />
        <StatTile label="Åpne saker" value={openProposals} detail="Til behandling" tone="gold" />
        <StatTile label="Avgitte stemmer" value={votesCast} detail="Individuell protokoll" tone="green" />
      </div>

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

      <Section title="Tingets saker" eyebrow="Forslag, stemmer og uro">
        {proposals.length ? (
          <div className="space-y-4">
            {proposals.map((proposal) => {
              const summary = summarizeProposal(proposal, state.players);
              const proposer = state.players.find((player) => player.id === proposal.proposedBy);
              const ownVote = proposal.votes.find((vote) => vote.playerId === currentGeot?.id);
              return (
                <article key={proposal.id} className="rounded border border-[#d8ded0] bg-white p-4">
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
                      <VoteBox label="Avhold" value={summary.abstentions} tone="gold" />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_360px]">
                    <div className="rounded border border-[#c49a3c]/30 bg-[#fff7e6] p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
                        Stemmekart
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {state.players.map((player) => {
                          const vote = proposal.votes.find((candidate) => candidate.playerId === player.id);
                          return (
                            <div key={player.id} className="flex items-center justify-between rounded border border-[#d8ded0] bg-white px-3 py-2 text-sm">
                              <span className="font-semibold text-[#203c62]">{player.shortName}</span>
                              <span className="text-[#60553f]">{vote ? voteLabels[vote.vote] : "Ikke stemt"}</span>
                            </div>
                          );
                        })}
                      </div>
                      {summary.missingPlayers.length ? (
                        <p className="mt-3 text-sm text-[#7c2430]">
                          Mangler: {summary.missingPlayers.map((player) => player.shortName).join(", ")}
                        </p>
                      ) : null}
                    </div>

                    <form action={voteGeotingProposalAction} className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-3">
                      <input type="hidden" name="proposalId" value={proposal.id} />
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
                        Din stemme {ownVote ? `(${voteLabels[ownVote.vote]})` : ""}
                      </p>
                      <select
                        name="vote"
                        defaultValue={ownVote?.vote ?? "for"}
                        className="mt-3 h-10 w-full rounded border border-[#d8ded0] bg-white px-2 outline-none focus:border-[#203c62]"
                      >
                        <option value="for">For</option>
                        <option value="mot">Mot</option>
                        <option value="avhold">Avhold</option>
                      </select>
                      <input
                        name="comment"
                        defaultValue={ownVote?.comment ?? ""}
                        className="mt-3 h-10 w-full rounded border border-[#d8ded0] bg-white px-2 outline-none focus:border-[#203c62]"
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
                  </div>
                </article>
              );
            })}
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
