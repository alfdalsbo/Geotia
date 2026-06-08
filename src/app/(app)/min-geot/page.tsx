import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Crown,
  Eye,
  Footprints,
  Gavel,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Tag,
} from "lucide-react";

import { updateMyGeotNicknameAction } from "@/app/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Section, StatTile } from "@/components/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getCurrentGeot } from "@/lib/auth";
import { geotiaMyGeotLines, pickGeoticLine } from "@/lib/geotia-jargon";
import { getEarnedPlayerBadges, type GeotiaBadgeTone } from "@/lib/geotia-badges";
import { getGeoticOrderRows, getOrderCapabilities } from "@/lib/geotisk-orden";
import { getThirdCollegeSeat, isThirdCollegeMember } from "@/lib/kollegium";
import { getPlayerDisplayName, getPlayerOfficialFirstName } from "@/lib/player-profile";
import { getPartyMechanic } from "@/lib/party-mechanics";
import { getPlayerDossier } from "@/lib/player-dossier";
import { computeRound, computeStandings } from "@/lib/scoring";
import { filterScoreBearingRounds } from "@/lib/slowgeo";
import { getActivityState } from "@/lib/store";
import { dateLabel, formatKm, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Min geot",
};

export default async function MyGeotPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [state, currentGeot] = await Promise.all([getActivityState(), getCurrentGeot()]);
  const player = currentGeot
    ? (state.players.find((candidate) => candidate.id === currentGeot.id) ?? currentGeot)
    : state.players[0];
  const displayName = getPlayerDisplayName(player);
  const officialFirstName = getPlayerOfficialFirstName(player);
  const party = state.parties.find((candidate) => candidate.id === player.partyId);
  const scoreBearingRounds = filterScoreBearingRounds(state.rounds);
  const standings = computeStandings(state.players, scoreBearingRounds);
  const standing = standings.find((row) => row.player.id === player.id);
  const orderRows = getGeoticOrderRows(
    state.players,
    standings,
    state.geoterIndexAdjustments,
    state.geoticOrderAssessments,
  );
  const orderRow = orderRows.find((row) => row.player.id === player.id);
  const orderCapabilities = getOrderCapabilities(orderRow ?? null);
  const lockedRounds = scoreBearingRounds
    .filter((round) => round.status === "locked")
    .map((round) => computeRound(round, state.players))
    .filter((round) => round.results.some((result) => result.player.id === player.id))
    .sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number);
  const latestResults = lockedRounds.slice(0, 5).map((round) => ({
    round,
    result: round.results.find((result) => result.player.id === player.id)!,
  }));
  const latestResult = latestResults[0] ?? null;
  const collegeSeat = isThirdCollegeMember(player.id) ? getThirdCollegeSeat(player.id) : null;
  const badges = getEarnedPlayerBadges({
    adjustments: state.geoterIndexAdjustments,
    player,
    rounds: scoreBearingRounds,
    standing,
  });
  const dossierLine = pickGeoticLine(geotiaMyGeotLines, player.id);
  const partyMechanic = getPartyMechanic(player.partyId);
  const dossier = getPlayerDossier(player, state.players, scoreBearingRounds, standing);
  const orderProgressLabel = orderRow
    ? orderRow.nextRank
      ? orderRow.promotionReady
        ? "Kriterier oppfylt · protokollen føres"
        : `${orderRow.progressToNext}% mot ${orderRow.nextRank.name}`
      : "Øverste rang fullført"
    : "Ikke ført";

  return (
    <div className="space-y-7">
      <section className="geo-hero">
        <div className="geo-hero-grid">
          <div className="geo-hero-text">
            <Eyebrow>Din riksmappe · Kapittel VII</Eyebrow>
            <h1 className="geo-hero-title">{displayName}</h1>
            <p className="geo-hero-lead geo-hero-lead-dropcap">
              {player.title}. {player.specialty}. Her ligger din synlige plass i
              riket: poeng, kattometer, ordensvei og de siste sporene du la
              igjen i SlowGeo-protokollen.
            </p>
            <div className="geo-hero-actions">
              <Link href="/spill/slowgeo" className="btn btn-wax">
                Start en SlowGeo
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/ordenen" className="btn btn-quiet">
                Se ordensveien
                <Footprints className="h-4 w-4" aria-hidden="true" />
              </Link>
              {collegeSeat ? (
                <Link href="/tredje-kollegium" className="btn btn-brass">
                  Tredje Kollegium
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>
          <div className="geo-hero-poster">
            <Image
              src="/illustrations/vapen-min-geot.svg"
              alt="Riksvåpen for Min geot"
              width={300}
              height={350}
              priority
              style={{ width: "auto", maxHeight: "440px" }}
            />
          </div>
        </div>
        <div className="geo-winner-band">
          <div>
            <p className="label">Rolle · {party?.name.split(" - ")[0] ?? player.title}</p>
            <p className="value">
              {party?.motto ?? "Tingvitne uten stemmerett."}
              {" "}— Stemmerett: {player.canVote === false ? "Nei" : "Ja"} · SlowGeo: {player.canCompete === false ? "Benket" : "Spiller"} · Orden: {orderRow?.rank.name ?? "-"}
            </p>
          </div>
        </div>
      </section>

      <ProfileStatus status={params.status} error={params.error} />

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="SlowGeo-rang" value={standing ? `#${standing.rank}` : "-"} detail={`${standing?.totalPoints ?? 0} poeng`} tone="blue" index={0} />
        <StatTile label="Kattometer" value={formatKm(standing?.totalKattometer)} detail={`${standing?.roundsPlayed ?? 0} runder spilt`} tone="red" index={1} />
        <StatTile label="Seire" value={standing?.wins ?? 0} detail={`${standing?.top3 ?? 0} topp 3`} tone="gold" index={2} />
        <StatTile label="Ordensrang" value={orderRow?.rank.name ?? "-"} detail={orderProgressLabel} tone="green" index={3} />
      </div>

      <div className="rounded border border-[#c49a3c]/35 bg-[#fdf7e8] px-4 py-3 text-sm font-semibold text-[#654517]">
        {dossierLine}
      </div>

      <Section title="Personlig kontrollrom" eyebrow="Neste handling i riksmappe">
        <div className="grid gap-4 lg:grid-cols-3">
          <Link href="/ordenen" className="archive-card group block transition hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-4">
              <div className="crown-icon">
                <Footprints className="h-5 w-5" aria-hidden="true" />
              </div>
              <ArrowRight className="h-5 w-5 text-[#7c2430] transition group-hover:translate-x-1" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.32em] text-[#7e5a18]">
              Ordensmål
            </p>
            <h3>{orderRow?.nextRank ? `Neste: ${orderRow.nextRank.name}` : orderRow?.rank.name ?? "Ordenen venter"}</h3>
            <p className="lead-detail mt-2 text-sm">{orderProgressLabel}</p>
          </Link>

          {latestResult ? (
            <Link
              href={`/runder/${latestResult.round.id}`}
              className="archive-card group block transition hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="crown-icon">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </div>
                <ArrowRight className="h-5 w-5 text-[#7c2430] transition group-hover:translate-x-1" aria-hidden="true" />
              </div>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.32em] text-[#7e5a18]">
                Siste SlowGeo-spor
              </p>
              <h3>{latestResult.round.name}</h3>
              <p className="lead-detail mt-2 text-sm">
                {formatKm(latestResult.result.actualKm)} · {latestResult.result.points} poeng
              </p>
            </Link>
          ) : (
            <div className="archive-card">
              <div className="crown-icon">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.32em] text-[#7e5a18]">
                Siste SlowGeo-spor
              </p>
              <h3>Ingen låste spor ennå</h3>
              <p className="lead-detail mt-2 text-sm">Første fasitkort vil lande her når riket får sin neste låste runde.</p>
            </div>
          )}

          <div className="archive-card">
            <div className="crown-icon">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.32em] text-[#7e5a18]">
              Merker
            </p>
            <h3>{badges.length ? `${badges.length} merker ført` : "Ingen merker ennå"}</h3>
            <p className="lead-detail mt-2 text-sm">
              {badges.length
                ? badges.slice(0, 2).map((badge) => badge.title).join(" · ")
                : "Det er nesten mistenkelig ryddig. Fortsett å spille, stemme og skape protokoll."}
            </p>
          </div>
        </div>
      </Section>

      <Section title="Navneprotokoll" eyebrow="Kallenavn uten folkeregisterkupp">
        <form
          action={updateMyGeotNicknameAction}
          className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto]"
        >
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
              Fornavn i riksrullen
            </span>
            <span className="mt-2 flex min-h-11 items-center gap-2 rounded border border-[#d8c48c] bg-[#fdf7e8] px-3 text-base font-semibold text-[#062b40]">
              <LockKeyhole className="h-4 w-4 flex-none text-[#7c2430]" aria-hidden="true" />
              <input
                aria-label="Fornavn låst"
                className="w-full border-0 bg-transparent p-0 font-semibold text-[#062b40] outline-none"
                readOnly
                value={officialFirstName}
              />
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#60553f]">
              Dette er fastført i kanon. Bare kallenavnet kan bøyes av samtiden.
            </span>
          </label>
          <label className="block" htmlFor="nickname">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
              Kallenavn
            </span>
            <span className="mt-2 flex min-h-11 items-center gap-2 rounded border border-[#c49a3c]/55 bg-white px-3 text-base text-[#062b40]">
              <Tag className="h-4 w-4 flex-none text-[#7c2430]" aria-hidden="true" />
              <input
                id="nickname"
                name="nickname"
                defaultValue={player.nickname ?? ""}
                maxLength={36}
                placeholder={officialFirstName}
                className="w-full min-w-0 border-0 bg-transparent p-0 text-base outline-none placeholder:text-[#9b8a6a]"
              />
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#60553f]">
              La feltet stå tomt for å bruke fornavnet overalt igjen.
            </span>
          </label>
          <PendingSubmitButton
            className="btn btn-wax min-h-11 self-end"
            pendingChildren="Fører..."
          >
            Lagre kallenavn
          </PendingSubmitButton>
        </form>
      </Section>

      <Section title="Riksmappe" eyebrow="Egne trender">
        <div className="grid gap-3 md:grid-cols-5">
          {dossier.stats.map((stat) => (
            <StatTile key={stat.label} label={stat.label} value={stat.value} detail={stat.detail} tone={stat.tone} />
          ))}
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-5">
          {dossier.recentMoments.map((moment) => (
            <Link
              key={`${moment.roundId}-${moment.label}`}
              href={`/runder/${moment.roundId}`}
              className={`rounded border p-3 transition hover:-translate-y-0.5 ${badgeToneClasses[moment.tone]}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">{dateLabel(moment.date)} · {moment.label}</p>
              <h2 className="font-display mt-1 text-xl font-semibold">{moment.title}</h2>
              <p className="mt-2 text-sm leading-6">{moment.detail}</p>
            </Link>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <details className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4 shadow-sm">
          <summary className="cursor-pointer list-none">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
              Geotisk identitet
            </p>
            <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
              Profil og særpreg
            </h2>
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <InfoBlock icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} title="Styrker" text={player.strengths} />
            <InfoBlock icon={<Gavel className="h-4 w-4" aria-hidden="true" />} title="Svakheter" text={player.weaknesses} />
            <InfoBlock icon={<BadgeCheck className="h-4 w-4" aria-hidden="true" />} title="Øyeblikk" text={player.moment} />
            <InfoBlock icon={<Crown className="h-4 w-4" aria-hidden="true" />} title="Merke" text={player.mark} />
          </div>
        </details>

        <Section
          title="Ordensvei"
          eyebrow="Synlig stige"
          action={
            <Link href="/ordenen" className="inline-flex h-10 items-center gap-2 rounded bg-[#fdf7e8] px-3 text-sm font-semibold text-[#062b40]">
              Åpne
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        >
          {orderRow ? (
            <div className="space-y-4">
              <div>
                <p className="font-display text-3xl font-semibold text-[#062b40]">{orderRow.rank.name}</p>
                <p className="mt-2 text-sm leading-6 text-[#60553f]">{orderRow.publicNote || orderRow.rank.description}</p>
              </div>
              <div className="rounded border border-[#c49a3c]/45 bg-[#fffaf0] p-3 text-sm leading-6 text-[#654517]">
                <p className="font-semibold text-[#062b40]">{orderCapabilities.publicSummary}</p>
                <p className="mt-1">
                  {orderRow.promotionReady
                    ? "Kriteriene er oppfylt. Protokollen føres videre før nye rettigheter åpnes."
                    : orderCapabilities.lockedSummary}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#062b40]">
                  <span>{orderRow.nextRank ? `Neste: ${orderRow.nextRank.name}` : "Øverste synlige rang"}</span>
                  <span className="text-[#7c2430]">{orderRow.nextRank ? `${orderRow.progressToNext}%` : "Fullført"}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded bg-[#d8c48c]/45">
                  <div className="h-full rounded bg-[#7c2430]" style={{ width: `${orderRow.nextRank ? orderRow.progressToNext : 100}%` }} />
                </div>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <Metric label="Tjenestetid" value={orderRow.serviceTimeLabel} />
                <Metric label="Poeng" value={formatNumber(orderRow.lifetimePoints)} />
                <Metric label="Runder" value={orderRow.roundsPlayed} />
              </div>
            </div>
          ) : null}
        </Section>
      </div>

      <details className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4 shadow-sm">
        <summary className="cursor-pointer list-none">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
            Dypere riksmappe
          </p>
          <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
            Merker og partipass
          </h2>
        </summary>
        <div className="mt-4 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Section title="Merker" eyebrow="Fase 3-forberedelse">
            {badges.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {badges.map((badge) => (
                  <article key={badge.id} className={`rounded border p-4 ${badgeToneClasses[badge.tone]}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]">{badge.detail}</p>
                    <h2 className="font-display mt-1 text-2xl font-semibold">{badge.title}</h2>
                    <p className="mt-2 text-sm leading-6">{badge.description}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded border border-dashed border-[#c49a3c] bg-[#c49a3c]/10 p-5 text-sm leading-6 text-[#60553f]">
                Ingen merker er utløst ennå. Det er nesten mistenkelig ryddig.
              </div>
            )}
          </Section>

        <article className="personal-poster">
          <div
            className="personal-poster-band"
            style={{ background: party?.color ?? "#4b2e18" }}
          >
            <span style={{ fontFamily: "var(--font-display)" }}>
              {party?.id.toUpperCase() ?? "TINGVITNE"} · PARTIPASS
            </span>
          </div>
          <div className="personal-poster-body">
            {party ? (
              <>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7c2430]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Parti
                </p>
                <h2 className="font-display text-2xl font-semibold uppercase tracking-[0.06em] text-[#062b40]">
                  {party.name}
                </h2>
                <p className="mt-1 text-sm text-[#4f412b]">{party.ideology}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <SmallFact label="Rivaler" value={party.rivals} />
                  <SmallFact label="Øyeblikk" value={player.moment} />
                </div>
              </>
            ) : (
              <>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7c2430]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Uten parti
                </p>
                <h2 className="font-display text-2xl font-semibold uppercase tracking-[0.06em] text-[#062b40]">
                  Tingvitne i embetsverket
                </h2>
              </>
            )}
            <p
              className="mt-4 rounded border border-[#c49a3c]/45 bg-[#fffbe9] p-3 text-sm leading-6 text-[#654517]"
              style={{ fontFamily: "var(--font-italic)", fontStyle: "italic" }}
            >
              &ldquo;{party?.motto ?? "Uten parti, men ikke uten observasjonsverdi."}&rdquo;
            </p>
            {!party ? (
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#7c2430]">
                Partistiftelse kan først søkes på nivå 7: Partigründer.
              </p>
            ) : null}
            {partyMechanic ? (
              <div className="mt-4 rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4 shadow-sm">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7c2430]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Partimekanikk · {partyMechanic.phase}
                </p>
                <h3 className="font-display mt-1 text-xl font-semibold uppercase tracking-[0.04em] text-[#062b40]">
                  {partyMechanic.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#4f412b]">{partyMechanic.effect}</p>
                <p
                  className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#60553f]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {partyMechanic.limit}
                </p>
              </div>
            ) : null}
          </div>
        </article>
        </div>
      </details>

      <details className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4 shadow-sm">
        <summary className="cursor-pointer list-none">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
            Personlig protokoll
          </p>
          <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
            Siste SlowGeo-spor
          </h2>
        </summary>
        <div className="mt-4">
          {latestResults.length ? (
            <>
            <div className="grid gap-3 md:hidden">
              {latestResults.map(({ round, result }) => (
                <article key={round.id} className="rounded border border-[#d8ded0] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e3030]">{dateLabel(round.date)}</p>
                  <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">{round.name}</h2>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <Metric label="Km" value={formatKm(result.actualKm)} />
                    <Metric label="Poeng" value={result.points} />
                    <Metric label="Svar" value={result.guessText || "-"} />
                    <Metric label="Runde" value={`#${round.number}`} />
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[#d8ded0] text-xs uppercase tracking-[0.12em] text-[#5b6257]">
                  <tr>
                    <th className="py-2 pr-3">Runde</th>
                    <th className="py-2 pr-3">Dato</th>
                    <th className="py-2 pr-3 text-right">Km</th>
                    <th className="py-2 pr-3 text-right">Poeng</th>
                    <th className="py-2">Svar</th>
                  </tr>
                </thead>
                <tbody>
                  {latestResults.map(({ round, result }) => (
                    <tr key={round.id} className="border-b border-[#eef1eb] last:border-b-0">
                      <td className="py-3 pr-3 font-semibold text-[#203c62]">{round.name}</td>
                      <td className="py-3 pr-3">{dateLabel(round.date)}</td>
                      <td className="py-3 pr-3 text-right">{formatKm(result.actualKm)}</td>
                      <td className="py-3 pr-3 text-right font-semibold">{result.points}</td>
                      <td className="py-3">{result.guessText || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          ) : (
            <div className="rounded border border-dashed border-[#b8892f] bg-[#b8892f]/8 p-5">
              <p className="font-display text-2xl font-semibold text-[#654517]">Ingen låste spor ennå.</p>
              <p className="mt-2 text-sm text-[#5b6257]">Når riket starter på nytt, blir første protokoll straks en del av mappen din.</p>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

const badgeToneClasses: Record<GeotiaBadgeTone, string> = {
  blue: "border-[#203c62]/30 bg-[#203c62]/10 text-[#062b40]",
  green: "border-[#194832]/30 bg-[#194832]/10 text-[#194832]",
  gold: "border-[#c49a3c]/45 bg-[#fdf7e8] text-[#654517]",
  red: "border-[#7c2430]/25 bg-[#7c2430]/10 text-[#7c2430]",
};

function ProfileStatus({ status, error }: { status?: string; error?: string }) {
  if (error) {
    return (
      <div className="rounded border border-[#7c2430]/35 bg-[#7c2430]/10 px-4 py-3 text-sm font-semibold text-[#7c2430]">
        {error}
      </div>
    );
  }
  if (status !== "kallenavn") return null;
  return (
    <div className="rounded border border-[#194832]/30 bg-[#194832]/10 px-4 py-3 text-sm font-semibold text-[#194832]">
      Kallenavnet er ført i navneprotokollen.
    </div>
  );
}

function InfoBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded border border-[#d8c48c] bg-white/72 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
        {icon}
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#4f412b]">{text}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mobile-metric rounded border border-[#d8c48c] bg-white/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">{label}</p>
      <p className="mobile-metric-value font-display mt-1 text-2xl font-semibold text-[#062b40]">{value}</p>
    </div>
  );
}

function SmallFact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-[#d8c48c] bg-white/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#4f412b]">{value}</p>
    </div>
  );
}
