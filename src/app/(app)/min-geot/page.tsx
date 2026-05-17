import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Crown,
  Eye,
  Footprints,
  Gavel,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Section, StatTile } from "@/components/section";
import { getCurrentGeot } from "@/lib/auth";
import { getEarnedPlayerBadges, type GeotiaBadgeTone } from "@/lib/geotia-badges";
import { getGeoticOrderRows } from "@/lib/geotisk-orden";
import { getThirdCollegeSeat, isThirdCollegeMember } from "@/lib/kollegium";
import { getPartyMechanic } from "@/lib/party-mechanics";
import { getPlayerDossier } from "@/lib/player-dossier";
import { computeRound, computeStandings } from "@/lib/scoring";
import { getAppState } from "@/lib/store";
import { dateLabel, formatKm, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Min geot",
};

export default async function MyGeotPage() {
  const [state, currentGeot] = await Promise.all([getAppState(), getCurrentGeot()]);
  const player = currentGeot ?? state.players[0];
  const party = state.parties.find((candidate) => candidate.id === player.partyId);
  const standings = computeStandings(state.players, state.rounds);
  const standing = standings.find((row) => row.player.id === player.id);
  const orderRows = getGeoticOrderRows(
    state.players,
    standings,
    state.geoterIndexAdjustments,
    state.geoticOrderAssessments,
  );
  const orderRow = orderRows.find((row) => row.player.id === player.id);
  const lockedRounds = state.rounds
    .filter((round) => round.status === "locked")
    .map((round) => computeRound(round, state.players))
    .filter((round) => round.results.some((result) => result.player.id === player.id))
    .sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number);
  const latestResults = lockedRounds.slice(0, 5).map((round) => ({
    round,
    result: round.results.find((result) => result.player.id === player.id)!,
  }));
  const collegeSeat = isThirdCollegeMember(player.id) ? getThirdCollegeSeat(player.id) : null;
  const badges = getEarnedPlayerBadges({
    adjustments: state.geoterIndexAdjustments,
    player,
    rounds: state.rounds,
    standing,
  });
  const partyMechanic = getPartyMechanic(player.partyId);
  const dossier = getPlayerDossier(player, state.players, state.rounds, standing);

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded border border-[#c49a3c]/70 bg-[#061d2b] text-[#fff7e6] shadow-[0_22px_48px_rgba(0,0,0,0.22)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded border border-[#c49a3c]/55 bg-[#020b11]/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#e1c06c]">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Personlig riksmappe
            </div>
            <h1 className="font-display mt-5 text-5xl font-semibold tracking-normal sm:text-7xl">
              {player.shortName}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#eadcbd]">
              {player.title}. {player.specialty}. Her ligger din synlige plass i
              riket: poeng, kattometer, ordensvei og de siste sporene du la igjen
              i SlowGeo-protokollen.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/spill/slowgeo"
                className="inline-flex h-11 items-center gap-2 rounded bg-[#e1c06c] px-4 text-sm font-semibold text-[#062b40] shadow-sm transition hover:bg-[#f0d78f]"
              >
                Åpne SlowGeo
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/ordenen"
                className="inline-flex h-11 items-center gap-2 rounded border border-[#e1c06c]/45 bg-[#fff7e6]/10 px-4 text-sm font-semibold text-[#fff7e6] transition hover:bg-[#fff7e6]/16"
              >
                Se ordensveien
                <Footprints className="h-4 w-4" aria-hidden="true" />
              </Link>
              {collegeSeat ? (
                <Link
                  href="/tredje-kollegium"
                  className="inline-flex h-11 items-center gap-2 rounded border border-[#e1c06c]/45 bg-[#020b11]/55 px-4 text-sm font-semibold text-[#e1c06c] transition hover:bg-[#020b11]/80"
                >
                  Tredje Kollegium
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>

          <aside className="border-t border-[#c49a3c]/35 bg-[#020b11] p-5 lg:border-l lg:border-t-0">
            <div className="flex h-full flex-col justify-between rounded border border-[#c49a3c]/45 bg-[#fff7e6]/8 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">Rolle</p>
                <h2 className="font-display mt-2 text-3xl font-semibold">{party?.name.split(" - ")[0] ?? player.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#eadcbd]">
                  {party?.motto ?? "Tingvitne uten stemmerett, men med protokollført nærvær."}
                </p>
              </div>
              <div className="mt-6 grid gap-2 text-sm text-[#eadcbd]">
                <p className="flex items-center justify-between gap-3">
                  <span>Stemmerett</span>
                  <span className="font-semibold text-[#fff7e6]">{player.canVote === false ? "Nei" : "Ja"}</span>
                </p>
                <p className="flex items-center justify-between gap-3">
                  <span>SlowGeo</span>
                  <span className="font-semibold text-[#fff7e6]">{player.canCompete === false ? "Benket" : "Spiller"}</span>
                </p>
                <p className="flex items-center justify-between gap-3">
                  <span>Orden</span>
                  <span className="font-semibold text-[#fff7e6]">{orderRow?.rank.name ?? "-"}</span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="SlowGeo-rang" value={standing ? `#${standing.rank}` : "-"} detail={`${standing?.totalPoints ?? 0} poeng`} tone="blue" />
        <StatTile label="Kattometer" value={formatKm(standing?.totalKattometer)} detail={`${standing?.roundsPlayed ?? 0} runder spilt`} tone="red" />
        <StatTile label="Seire" value={standing?.wins ?? 0} detail={`${standing?.top3 ?? 0} topp 3`} tone="gold" />
        <StatTile label="Ordensrang" value={orderRow?.rank.name ?? "-"} detail={orderRow ? `${orderRow.progressToNext}% mot neste` : "Ikke ført"} tone="green" />
      </div>

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
        <Section title="Profil" eyebrow="Geotisk identitet">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBlock icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} title="Styrker" text={player.strengths} />
            <InfoBlock icon={<Gavel className="h-4 w-4" aria-hidden="true" />} title="Svakheter" text={player.weaknesses} />
            <InfoBlock icon={<BadgeCheck className="h-4 w-4" aria-hidden="true" />} title="Øyeblikk" text={player.moment} />
            <InfoBlock icon={<Crown className="h-4 w-4" aria-hidden="true" />} title="Merke" text={player.mark} />
          </div>
        </Section>

        <Section
          title="Ordensvei"
          eyebrow="Synlig stige"
          action={
            <Link href="/ordenen" className="inline-flex h-10 items-center gap-2 rounded bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]">
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
              <div className="h-2 overflow-hidden rounded bg-[#d8c48c]/45">
                <div className="h-full rounded bg-[#7c2430]" style={{ width: `${orderRow.nextRank ? orderRow.progressToNext : 100}%` }} />
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

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
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

        <Section title="Partipass" eyebrow={party?.id.toUpperCase() ?? "Tingvitne"}>
          <div className="space-y-3">
            {party ? (
              <div className="grid gap-3 sm:grid-cols-[12px_1fr]">
                <span className="min-h-28 rounded-full" style={{ background: party.color }} />
                <div className="grid gap-3">
                  <div className="rounded border border-[#d8c48c] bg-white/72 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">Parti</p>
                    <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">{party.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#4f412b]">{party.ideology}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SmallFact label="Rivaler" value={party.rivals} />
                    <SmallFact label="Øyeblikk" value={player.moment} />
                  </div>
                </div>
              </div>
            ) : null}
            <div className="rounded border border-[#d8c48c] bg-white/72 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">Motto</p>
              <p className="mt-2 text-sm italic leading-6 text-[#4f412b]">
                {party?.motto ?? "Uten parti, men ikke uten observasjonsverdi."}
              </p>
            </div>
            {partyMechanic ? (
              <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
                  Partimekanikk · {partyMechanic.phase}
                </p>
                <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">{partyMechanic.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#4f412b]">{partyMechanic.effect}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#60553f]">{partyMechanic.limit}</p>
              </div>
            ) : null}
          </div>
        </Section>
      </div>

      <Section title="Siste SlowGeo-spor" eyebrow="Personlig protokoll">
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
      </Section>
    </div>
  );
}

const badgeToneClasses: Record<GeotiaBadgeTone, string> = {
  blue: "border-[#203c62]/30 bg-[#203c62]/10 text-[#062b40]",
  green: "border-[#194832]/30 bg-[#194832]/10 text-[#194832]",
  gold: "border-[#c49a3c]/45 bg-[#fff7e6] text-[#654517]",
  red: "border-[#7c2430]/25 bg-[#7c2430]/10 text-[#7c2430]",
};

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
    <div className="rounded border border-[#d8c48c] bg-white/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">{label}</p>
      <p className="font-display mt-1 text-2xl font-semibold text-[#062b40]">{value}</p>
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
