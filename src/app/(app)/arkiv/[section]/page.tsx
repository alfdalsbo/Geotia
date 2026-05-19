import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ExpandableImage } from "@/components/expandable-image";
import { GeoGuessrTipLibrary } from "@/components/geo-guessr-tip-library";
import { Section } from "@/components/section";
import { SarajevoVideo } from "@/components/sarajevo-video";
import { archiveSources, getArchiveSection } from "@/lib/archive";
import { getGeoGuessrTipCategories, getGeoGuessrTips } from "@/lib/geoguessr-tips";
import { getGeotingLifecycle, geotingImplementationLabels, partyPositionLabels, summarizeProposal } from "@/lib/geoting";
import { getPartyMechanic } from "@/lib/party-mechanics";
import { getAppState } from "@/lib/store";
import type { GeotingProposal, Player } from "@/lib/types";
import { dateTimeLabel, formatKm, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Arkiv",
};

export default async function ArchiveSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: slug } = await params;
  const section = getArchiveSection(slug);
  if (!section) notFound();
  const state = slug === "geotinget" ? await getAppState() : null;

  return (
    <div className="space-y-6">
      <div className="geotia-frame flex flex-col gap-4 rounded p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
            {section.eyebrow}
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-normal text-[#062b40] sm:text-5xl">
            {section.title}
          </h1>
          <p className="mt-3 max-w-3xl text-[#60553f]">{section.description}</p>
        </div>
        <Link
          href="/arkiv"
          className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[#062b40]/30 bg-[#fdf7e8] px-3 text-sm font-semibold text-[#062b40]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Oppslagsverk
        </Link>
      </div>

      <ArchiveBody
        dynamicGeotingProposals={state?.geotingProposals ?? []}
        livePlayers={state?.players}
        slug={slug}
      />
    </div>
  );
}

function ArchiveBody({
  dynamicGeotingProposals,
  livePlayers,
  slug,
}: {
  dynamicGeotingProposals: GeotingProposal[];
  livePlayers?: Player[];
  slug: string;
}) {
  const { archive, players, parties } = archiveSources;

  if (slug === "kanon") {
    return (
      <div className="space-y-4">
        {archive.canon.map((item) => (
          <Section key={item.title} title={item.title} eyebrow={item.eyebrow}>
            <div className="space-y-2 text-sm leading-6 text-[#273125]">
              {item.body.map((line) => (
                <p key={line} className="rounded border border-[#eef1eb] bg-[#f7f8f5] px-3 py-2">
                  {line}
                </p>
              ))}
            </div>
          </Section>
        ))}
      </div>
    );
  }

  if (slug === "grunnloven") {
    return (
      <div className="space-y-4">
        {archive.constitution.map((section) => (
          <Section key={section.paragraph} title={`${section.paragraph} ${section.title}`} eyebrow="Lovtekst">
            <ul className="space-y-2 text-sm leading-6 text-[#273125]">
              {section.body.map((line) => (
                <li key={line} className="rounded border border-[#eef1eb] bg-[#f7f8f5] px-3 py-2">
                  {line}
                </li>
              ))}
            </ul>
          </Section>
        ))}
        <Section title="GeoKodeksen" eyebrow="Moralsk protokoll">
          <ul className="space-y-2 text-sm leading-6 text-[#273125]">
            {archive.code.map((line) => (
              <li key={line} className="rounded border border-[#eef1eb] bg-white px-3 py-2">
                {line}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    );
  }

  if (slug === "leksikon") {
    const groups = archive.lexicon.reduce<Map<string, typeof archive.lexicon>>((acc, entry) => {
      const existing = acc.get(entry.category) ?? [];
      existing.push(entry);
      acc.set(entry.category, existing);
      return acc;
    }, new Map());
    return (
      <div className="space-y-6">
        {[...groups.entries()].map(([category, entries]) => (
          <Section key={category} title={category} eyebrow="GeoLeksikon">
            <div className="grid gap-3 md:grid-cols-2">
              {entries.map((entry) => (
                <article key={entry.term} className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-4">
                  <h2 className="text-lg font-semibold text-[#203c62]">{entry.term}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#273125]">{entry.definition}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8e3030]">
                    {entry.origin}
                  </p>
                  <p className="mt-1 text-sm italic text-[#5b6257]">{entry.example}</p>
                  <p className="mt-2 text-sm text-[#5b6257]">{entry.comment}</p>
                </article>
              ))}
            </div>
          </Section>
        ))}
      </div>
    );
  }

  if (slug === "kjennelaere") {
    const geoGuessrTips = getGeoGuessrTips();
    const geoGuessrTipCategories = getGeoGuessrTipCategories();

    return (
      <div className="space-y-6">
        {archive.knowledgeGroups.map((group) => (
          <Section key={group.title} title={group.title} eyebrow="GeoHeuristikk">
            <p className="mb-4 text-sm leading-6 text-[#60553f]">{group.description}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {group.items.map((item) => (
                <div key={item} className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-4 text-sm leading-6 text-[#273125]">
                  {item}
                </div>
              ))}
            </div>
          </Section>
        ))}
        <GeoGuessrTipLibrary tips={geoGuessrTips} categories={geoGuessrTipCategories} />
      </div>
    );
  }

  if (slug === "geoter") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {players.map((player) => {
          const party = parties.find((candidate) => candidate.id === player.partyId);
          return (
            <article key={player.id} className="rounded border border-[#d8ded0] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="mt-1 h-14 w-2 rounded-full" style={{ background: player.color }} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8e3030]">
                    {party?.id.toUpperCase() ?? "TINGVITNE"}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#203c62]">{player.shortName}</h2>
                  <p className="text-sm text-[#5b6257]">{player.title}</p>
                </div>
              </div>
              <dl className="mt-5 grid gap-3 text-sm">
                <ArchiveFact label="Parti" value={party?.name ?? "Ikke stiftet ennå"} />
                <ArchiveFact label="Spesialfelt" value={player.specialty} />
                <ArchiveFact label="Styrker" value={player.strengths} />
                <ArchiveFact label="Svakheter" value={player.weaknesses} />
                <ArchiveFact label="Legendarisk øyeblikk" value={player.moment} />
                <ArchiveFact label="Internt kjennetegn" value={player.mark} />
              </dl>
            </article>
          );
        })}
      </div>
    );
  }

  if (slug === "partier") {
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        {parties.map((party) => {
          const mechanic = getPartyMechanic(party.id);
          return (
            <article
              id={party.id}
              key={party.id}
              className="geotia-frame scroll-mt-24 rounded"
            >
            <div className="grid gap-0">
              {party.asset ? (
                <ExpandableImage
                  src={party.asset}
                  alt={`Partikort for ${party.name}`}
                  loading="eager"
                  sizes="(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw"
                  className="relative aspect-[4/5] w-full bg-[#061d2b]"
                  imageClassName="object-contain"
                  caption={`Partikort for ${party.name}`}
                />
              ) : (
                <div className="relative aspect-[4/5] bg-[#061d2b]" />
              )}
              <div className="min-w-0 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c2430]">
                  {party.id.toUpperCase()} · {party.ideology}
                </p>
                <h2 className="font-display mt-1 break-words text-2xl font-semibold text-[#062b40] [overflow-wrap:anywhere] sm:text-3xl">
                  {party.name}
                </h2>
                <p className="mt-3 rounded border border-[#c49a3c]/35 bg-[#fdf7e8] px-3 py-2 text-sm italic leading-6 text-[#4f412b]">
                  &ldquo;{party.motto}&rdquo;
                </p>
                <dl className="mt-5 grid gap-3 text-sm">
                  <ArchiveFact label="Leder" value={party.leader} />
                  <ArchiveFact label="Ideologi" value={party.ideology} />
                  <ArchiveFact label="Hovedsak" value={party.agenda} />
                  <ArchiveFact label="Allianser" value={party.allies} />
                  <ArchiveFact label="Motstandere" value={party.rivals} />
                  <ArchiveFact label="Kommentar" value={party.comment} />
                </dl>
                {mechanic ? (
                  <div className="mt-5 rounded border border-[#c49a3c]/35 bg-[#fdf7e8] p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
                      Partimekanikk
                    </h3>
                    <p className="font-display mt-2 text-2xl font-semibold text-[#062b40]">{mechanic.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#4f412b]">{mechanic.effect}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#60553f]">
                      {mechanic.trigger}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#60553f]">{mechanic.limit}</p>
                  </div>
                ) : null}
                {party.manifesto?.length ? (
                  <div className="mt-5 rounded border border-[#d8ded0] bg-[#f7f8f5] p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
                      Manifest
                    </h3>
                    <div className="mt-3 space-y-3 text-sm leading-6 text-[#273125]">
                      {party.manifesto.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
                {party.doctrine?.length ? (
                  <div className="mt-4 rounded border border-[#c49a3c]/35 bg-[#fdf7e8] p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
                      Doktrine
                    </h3>
                    <div className="mt-3 space-y-3 text-sm leading-6 text-[#4f412b]">
                      {party.doctrine.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            </article>
          );
        })}
      </div>
    );
  }

  if (slug === "merkedager") {
    return (
      <div className="space-y-6">
        <SarajevoVideo />
        <Section title="Historisk tidslinje" eyebrow="Fra kalender til myte">
          <div className="relative grid gap-3">
            {archive.calendar.map((event) => (
              <article key={`${event.date}-${event.name}-timeline`} className="grid gap-3 rounded border border-[#d8ded0] bg-white p-4 sm:grid-cols-[150px_1fr]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">{event.date}</p>
                  <p className="mt-1 text-sm text-[#5b6257]">{event.category}</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#203c62]">{event.name}</h2>
                  <p className="mt-1 text-sm leading-6 text-[#273125]">{event.description}</p>
                  <p className="mt-2 text-sm text-[#5b6257]">{event.significance}</p>
                </div>
              </article>
            ))}
          </div>
        </Section>
        <Section title="Geotisk kalender" eyebrow="Faste merkedager">
          <div className="grid gap-3 md:grid-cols-2">
            {archive.calendar.map((event) => (
              <article key={`${event.date}-${event.name}`} className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8e3030]">
                  {event.date} · {event.category}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#203c62]">{event.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[#273125]">{event.description}</p>
                <p className="mt-2 text-sm text-[#5b6257]">{event.significance}</p>
              </article>
            ))}
          </div>
        </Section>
      </div>
    );
  }

  if (slug === "episoder") {
    return (
      <div className="space-y-6">
        <Section title="Episoder med rettsvirkning" eyebrow="Rikets fortellinger">
          <div className="grid gap-4 lg:grid-cols-2">
            {archive.episodes.map((episode) => (
              <article key={episode.id} className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8e3030]">
                  {episode.date} · {episode.category}
                </p>
                <h2 className="font-display mt-2 text-2xl font-semibold text-[#062b40]">{episode.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#273125]">{episode.summary}</p>
                <div className="mt-4 rounded border border-[#c49a3c]/35 bg-[#fdf7e8] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">Huskes for</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-[#4f412b]">
                    {episode.rememberedFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <p className="mt-4 rounded border border-[#d8ded0] bg-white p-3 text-sm leading-6 text-[#203c62]">
                  {episode.lesson}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {episode.relatedTerms.map((term) => (
                    <span key={term} className="rounded border border-[#d8ded0] bg-white px-2 py-1 text-xs font-semibold text-[#7c2430]">
                      {term}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Section>
      </div>
    );
  }

  if (slug === "geotinget") {
    const geotingPlayers = livePlayers ?? players;
    return (
      <div className="space-y-6">
        <div className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
                Levende arkiv
              </p>
              <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">
                Tingpergamentene
              </h2>
            </div>
            <Link
              href="/geotinget/pergamenter"
              className="inline-flex h-10 w-fit items-center justify-center rounded bg-[#203c62] px-3 text-sm font-semibold text-white"
            >
              Åpne pergamentarkivet
            </Link>
          </div>
        </div>
        <Section title="Saker for GeoTinget" eyebrow="Historisk protokollark">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] text-left text-sm">
              <thead className="bg-[#203c62] text-xs uppercase tracking-[0.12em] text-white">
                <tr>
                  <th className="px-3 py-3">Dato</th>
                  <th className="px-3 py-3">Saksnr.</th>
                  <th className="px-3 py-3">Sak</th>
                  <th className="px-3 py-3">Forslag</th>
                  <th className="px-3 py-3">Fremmet av</th>
                  <th className="px-3 py-3">Vedtak</th>
                  <th className="px-3 py-3">Stemmer</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Kommentar</th>
                </tr>
              </thead>
              <tbody>
                {archive.geotingCases.map((item) => (
                  <tr key={item.caseName} className="border-b border-[#eef1eb] last:border-b-0">
                    <td className="px-3 py-3">{item.date}</td>
                    <td className="px-3 py-3 font-mono text-[#8e3030]">{item.caseNumber ?? "-"}</td>
                    <td className="px-3 py-3 font-semibold text-[#203c62]">{item.caseName}</td>
                    <td className="px-3 py-3">{item.proposal}</td>
                    <td className="px-3 py-3">{item.proposedBy}</td>
                    <td className="px-3 py-3">{item.decision}</td>
                    <td className="px-3 py-3">{item.votes}</td>
                    <td className="px-3 py-3">{item.status}</td>
                    <td className="px-3 py-3 text-[#5b6257]">{item.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Automatisk avstemningsprotokoll" eyebrow="Riksarkivet fører selv">
          {dynamicGeotingProposals.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {dynamicGeotingProposals.map((proposal) => {
                const summary = summarizeProposal(proposal, geotingPlayers);
                const lifecycle = getGeotingLifecycle(proposal, geotingPlayers);
                const proposer = geotingPlayers.find((player) => player.id === proposal.proposedBy);
                const starter = geotingPlayers.find((player) => player.id === proposal.voteStartedBy);
                const implementationStatus = proposal.implementationStatus ?? "pending";
                return (
                  <article key={proposal.id} className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8e3030]">
                      {proposal.status === "open" ? "Venter på geo-ed" : summary.resultText} · {dateTimeLabel(proposal.createdAt)}
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-[#203c62]">
                      {proposal.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#273125]">{proposal.body}</p>
                    <dl className="mt-4 grid gap-2 text-sm">
                      <ArchiveFact label="Fremmet av" value={proposer?.shortName ?? "Ukjent geot"} />
                      <ArchiveFact label="Avstemning åpnet av" value={starter?.shortName ?? "Ikke åpnet"} />
                      <ArchiveFact label="Tingfrist" value={dateTimeLabel(proposal.voteEndsAt)} />
                      <ArchiveFact
                        label="Stemmer"
                        value={`For ${summary.forVotes} · Mot ${summary.againstVotes} · Blankt ${summary.blankVotes}`}
                      />
                      <ArchiveFact label="Vedtak" value={summary.label} />
                      <ArchiveFact label="Etterliv" value={geotingImplementationLabels[implementationStatus]} />
                    </dl>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      {lifecycle.map((step) => (
                        <div key={step.id} className="rounded border border-[#d8ded0] bg-white px-3 py-2 text-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7c2430]">{step.label}</p>
                          <p className="mt-1 text-[#4f412b]">{step.detail}</p>
                        </div>
                      ))}
                    </div>
                    {proposal.implementationNote ? (
                      <p className="mt-3 rounded border border-[#c49a3c]/30 bg-[#fdf7e8] p-3 text-sm leading-6 text-[#4f412b]">
                        {proposal.implementationNote}
                      </p>
                    ) : null}
                    {proposal.partyPositions?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {proposal.partyPositions.map((position) => (
                          <span key={position.partyId} className="rounded border border-[#d8ded0] bg-white px-2 py-1 text-xs font-semibold text-[#203c62]">
                            {position.partyId.toUpperCase()} · {partyPositionLabels[position.position]}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded border border-dashed border-[#c49a3c] bg-[#c49a3c]/10 p-5">
              <p className="font-display text-2xl font-semibold text-[#654517]">
                Ingen nye avstemninger er ført av embetsverket ennå.
              </p>
              <p className="mt-2 text-sm text-[#60553f]">
                Når stemmeurnen åpnes i GeoTinget, havner saken her automatisk.
              </p>
            </div>
          )}
        </Section>
      </div>
    );
  }

  if (slug === "gammel-slowgeo") {
    const byPoints = [...archive.oldSlowGeo].sort((a, b) => b.points - a.points || a.player.localeCompare(b.player, "nb"));
    const byKattometer = [...archive.oldSlowGeo].sort(
      (a, b) => a.kattometer - b.kattometer || b.points - a.points || a.player.localeCompare(b.player, "nb"),
    );
    const totalPointRounds = archive.oldSlowGeo.reduce((sum, record) => sum + record.pointRounds, 0);
    const totalKattometer = archive.oldSlowGeo.reduce((sum, record) => sum + record.kattometer, 0);

    return (
      <div className="space-y-6">
        <Section title="Den gamle SlowGeo-tabellen" eyebrow="Importert historisk æra">
          <div className="grid gap-3 md:grid-cols-3">
            <ArchiveFact label="Geoter i kilden" value={`${archive.oldSlowGeo.length}`} />
            <ArchiveFact label="Poengførte deltakelser" value={`${totalPointRounds}`} />
            <ArchiveFact label="Samlet kattometer" value={formatKm(totalKattometer)} />
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-[#203c62] text-xs uppercase tracking-[0.12em] text-white">
                <tr>
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Geot</th>
                  <th className="px-3 py-3 text-right">Poeng</th>
                  <th className="px-3 py-3 text-right">Poengrunder</th>
                  <th className="px-3 py-3 text-right">Poengsnitt</th>
                  <th className="px-3 py-3 text-right">Kattometer</th>
                  <th className="px-3 py-3 text-right">Kattometerrunder</th>
                  <th className="px-3 py-3 text-right">Km-snitt</th>
                </tr>
              </thead>
              <tbody>
                {byPoints.map((record, index) => (
                  <tr key={record.player} className="border-b border-[#eef1eb] bg-white last:border-b-0">
                    <td className="px-3 py-3 font-mono text-[#8e3030]">{index + 1}</td>
                    <td className="px-3 py-3 font-semibold text-[#203c62]">{record.player}</td>
                    <td className="px-3 py-3 text-right font-semibold">{record.points}</td>
                    <td className="px-3 py-3 text-right">{record.pointRounds}</td>
                    <td className="px-3 py-3 text-right">{formatNumber(record.points / Math.max(record.pointRounds, 1))}</td>
                    <td className="px-3 py-3 text-right">{formatKm(record.kattometer)}</td>
                    <td className="px-3 py-3 text-right">{record.kattometerRounds}</td>
                    <td className="px-3 py-3 text-right">
                      {formatKm(record.kattometer / Math.max(record.kattometerRounds, 1))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Poengadelen" eyebrow="Gammel rang">
            <HistoricPodium
              rows={byPoints.slice(0, 3).map((record) => ({
                name: record.player,
                value: `${record.points} poeng`,
                detail: `${record.pointRounds} poengrunder`,
              }))}
            />
          </Section>
          <Section title="Presisjonsadelen" eyebrow="Lavest kattometer">
            <HistoricPodium
              rows={byKattometer.slice(0, 3).map((record) => ({
                name: record.player,
                value: formatKm(record.kattometer),
                detail: `${formatKm(record.kattometer / Math.max(record.kattometerRounds, 1))} i snitt`,
              }))}
            />
          </Section>
        </div>

        <p className="rounded border border-[#c49a3c]/35 bg-[#fdf7e8] p-4 text-sm leading-6 text-[#4f412b]">
          Dette er en historisk import. Tallene teller ikke inn i dagens levende SlowGeo-tabell, men står som egen æra i
          riksarkivet.
        </p>
      </div>
    );
  }

  if (slug === "konespillet") {
    return (
      <Section title="Konespillet" eyebrow="Inoffisiell protokoll">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {archive.konespillet.map((rule) => (
            <article key={rule.points} className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-4">
              <p className="font-display text-4xl font-semibold text-[#7c2430]">{rule.points}p</p>
              <h2 className="mt-2 text-lg font-semibold text-[#203c62]">{rule.reaction}</h2>
            </article>
          ))}
        </div>
        <p className="mt-4 rounded border border-[#c49a3c]/35 bg-[#fdf7e8] p-4 text-sm leading-6 text-[#4f412b]">
          Konespillet er et paraspill som registrerer konenes reaksjoner på geotisk
          aktivitet. Det reguleres ikke av GeoGrunnloven, men protokollføres med
          den alvor situasjonen fortjener.
        </p>
      </Section>
    );
  }

  return null;
}

function HistoricPodium({
  rows,
}: {
  rows: Array<{ name: string; value: string; detail: string }>;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.name} className="rounded border border-[#d8ded0] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">#{index + 1}</p>
          <h3 className="mt-1 text-xl font-semibold text-[#203c62]">{row.name}</h3>
          <p className="mt-2 font-mono text-[#8e3030]">{row.value}</p>
          <p className="mt-1 text-sm text-[#5b6257]">{row.detail}</p>
        </div>
      ))}
    </div>
  );
}

function ArchiveFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#c49a3c]/30 bg-[#fdf7e8] p-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">{label}</dt>
      <dd className="mt-1 leading-6 text-[#4f412b]">{value}</dd>
    </div>
  );
}
