import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Crown,
  Gavel,
  Landmark,
  Milestone,
  ScrollText,
  TableProperties,
  Trophy,
  UsersRound,
} from "lucide-react";

import { DashboardGameGrid, DashboardPartyGrid } from "@/components/dashboard-sections";
import { RotatingGeotiaQuote } from "@/components/rotating-geotia-quote";
import { ExpandableImage } from "@/components/expandable-image";
import { SarajevoVideo } from "@/components/sarajevo-video";
import { Section, StatTile } from "@/components/section";
import { computeGameStandings, getHallOfFame, computeRound, computeStandings } from "@/lib/scoring";
import { getAppState } from "@/lib/store";
import { dateLabel, formatKm, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Kommandosentral",
};

export default async function DashboardPage() {
  const state = await getAppState();
  const standings = computeStandings(state.players, state.rounds);
  const lockedRounds = state.rounds.filter((round) => round.status === "locked");
  const latestRound = lockedRounds.at(-1);
  const computedLatest = latestRound ? computeRound(latestRound, state.players) : null;
  const hall = getHallOfFame(standings, state.rounds, state.players);
  const knowledgeQuotes = state.archive.knowledgeGroups.flatMap((group) => group.items);
  const leader = standings[0];
  const kattometerLeader = standings
    .filter((standing) => standing.lockedRounds > 0)
    .sort((a, b) => a.totalKattometer - b.totalKattometer)[0];
  const drafts = state.rounds.length - lockedRounds.length;
  const openGeotingCases = state.geotingProposals.filter((proposal) => proposal.status === "open").length;
  const gameCards = state.games.map((game) => {
    const standingsForGame =
      game.id === "slowgeo"
        ? standings
        : computeGameStandings(state.players, state.gameSessions, game);
    const gameLeader = standingsForGame[0];
    const count =
      game.id === "slowgeo"
        ? lockedRounds.length
        : state.gameSessions.filter((session) => session.gameId === game.id).length;

    return {
      id: game.id,
      shortName: game.shortName,
      color: game.color,
      href: game.id === "slowgeo" ? "/spill/slowgeo" : `/spill/registrer?game=${game.id}`,
      count,
      leaderName: gameLeader?.player.shortName ?? "-",
    };
  });

  return (
    <div className="space-y-7">
      <section className="geotia-frame rounded">
        <div className="grid xl:grid-cols-[1.05fr_0.95fr]">
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded border border-[#c49a3c]/50 bg-[#062b40] px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#fff7e6]">
              <Landmark className="h-4 w-4 text-[#e1c06c]" aria-hidden="true" />
              Rikets kommandosentral
            </div>
            <h1 className="font-display mt-5 text-5xl font-semibold tracking-normal text-[#062b40] sm:text-7xl">
              Geotia
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#4f412b]">
              Et geotisk mikrounivers bygget på geografispill, brutal
              sannhetssøken og et statsapparat som fører riket med alvorlig
              smil. Her føres kilometer, ære, desertering og partipropaganda
              med høytidelig hånd i Geotias statsarkiv.
            </p>

            <div className="geotia-ornament mt-6 text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#7c2430]">
              <span>Verdensnær · sannhetsnær · geotisk</span>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/spill/slowgeo"
                className="inline-flex h-11 items-center gap-2 rounded bg-[#7c2430] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#641923]"
              >
                Start SlowGeo
                <TableProperties className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/arkiv"
                className="inline-flex h-11 items-center gap-2 rounded border border-[#062b40]/30 bg-[#fff7e6] px-4 text-sm font-semibold text-[#062b40] shadow-sm transition hover:border-[#c49a3c]"
              >
                Åpne statsarkivet
                <BookOpen className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/ordenen"
                className="inline-flex h-11 items-center gap-2 rounded border border-[#062b40]/30 bg-[#fff7e6] px-4 text-sm font-semibold text-[#062b40] shadow-sm transition hover:border-[#c49a3c]"
              >
                Gå ordensveien
                <Milestone className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile
                label="Tellende runder"
                value={lockedRounds.length}
                detail={drafts ? "Utkast i protokollen" : "Alle starter rent"}
                tone="blue"
              />
              <StatTile
                label="Poengleder"
                value={leader ? leader.player.shortName : "-"}
                detail={leader ? `${leader.totalPoints} poeng` : "Embetsverket venter"}
                tone="green"
              />
              <StatTile
                label="Kattometerleder"
                value={kattometerLeader ? kattometerLeader.player.shortName : "-"}
                detail={kattometerLeader ? formatKm(kattometerLeader.totalKattometer) : "Ingen bom ført"}
                tone="gold"
              />
              <StatTile
                label="Åpne ting-saker"
                value={openGeotingCases}
                detail="GeoTinget venter"
                tone="red"
              />
            </div>
          </div>

          <div className="border-t border-[#c49a3c]/35 bg-[#061d2b] xl:border-l xl:border-t-0">
            <ExpandableImage
              src="/geotia-assets/party-overview.png"
              alt="Partioversikt for Geotia"
              sizes="(min-width: 1280px) 580px, 100vw"
              className="relative min-h-[440px] w-full sm:min-h-[560px] xl:min-h-[620px]"
              imageClassName="object-contain p-4"
              caption="Partioversikt for Geotia"
              priority
            />
            <div className="border-t border-[#c49a3c]/35 bg-[#061d2b] p-5 text-[#fff7e6]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e1c06c]">
                Siste SlowGeo-vinner
              </p>
              <p className="font-display mt-2 text-xl font-semibold leading-7">
                {computedLatest?.winnerNames.join(", ") || "Ingen låst runde ennå"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <RotatingGeotiaQuote quotes={knowledgeQuotes} />

      <SarajevoVideo />

      <DashboardGameGrid games={gameCards} />

      <DashboardPartyGrid parties={state.parties} players={state.players} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Section
          title="Samlet stilling"
          eyebrow="Poengprotokoll"
          action={
            <Link
              href="/tabeller"
              className="inline-flex h-10 items-center gap-2 rounded bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]"
            >
              Full tabell
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        >
          <div className="grid gap-3 md:hidden">
            {standings.map((standing) => (
              <article key={standing.player.id} className="rounded border border-[#d8ded0] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e3030]">#{standing.rank}</p>
                <h3 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">{standing.player.shortName}</h3>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <MobileMetric label="Poeng" value={standing.totalPoints} />
                  <MobileMetric label="Kattometer" value={formatKm(standing.totalKattometer)} />
                  <MobileMetric label="Seire" value={standing.wins} />
                  <MobileMetric label="Topp 3" value={standing.top3} />
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-[#c49a3c]/35 text-xs uppercase tracking-[0.12em] text-[#60553f]">
                <tr>
                  <th className="py-2 pr-3">Rang</th>
                  <th className="py-2 pr-3">Geot</th>
                  <th className="py-2 pr-3 text-right">Poeng</th>
                  <th className="py-2 pr-3 text-right">Kattometer</th>
                  <th className="py-2 pr-3 text-right">Seire</th>
                  <th className="py-2 text-right">Topp 3</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing) => (
                  <tr key={standing.player.id} className="border-b border-[#c49a3c]/20 last:border-0">
                    <td className="py-3 pr-3 font-mono text-[#7c2430]">{standing.rank}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-sm"
                          style={{ background: standing.player.color }}
                        />
                        <span className="font-semibold">{standing.player.shortName}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-right font-semibold">{standing.totalPoints}</td>
                    <td className="py-3 pr-3 text-right">{formatKm(standing.totalKattometer)}</td>
                    <td className="py-3 pr-3 text-right">{standing.wins}</td>
                    <td className="py-3 text-right">{standing.top3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="Siste protokoll"
          eyebrow="Runde"
          action={
            <Link
              href="/runder"
              className="inline-flex h-10 items-center gap-2 rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]"
            >
              Før runde
              <TableProperties className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        >
          {computedLatest ? (
            <div className="space-y-4">
              <div>
                <p className="font-display text-3xl font-semibold text-[#062b40]">{computedLatest.name}</p>
                <p className="mt-1 text-sm text-[#60553f]">
                  {dateLabel(computedLatest.date)} · {computedLatest.answer || "Fasit ikke ført"} ·{" "}
                  {computedLatest.participantCount} deltakere
                </p>
              </div>
              <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6] p-4">
                <p className="text-sm font-semibold text-[#7c2430]">Vinner</p>
                <p className="font-display mt-1 text-2xl font-semibold text-[#161713]">
                  {computedLatest.winnerNames.join(", ")}
                </p>
              </div>
              <div className="text-sm text-[#60553f]">
                Kattometerstraff denne runden:{" "}
                <span className="font-semibold text-[#161713]">
                  {formatKm(computedLatest.worstThreeAverage)}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded border border-dashed border-[#c49a3c] bg-[#c49a3c]/10 p-5">
              <p className="font-display text-2xl font-semibold text-[#654517]">
                Embetsverket venter på første låste runde.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#60553f]">
                Før kilometer, lås protokollen, og la kattometeret gjøre sitt tause arbeid.
              </p>
            </div>
          )}
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Æreshallen" eyebrow="Automatiske rekorder">
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-semibold text-[#062b40]">
              <Trophy className="h-4 w-4" aria-hidden="true" />
              Flest poeng
            </p>
            <p>{hall.mostPoints[0]?.player.shortName ?? "-"} · {hall.mostPoints[0]?.totalPoints ?? 0} poeng</p>
            <p className="flex items-center gap-2 font-semibold text-[#194832]">
              <Crown className="h-4 w-4" aria-hidden="true" />
              Flest seire
            </p>
            <p>{hall.mostWins[0]?.player.shortName ?? "-"} · {hall.mostWins[0]?.wins ?? 0} seire</p>
          </div>
        </Section>
        <Section title="Skammens protokoll" eyebrow="Kattometer">
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-[#7c2430]">Verste enkeltbom</p>
            <p>
              {hall.worstSingle
                ? `${hall.worstSingle.result.player.shortName} · ${formatKm(hall.worstSingle.result.actualKm)}`
                : "Ingen skam ført ennå"}
            </p>
            <p className="font-semibold text-[#654517]">Beste enkeltprestasjon</p>
            <p>
              {hall.bestSingle
                ? `${hall.bestSingle.result.player.shortName} · ${formatKm(hall.bestSingle.result.actualKm)}`
                : "Ingen udødelige øyeblikk ennå"}
            </p>
          </div>
        </Section>
        <Section
          title="Oppslagsverket"
          eyebrow="Leksikon"
          action={
            <Link href="/arkiv" className="inline-flex h-10 items-center gap-2 rounded bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]">
              Åpne
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        >
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 font-semibold text-[#062b40]">
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              Uttrykk i statsarkivet
            </p>
            <p>{formatNumber(state.archive.lexicon.length)} oppføringer</p>
            <p className="flex items-center gap-2 font-semibold text-[#7c2430]">
              <Gavel className="h-4 w-4" aria-hidden="true" />
              Saker i GeoTinget
            </p>
            <p>{state.archive.geotingCases.length} protokollførte saker</p>
            <p className="flex items-center gap-2 font-semibold text-[#654517]">
              <ScrollText className="h-4 w-4" aria-hidden="true" />
              Arkivet er ikke nøytralt. Det er bare pent ført.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}

function MobileMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-[#d8c48c] bg-[#fff7e6] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7c2430]">{label}</p>
      <p className="mt-1 font-semibold text-[#062b40]">{value}</p>
    </div>
  );
}
