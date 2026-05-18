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
import { RankMark } from "@/components/ui/rank-mark";
import { Stamp } from "@/components/ui/stamp";
import { getGeoGuessrTipDaySeed, selectGeoGuessrTips } from "@/lib/geoguessr-tips";
import { geotiaDashboardLines, geotiaTipLines, pickGeoticLine } from "@/lib/geotia-jargon";
import { computeGameStandings, geotStatus, getHallOfFame, computeRound, computeStandings } from "@/lib/scoring";
import { getAppState } from "@/lib/store";
import { cn, dateLabel, formatKm, formatNumber } from "@/lib/utils";

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
            {standings.map((standing) => {
              const status = geotStatus(standing);
              const stampTone = status === "SOLID" || status === "JEVN" ? "signal" : "alarm";
              return (
                <article key={standing.player.id} className="rounded border border-[#c49a3c]/45 bg-[#fff7e6] p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <RankMark rank={standing.rank} />
                    <div className="min-w-0 flex-1">
                      <div className="geot-name">{standing.player.shortName}</div>
                      <div className="geot-title">{standing.player.title}</div>
                    </div>
                    <Stamp tone={stampTone}>{status}</Stamp>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <MobileMetric label="Poeng" value={standing.totalPoints} />
                    <MobileMetric label="Kattometer" value={formatKm(standing.totalKattometer)} />
                    <MobileMetric label="Seire" value={standing.wins} />
                    <MobileMetric label="Topp 3" value={standing.top3} />
                  </div>
                </article>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="protocol w-full min-w-[720px]">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Geot</th>
                  <th className="right">Poeng</th>
                  <th className="right">Kattometer</th>
                  <th className="right">Seire</th>
                  <th className="right">Topp 3</th>
                  <th className="right">Status</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing) => {
                  const status = geotStatus(standing);
                  const stampTone = status === "SOLID" || status === "JEVN" ? "signal" : "alarm";
                  return (
                    <tr key={standing.player.id}>
                      <td><RankMark rank={standing.rank} /></td>
                      <td>
                        <div className="geot-cell">
                          <span className="geot-flag" style={{ background: standing.player.color }} />
                          <div className="min-w-0">
                            <div className="geot-name">{standing.player.shortName}</div>
                            <div className="geot-title">{standing.player.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="right"><span className="num-display">{standing.totalPoints}</span></td>
                      <td className="right">{formatKm(standing.totalKattometer)}</td>
                      <td className="right">{standing.wins}</td>
                      <td className="right">{standing.top3}</td>
                      <td className="right"><Stamp tone={stampTone}>{status}</Stamp></td>
                    </tr>
                  );
                })}
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
        <article className="archive-card">
          <div className="crown-icon">
            <Trophy className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7e5a18]" style={{ fontFamily: "var(--font-display)" }}>
            Automatiske rekorder
          </p>
          <h3>Æreshallen</h3>
          <p className="lead-name mt-3">{hall.mostPoints[0]?.player.shortName ?? "-"}</p>
          <p className="lead-detail">Flest poeng · {hall.mostPoints[0]?.totalPoints ?? 0} poeng</p>
          <p className="lead-detail">
            <Crown className="mr-1 inline h-3 w-3 text-[#194832]" aria-hidden="true" />
            Flest seire: {hall.mostWins[0]?.player.shortName ?? "-"} ({hall.mostWins[0]?.wins ?? 0})
          </p>
          <p className="mt-3"><Stamp tone="brass">REKORD ARKIVERT</Stamp></p>
        </article>

        <article className="archive-card">
          <div className="crown-icon" style={{ background: "radial-gradient(circle, #f0b0b8, var(--burgundy))", color: "#fff7e0" }}>
            <ScrollText className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7e5a18]" style={{ fontFamily: "var(--font-display)" }}>
            Kattometer
          </p>
          <h3>Skammens protokoll</h3>
          <p className="lead-name mt-3">
            {hall.worstSingle ? hall.worstSingle.result.player.shortName : "-"}
          </p>
          <p className="lead-detail">
            Verste enkeltbom: {hall.worstSingle ? formatKm(hall.worstSingle.result.actualKm) : "Ingen skam ført ennå"}
          </p>
          <p className="lead-detail">
            Beste: {hall.bestSingle ? `${hall.bestSingle.result.player.shortName} · ${formatKm(hall.bestSingle.result.actualKm)}` : "Ingen udødelige øyeblikk ennå"}
          </p>
          <p className="mt-3"><Stamp tone="alarm">EVIG REGISTRERT</Stamp></p>
        </article>

        <article className="archive-card">
          <div className="crown-icon">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7e5a18]" style={{ fontFamily: "var(--font-display)" }}>
            Leksikon
          </p>
          <h3>Oppslagsverket</h3>
          <p className="lead-name mt-3">{formatNumber(state.archive.lexicon.length)} oppføringer</p>
          <p className="lead-detail">
            <Gavel className="mr-1 inline h-3 w-3 text-[#7c2430]" aria-hidden="true" />
            {state.archive.geotingCases.length} protokollførte saker
          </p>
          <p className="lead-detail">
            <UsersRound className="mr-1 inline h-3 w-3 text-[#062b40]" aria-hidden="true" />
            Arkivet er ikke nøytralt. Det er bare pent ført.
          </p>
          <Link
            href="/arkiv"
            prefetch={false}
            className={cn(buttonClass({ variant: "quiet", size: "small" }), "mt-4")}
          >
            Åpne <BookOpen className="h-3 w-3" aria-hidden="true" />
            <LinkPendingIndicator />
          </Link>
        </article>
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
