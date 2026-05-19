import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Medal, Shield, Sparkles, TableProperties, Trophy } from "lucide-react";

import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { Section, StatTile } from "@/components/section";
import { SlowGeoSubnav } from "@/components/slowgeo-subnav";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RankMark } from "@/components/ui/rank-mark";
import { Stamp } from "@/components/ui/stamp";
import { computeGameStandings, computeStandings, geotStatus, getHallOfFame } from "@/lib/scoring";
import { getScoreboardState } from "@/lib/store";
import type { GameDefinition, GameStanding, Standing } from "@/lib/types";
import { formatKm, formatNumber, formatScore } from "@/lib/utils";
import { getVisibleGames } from "@/lib/visible-games";

export const metadata = {
  title: "Tabeller",
};

export default async function TablesPage() {
  const state = await getScoreboardState();
  const standings = computeStandings(state.players, state.rounds);
  const hall = getHallOfFame(standings, state.rounds, state.players);
  const leader = standings[0];
  const kattometerLeader = standings
    .filter((standing) => standing.lockedRounds > 0)
    .sort((a, b) => a.totalKattometer - b.totalKattometer)[0];
  const scoreGames = getVisibleGames(state.games).filter((game) => game.id !== "slowgeo");
  const oldSlowGeo = state.archive.oldSlowGeo;
  const oldPointLeader = [...oldSlowGeo].sort((a, b) => b.points - a.points)[0];
  const oldKattometerLeader = [...oldSlowGeo].sort((a, b) => a.kattometer - b.kattometer)[0];

  return (
    <div className="space-y-7">
      <section className="geo-hero">
        <div className="geo-hero-grid">
          <div className="geo-hero-text">
            <Eyebrow>Poengmakt · kattometer · ære · Kapittel III</Eyebrow>
            <h1 className="geo-hero-title">Rikets tabeller</h1>
            <p className="geo-hero-lead geo-hero-lead-dropcap">
              SlowGeo-tabellen, den gamle æraen og Æreshallen er samlet her,
              slik at toppnavigasjonen kan puste uten at staten mister
              protokollens lange hukommelse.
            </p>
          </div>
          <div className="geo-hero-poster">
            <Image
              src="/illustrations/vapen-tabeller.svg"
              alt="Riksvåpen for Tabellene"
              width={300}
              height={350}
              priority
              style={{ width: "auto", maxHeight: "440px" }}
            />
          </div>
        </div>
      </section>

      <SlowGeoSubnav />

      <div className="grid gap-3 md:grid-cols-3">
        <StatTile label="Poengleder" value={leader?.player.shortName ?? "-"} detail={`${leader?.totalPoints ?? 0} poeng`} tone="blue" index={0} />
        <StatTile label="Lavest kattometer" value={kattometerLeader?.player.shortName ?? "-"} detail={formatKm(kattometerLeader?.totalKattometer)} tone="green" index={1} />
        <StatTile label="Tellende runder" value={standings[0]?.lockedRounds ?? 0} detail="SlowGeo-protokollen" tone="gold" index={2} />
      </div>

      <Section
        title="SlowGeo-tabell"
        eyebrow="Offisiell poenglov"
        action={
          <Link href="/spill/slowgeo" prefetch={false} className="inline-flex h-10 items-center gap-2 rounded bg-[#fdf7e8] px-3 text-sm font-semibold text-[#062b40]">
            Åpne SlowGeo
            <TableProperties className="h-4 w-4" aria-hidden="true" />
            <LinkPendingIndicator />
          </Link>
        }
      >
        <SlowGeoMobileCards standings={standings} />
        <div className="hidden overflow-x-auto md:block">
          <table className="protocol w-full min-w-[1180px]">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Geot</th>
                <th className="right">Poeng</th>
                <th className="right">Kattometer</th>
                <th className="right">Runder</th>
                <th className="right">Seire</th>
                <th className="right">Topp 3</th>
                <th className="right">Snitt p</th>
                <th className="right">Snitt km</th>
                <th className="right">Beste km</th>
                <th className="right">Verste km</th>
                <th className="right">Status</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing) => (
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
                  <td className="right">{standing.roundsPlayed}</td>
                  <td className="right">{standing.wins}</td>
                  <td className="right">{standing.top3}</td>
                  <td className="right">{formatNumber(standing.averagePoints)}</td>
                  <td className="right">{formatKm(standing.averageKattometer)}</td>
                  <td className="right">{formatKm(standing.bestKm)}</td>
                  <td className="right">{formatKm(standing.worstKm)}</td>
                  <td className="right">
                    {(() => {
                      const status = geotStatus(standing);
                      const tone = status === "SOLID" || status === "JEVN" ? "signal" : "alarm";
                      return <Stamp tone={tone}>{status}</Stamp>;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {oldSlowGeo.length ? (
        <Section
          title="Gammel SlowGeo"
          eyebrow="Historisk import, egen æra"
          action={
            <Link href="/arkiv/gammel-slowgeo" prefetch={false} className="inline-flex h-10 items-center gap-2 rounded bg-[#fdf7e8] px-3 text-sm font-semibold text-[#062b40]">
              Åpne arkiv
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              <LinkPendingIndicator />
            </Link>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded border border-[#d8ded0] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">Gammel poengleder</p>
              <p className="font-display mt-2 text-2xl font-semibold text-[#062b40]">{oldPointLeader?.player ?? "-"}</p>
              <p className="mt-1 text-sm text-[#5b6257]">{oldPointLeader?.points ?? 0} poeng</p>
            </div>
            <div className="rounded border border-[#d8ded0] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">Gammel presisjonsleder</p>
              <p className="font-display mt-2 text-2xl font-semibold text-[#062b40]">{oldKattometerLeader?.player ?? "-"}</p>
              <p className="mt-1 text-sm text-[#5b6257]">{formatKm(oldKattometerLeader?.kattometer)}</p>
            </div>
          </div>
          <p className="mt-4 rounded border border-[#c49a3c]/35 bg-[#fdf7e8] p-4 text-sm leading-6 text-[#4f412b]">
            Den gamle tabellen er synlig for historikk og ære, men blandes ikke inn i dagens levende rangering.
          </p>
        </Section>
      ) : null}

      {scoreGames.length ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {scoreGames.map((game) => {
            const gameStandings = computeGameStandings(state.players, state.gameSessions, game);
            return <GameTable key={game.id} game={game} standings={gameStandings} />;
          })}
        </div>
      ) : null}

      <Section
        title="Æreshallen"
        eyebrow="Automatiske rekorder"
        action={
          <Link href="/hall-of-fame" prefetch={false} className="inline-flex h-10 items-center gap-2 rounded bg-[#fdf7e8] px-3 text-sm font-semibold text-[#062b40]">
            Egen sal
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <LinkPendingIndicator />
          </Link>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Podium title="Flest poeng" eyebrow="Poengmestere" icon={<Trophy className="h-5 w-5" aria-hidden="true" />} rows={hall.mostPoints.map((standing) => ({
            name: standing.player.shortName,
            value: `${standing.totalPoints} poeng`,
            detail: `${standing.roundsPlayed} runder spilt`,
          }))} />
          <Podium title="Lavest kattometer" eyebrow="Presisjonsadelen" icon={<Shield className="h-5 w-5" aria-hidden="true" />} rows={hall.lowestKattometer.map((standing) => ({
            name: standing.player.shortName,
            value: formatKm(standing.totalKattometer),
            detail: `${formatKm(standing.averageKattometer)} i snitt`,
          }))} />
          <Podium title="Flest seire" eyebrow="Kampvinnere" icon={<Medal className="h-5 w-5" aria-hidden="true" />} rows={hall.mostWins.map((standing) => ({
            name: standing.player.shortName,
            value: `${standing.wins} seire`,
            detail: `${standing.totalPoints} poeng totalt`,
          }))} />
          <Podium title="Beste snittpoeng" eyebrow="Jevn overmakt" icon={<Sparkles className="h-5 w-5" aria-hidden="true" />} rows={hall.bestAveragePoints.map((standing) => ({
            name: standing.player.shortName,
            value: formatNumber(standing.averagePoints),
            detail: `${standing.roundsPlayed} runder spilt`,
          }))} />
        </div>
      </Section>
    </div>
  );
}

function SlowGeoMobileCards({ standings }: { standings: Standing[] }) {
  return (
    <div className="grid gap-3 md:hidden">
      {standings.map((standing) => {
        const status = geotStatus(standing);
        const stampTone = status === "SOLID" || status === "JEVN" ? "signal" : "alarm";
        return (
          <article key={standing.player.id} className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <RankMark rank={standing.rank} />
              <div className="min-w-0 flex-1">
                <div className="geot-name">{standing.player.shortName}</div>
                <div className="geot-title">{standing.player.title}</div>
              </div>
              <Stamp tone={stampTone}>{status}</Stamp>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Metric label="Poeng" value={standing.totalPoints} />
              <Metric label="Kattometer" value={formatKm(standing.totalKattometer)} />
              <Metric label="Runder" value={standing.roundsPlayed} />
              <Metric label="Seire" value={standing.wins} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function GameTable({ game, standings }: { game: GameDefinition; standings: GameStanding[] }) {
  return (
    <Section title={`${game.name}-tabell`} eyebrow={game.scoreHelp}>
      <div className="grid gap-3 md:hidden">
        {standings.map((standing) => (
          <article key={standing.player.id} className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <RankMark rank={standing.rank} />
              <div className="min-w-0 flex-1">
                <div className="geot-name">{standing.player.shortName}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Metric label="Poeng" value={standing.totalPoints} />
              <Metric label="Økter" value={standing.sessionsPlayed} />
              <Metric label="Seire" value={standing.wins} />
              <Metric label="Beste" value={formatScore(standing.bestScore, game.scoreLabel)} />
            </div>
          </article>
        ))}
        {!standings.length ? <EmptyRecord text="Ingen økter ført ennå." /> : null}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="protocol w-full min-w-[720px]">
          <thead>
            <tr>
              <th>Rang</th>
              <th>Geot</th>
              <th className="right">Poeng</th>
              <th className="right">Økter</th>
              <th className="right">Seire</th>
              <th className="right">Snitt</th>
              <th className="right">Beste</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => (
              <tr key={standing.player.id}>
                <td><RankMark rank={standing.rank} /></td>
                <td><div className="geot-name">{standing.player.shortName}</div></td>
                <td className="right"><span className="num-display">{standing.totalPoints}</span></td>
                <td className="right">{standing.sessionsPlayed}</td>
                <td className="right">{standing.wins}</td>
                <td className="right">{formatScore(standing.averageScore, game.scoreLabel)}</td>
                <td className="right">{formatScore(standing.bestScore, game.scoreLabel)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Podium({
  title,
  eyebrow,
  icon,
  rows,
}: {
  title: string;
  eyebrow: string;
  icon: React.ReactNode;
  rows: Array<{ name: string; value: string; detail: string }>;
}) {
  return (
    <div className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4 shadow-sm">
      <p className="font-italic-serif text-xs italic text-[#7e5a18]">{eyebrow}</p>
      <h3 className="font-display mt-1 flex items-center gap-2 text-xl font-bold uppercase tracking-[0.18em] text-[#062b40]">
        <span className="text-[#7e5a18]" aria-hidden="true">{icon}</span>
        {title}
      </h3>
      {rows.length ? (
        <div className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <div
              key={`${row.name}-${row.value}`}
              className="flex min-w-0 items-center justify-between gap-3 rounded border border-[#c49a3c]/30 bg-[#fffbe9] p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <RankMark rank={index + 1} />
                <div className="min-w-0">
                  <p className="geot-name break-words">{row.name}</p>
                  <p className="geot-title break-words">{row.detail}</p>
                </div>
              </div>
              <span className="num-display flex-none text-right">{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyRecord text="Æreshallen avventer første låste runde." />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mobile-metric rounded border border-[#d8c48c] bg-[#fdf7e8] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7c2430]">{label}</p>
      <p className="mobile-metric-value mt-1 break-words font-semibold text-[#062b40]">{value}</p>
    </div>
  );
}

function EmptyRecord({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded border border-dashed border-[#b8892f] bg-[#b8892f]/8 p-4 text-sm text-[#7b591d]">
      {text}
    </div>
  );
}
