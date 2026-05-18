import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Crown,
  Gavel,
  ScrollText,
  TableProperties,
  Trophy,
  UsersRound,
} from "lucide-react";

import { DashboardGameGrid, DashboardPartyGrid } from "@/components/dashboard-sections";
import { GeoGuessrTipTicker } from "@/components/geo-guessr-tip-ticker";
import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { RotatingGeotiaQuote } from "@/components/rotating-geotia-quote";
import { SarajevoVideo } from "@/components/sarajevo-video";
import { Section, StatTile } from "@/components/section";
import { buttonClass } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Ornament } from "@/components/ui/ornament";
import { getGeoGuessrTipDaySeed, selectGeoGuessrTips } from "@/lib/geoguessr-tips";
import { geotiaDashboardLines, geotiaTipLines, pickGeoticLine } from "@/lib/geotia-jargon";
import { computeGameStandings, getHallOfFame, computeRound, computeStandings } from "@/lib/scoring";
import { getAppState } from "@/lib/store";
import { dateLabel, formatKm, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Kommandosentral",
};

export default async function DashboardPage() {
  const state = await getAppState();
  const standings = computeStandings(state.players, state.rounds);
  const daySeed = getGeoGuessrTipDaySeed();
  const lockedRounds = state.rounds.filter((round) => round.status === "locked");
  const latestRound = lockedRounds.at(-1);
  const computedLatest = latestRound ? computeRound(latestRound, state.players) : null;
  const hall = getHallOfFame(standings, state.rounds, state.players);
  const knowledgeQuotes = [...state.archive.knowledgeGroups.flatMap((group) => group.items), ...geotiaTipLines];
  const dashboardLine = pickGeoticLine(geotiaDashboardLines, daySeed);
  const dailyTips = selectGeoGuessrTips({
    placement: "dashboard",
    seed: daySeed,
    count: 5,
  });
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
      <section className="geo-hero">
        <div className="geo-hero-grid">
          <div className="geo-hero-text">
            <Eyebrow>Rikets kommandosentral · Kapittel I</Eyebrow>
            <h1 className="geo-hero-title">Geotia</h1>
            <p className="geo-hero-lead geo-hero-lead-dropcap">
              Et geotisk mikrounivers bygget på geografispill, brutal
              sannhetssøken og et statsapparat som fører riket med alvorlig
              smil. Her føres kilometer, ære, desertering og partipropaganda
              med høytidelig hånd i Geotias statsarkiv.
            </p>

            <Ornament>{dashboardLine}</Ornament>

            <div className="geo-hero-actions">
              <Link
                href="/spill/slowgeo"
                prefetch={false}
                className={buttonClass({ variant: "wax" })}
              >
                Start SlowGeo
                <TableProperties className="h-4 w-4" aria-hidden="true" />
                <LinkPendingIndicator className="text-white" />
              </Link>
              <Link
                href="/arkiv"
                prefetch={false}
                className={buttonClass({ variant: "quiet" })}
              >
                Åpne statsarkivet
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <LinkPendingIndicator />
              </Link>
              <Link
                href="/ordenen"
                prefetch={false}
                className={buttonClass({ variant: "quiet" })}
              >
                Gå ordensveien
                <LinkPendingIndicator />
              </Link>
            </div>
          </div>

          <div className="geo-hero-poster">
            <Image
              src="/illustrations/vapen-kommando.svg"
              alt="Riksvåpen for Kommandosentralen"
              width={300}
              height={350}
              priority
              style={{ width: "auto", maxHeight: "440px" }}
            />
          </div>
        </div>
        <div className="geo-winner-band">
          <div>
            <p className="label">Siste SlowGeo-vinner — protokollført med høytid</p>
            <p className="value">
              {computedLatest?.winnerNames.join(", ") || "Ingen låst runde ennå"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Tellende runder"
          value={lockedRounds.length}
          detail={drafts ? "Utkast i protokollen" : "Alle starter rent"}
          tone="blue"
          index={0}
        />
        <StatTile
          label="Poengleder"
          value={leader ? leader.player.shortName : "-"}
          detail={leader ? `${leader.totalPoints} poeng` : "Embetsverket venter"}
          tone="green"
          index={1}
        />
        <StatTile
          label="Kattometerleder"
          value={kattometerLeader ? kattometerLeader.player.shortName : "-"}
          detail={kattometerLeader ? formatKm(kattometerLeader.totalKattometer) : "Ingen bom ført"}
          tone="gold"
          index={2}
        />
        <StatTile
          label="Åpne ting-saker"
          value={openGeotingCases}
          detail="GeoTinget venter"
          tone="red"
          index={3}
        />
      </div>

      <RotatingGeotiaQuote quotes={knowledgeQuotes} />

      <GeoGuessrTipTicker tips={dailyTips} />

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
              prefetch={false}
              className="inline-flex h-10 items-center gap-2 rounded bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]"
            >
              Full tabell
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              <LinkPendingIndicator />
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
              prefetch={false}
              className="inline-flex h-10 items-center gap-2 rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]"
            >
              Før runde
              <TableProperties className="h-4 w-4" aria-hidden="true" />
              <LinkPendingIndicator />
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
            <Link href="/arkiv" prefetch={false} className="inline-flex h-10 items-center gap-2 rounded bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]">
              Åpne
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <LinkPendingIndicator />
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
