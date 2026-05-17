import Link from "next/link";
import { ArrowRight, Medal, Shield, Sparkles, TableProperties, Trophy } from "lucide-react";

import { Section, StatTile } from "@/components/section";
import { computeGameStandings, computeStandings, getHallOfFame } from "@/lib/scoring";
import { getAppState } from "@/lib/store";
import type { GameDefinition, GameStanding, Standing } from "@/lib/types";
import { formatKm, formatNumber, formatScore } from "@/lib/utils";

export const metadata = {
  title: "Tabeller",
};

export default async function TablesPage() {
  const state = await getAppState();
  const standings = computeStandings(state.players, state.rounds);
  const hall = getHallOfFame(standings, state.rounds, state.players);
  const leader = standings[0];
  const kattometerLeader = standings
    .filter((standing) => standing.lockedRounds > 0)
    .sort((a, b) => a.totalKattometer - b.totalKattometer)[0];
  const scoreGames = state.games.filter((game) => game.id !== "slowgeo");

  return (
    <div className="space-y-7">
      <section className="geotia-frame rounded p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430] sm:tracking-[0.22em]">
          Poengmakt · kattometer · ære
        </p>
        <h1 className="font-display mt-2 break-words text-4xl font-semibold tracking-normal text-[#062b40] sm:text-5xl">
          Rikets tabeller
        </h1>
        <p className="mt-3 max-w-3xl text-[#60553f]">
          SlowGeo-tabellen, de nyere spilltabellene og Æreshallen er samlet her,
          slik at toppnavigasjonen kan puste uten at staten mister protokollen.
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <StatTile label="Poengleder" value={leader?.player.shortName ?? "-"} detail={`${leader?.totalPoints ?? 0} poeng`} tone="blue" />
        <StatTile label="Lavest kattometer" value={kattometerLeader?.player.shortName ?? "-"} detail={formatKm(kattometerLeader?.totalKattometer)} tone="green" />
        <StatTile label="Tellende runder" value={standings[0]?.lockedRounds ?? 0} detail="SlowGeo-protokollen" tone="gold" />
      </div>

      <Section
        title="SlowGeo-tabell"
        eyebrow="Offisiell poenglov"
        action={
          <Link href="/runder" className="inline-flex h-10 items-center gap-2 rounded bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]">
            Før SlowGeo
            <TableProperties className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      >
        <SlowGeoMobileCards standings={standings} />
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-[#203c62] text-xs uppercase tracking-[0.12em] text-white">
              <tr>
                <th className="px-3 py-3">Rang</th>
                <th className="px-3 py-3">Geot</th>
                <th className="px-3 py-3 text-right">Poeng</th>
                <th className="px-3 py-3 text-right">Kattometer</th>
                <th className="px-3 py-3 text-right">Runder</th>
                <th className="px-3 py-3 text-right">Seire</th>
                <th className="px-3 py-3 text-right">Topp 3</th>
                <th className="px-3 py-3 text-right">Sisteplasser</th>
                <th className="px-3 py-3 text-right">Deserteringer</th>
                <th className="px-3 py-3 text-right">Snitt p</th>
                <th className="px-3 py-3 text-right">Snitt km</th>
                <th className="px-3 py-3 text-right">Beste km</th>
                <th className="px-3 py-3 text-right">Verste km</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing) => (
                <tr key={standing.player.id} className="border-b border-[#eef1eb] bg-white last:border-b-0">
                  <td className="px-3 py-3 font-mono text-[#8e3030]">{standing.rank}</td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-8 w-1 flex-none rounded-full" style={{ background: standing.player.color }} />
                      <div className="min-w-0">
                        <p className="font-semibold text-[#161713]">{standing.player.shortName}</p>
                        <p className="text-xs text-[#5b6257]">{standing.player.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">{standing.totalPoints}</td>
                  <td className="px-3 py-3 text-right">{formatKm(standing.totalKattometer)}</td>
                  <td className="px-3 py-3 text-right">{standing.roundsPlayed}</td>
                  <td className="px-3 py-3 text-right">{standing.wins}</td>
                  <td className="px-3 py-3 text-right">{standing.top3}</td>
                  <td className="px-3 py-3 text-right">{standing.lastPlaces}</td>
                  <td className="px-3 py-3 text-right">{standing.absences}</td>
                  <td className="px-3 py-3 text-right">{formatNumber(standing.averagePoints)}</td>
                  <td className="px-3 py-3 text-right">{formatKm(standing.averageKattometer)}</td>
                  <td className="px-3 py-3 text-right">{formatKm(standing.bestKm)}</td>
                  <td className="px-3 py-3 text-right">{formatKm(standing.worstKm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        {scoreGames.map((game) => {
          const gameStandings = computeGameStandings(state.players, state.gameSessions, game);
          return <GameTable key={game.id} game={game} standings={gameStandings} />;
        })}
      </div>

      <Section
        title="Æreshallen"
        eyebrow="Automatiske rekorder"
        action={
          <Link href="/hall-of-fame" className="inline-flex h-10 items-center gap-2 rounded bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]">
            Egen sal
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
      {standings.map((standing) => (
        <article key={standing.player.id} className="rounded border border-[#d8ded0] bg-white p-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e3030]">#{standing.rank}</p>
              <h2 className="font-display mt-1 break-words text-2xl font-semibold text-[#062b40]">
                {standing.player.shortName}
              </h2>
              <p className="mt-1 break-words text-sm text-[#5b6257]">{standing.player.title}</p>
            </div>
            <span className="h-11 w-2 flex-none rounded-full" style={{ background: standing.player.color }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Metric label="Poeng" value={standing.totalPoints} />
            <Metric label="Kattometer" value={formatKm(standing.totalKattometer)} />
            <Metric label="Runder" value={standing.roundsPlayed} />
            <Metric label="Seire" value={standing.wins} />
          </div>
        </article>
      ))}
    </div>
  );
}

function GameTable({ game, standings }: { game: GameDefinition; standings: GameStanding[] }) {
  return (
    <Section title={`${game.name}-tabell`} eyebrow={game.scoreHelp}>
      <div className="grid gap-3 md:hidden">
        {standings.map((standing) => (
          <article key={standing.player.id} className="rounded border border-[#d8ded0] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e3030]">#{standing.rank}</p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">{standing.player.shortName}</h2>
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
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#203c62] text-xs uppercase tracking-[0.12em] text-white">
            <tr>
              <th className="px-3 py-3">#</th>
              <th className="px-3 py-3">Geot</th>
              <th className="px-3 py-3 text-right">Poeng</th>
              <th className="px-3 py-3 text-right">Økter</th>
              <th className="px-3 py-3 text-right">Seire</th>
              <th className="px-3 py-3 text-right">Snitt</th>
              <th className="px-3 py-3 text-right">Beste</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing) => (
              <tr key={standing.player.id} className="border-b border-[#eef1eb] bg-white last:border-b-0">
                <td className="px-3 py-3 font-mono text-[#8e3030]">{standing.rank}</td>
                <td className="px-3 py-3 font-semibold text-[#203c62]">{standing.player.shortName}</td>
                <td className="px-3 py-3 text-right font-semibold">{standing.totalPoints}</td>
                <td className="px-3 py-3 text-right">{standing.sessionsPlayed}</td>
                <td className="px-3 py-3 text-right">{standing.wins}</td>
                <td className="px-3 py-3 text-right">{formatScore(standing.averageScore, game.scoreLabel)}</td>
                <td className="px-3 py-3 text-right">{formatScore(standing.bestScore, game.scoreLabel)}</td>
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
    <div className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">{eyebrow}</p>
      <h3 className="font-display mt-1 flex items-center gap-2 text-2xl font-semibold text-[#062b40]">
        <span className="text-[#8e3030]">{icon}</span>
        {title}
      </h3>
      {rows.length ? (
        <div className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <div key={`${row.name}-${row.value}`} className="flex min-w-0 items-center justify-between gap-3 rounded border border-[#d8ded0] bg-white p-3">
              <div className="min-w-0">
                <p className="break-words font-semibold text-[#161713]">{index + 1}. {row.name}</p>
                <p className="break-words text-sm text-[#5b6257]">{row.detail}</p>
              </div>
              <p className="flex-none text-right text-sm font-semibold text-[#203c62] sm:text-base">{row.value}</p>
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
    <div className="rounded border border-[#d8c48c] bg-[#fff7e6] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7c2430]">{label}</p>
      <p className="mt-1 break-words font-semibold text-[#062b40]">{value}</p>
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
