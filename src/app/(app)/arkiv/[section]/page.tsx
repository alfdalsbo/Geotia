import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Section } from "@/components/section";
import { archiveSources, getArchiveSection } from "@/lib/archive";

export const metadata = {
  title: "Arkiv",
};

export default async function ArchiveSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: slug } = await params;
  const section = getArchiveSection(slug);
  if (!section) notFound();

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
          className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[#062b40]/30 bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Oppslagsverk
        </Link>
      </div>

      <ArchiveBody slug={slug} />
    </div>
  );
}

function ArchiveBody({ slug }: { slug: string }) {
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
                    {party?.id.toUpperCase()}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#203c62]">{player.shortName}</h2>
                  <p className="text-sm text-[#5b6257]">{player.title}</p>
                </div>
              </div>
              <dl className="mt-5 grid gap-3 text-sm">
                <ArchiveFact label="Parti" value={party?.name ?? "-"} />
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
        {parties.map((party) => (
          <article
            id={party.id}
            key={party.id}
            className="geotia-frame scroll-mt-24 rounded"
          >
            <div className="grid gap-0">
              <div className="relative aspect-[4/5] bg-[#061d2b]">
                {party.asset ? (
                  <Image
                    src={party.asset}
                    alt={`Partikort for ${party.name}`}
                    fill
                    loading="eager"
                    sizes="(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw"
                    className="object-contain"
                  />
                ) : null}
              </div>
              <div className="min-w-0 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c2430]">
                  {party.id.toUpperCase()} · {party.ideology}
                </p>
                <h2 className="font-display mt-1 break-words text-2xl font-semibold text-[#062b40] [overflow-wrap:anywhere] sm:text-3xl">
                  {party.name}
                </h2>
                <p className="mt-3 rounded border border-[#c49a3c]/35 bg-[#fff7e6] px-3 py-2 text-sm italic leading-6 text-[#4f412b]">
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
                  <div className="mt-4 rounded border border-[#c49a3c]/35 bg-[#fff7e6] p-4">
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
        ))}
      </div>
    );
  }

  if (slug === "merkedager") {
    return (
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
    );
  }

  if (slug === "geotinget") {
    return (
      <Section title="Saker for GeoTinget" eyebrow="Protokollark">
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
        <p className="mt-4 rounded border border-[#c49a3c]/35 bg-[#fff7e6] p-4 text-sm leading-6 text-[#4f412b]">
          Konespillet er et paraspill som registrerer konenes reaksjoner på geotisk
          aktivitet. Det reguleres ikke av GeoGrunnloven, men protokollføres med
          den alvor situasjonen fortjener.
        </p>
      </Section>
    );
  }

  return null;
}

function ArchiveFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#c49a3c]/30 bg-[#fff7e6] p-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">{label}</dt>
      <dd className="mt-1 leading-6 text-[#4f412b]">{value}</dd>
    </div>
  );
}
