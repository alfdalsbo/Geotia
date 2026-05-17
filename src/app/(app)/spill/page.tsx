import Link from "next/link";
import { ArrowRight, Gamepad2, MapPinned, Trophy } from "lucide-react";

import { GameSessionForm } from "@/components/game-session-form";
import { Section, StatTile } from "@/components/section";
import { computeGameSession, computeGameStandings, computeStandings } from "@/lib/scoring";
import { getAppState, makeEmptyGameSession } from "@/lib/store";
import { dateLabel, formatKm, formatScore } from "@/lib/utils";

export const metadata = {
  title: "Spill",
};

export default async function GamesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const state = await getAppState();
  const slowGeoStandings = computeStandings(state.players, state.rounds);
  const gameSessions = state.gameSessions;
  const scoreGames = state.games.filter((game) => game.id !== "slowgeo");
  const recentSessions = [...gameSessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  return (
    <div className="space-y-7">
      <section className="geotia-frame geotia-temple rounded p-5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
          Spillnasjonen · mange ritualer · null historisk bagasje
        </p>
        <h1 className="font-display mt-2 text-5xl font-semibold tracking-normal text-[#062b40]">
          Geotias spillkammer
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-[#4f412b]">
          SlowGeo lever fortsatt med kattometeret. Geo, MapTap, Satle og Globle får
          egne tabeller, egne ritualer og automatisk rangering når score føres.
          Stortabellen får vente til riket tåler sin egen storhet.
        </p>
      </section>

      {params.status ? (
        <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
          Spilløkten er ført. Tabellen har flyttet på folk med den nødvendige verdighet.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {state.games.map((game) => {
          const sessions =
            game.id === "slowgeo"
              ? state.rounds.filter((round) => round.status === "locked").length
              : gameSessions.filter((session) => session.gameId === game.id).length;
          const leader =
            game.id === "slowgeo"
              ? slowGeoStandings[0]
              : computeGameStandings(state.players, gameSessions, game)[0];
          return (
            <article key={game.id} className="geotia-panel rounded p-4">
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded border border-[#c49a3c]/45 text-white"
                  style={{ background: game.color }}
                >
                  <Gamepad2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="rounded border border-[#c49a3c]/35 bg-[#fff7e6] px-2 py-1 text-xs font-semibold text-[#7c2430]">
                  {sessions} økter
                </span>
              </div>
              <h2 className="font-display mt-4 text-2xl font-semibold text-[#062b40]">{game.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[#60553f]">{game.description}</p>
              <p className="mt-3 text-sm font-semibold text-[#194832]">
                Leder: {leader?.player.shortName ?? "-"}
              </p>
            </article>
          );
        })}
      </div>

      <Section title="Før ny spilløkt" eyebrow="Geo, MapTap, Satle og Globle">
        <GameSessionForm session={makeEmptyGameSession()} />
      </Section>

      <Section
        title="SlowGeo"
        eyebrow="Kattometerets gamle hus"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/runder"
              className="inline-flex h-10 items-center gap-2 rounded bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]"
            >
              Før SlowGeo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/tabeller"
              className="inline-flex h-10 items-center gap-2 rounded border border-[#fff7e6]/55 px-3 text-sm font-semibold text-[#fff7e6]"
            >
              Tabell
              <Trophy className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <StatTile
            label="Poengleder"
            value={slowGeoStandings[0]?.player.shortName ?? "-"}
            detail={`${slowGeoStandings[0]?.totalPoints ?? 0} poeng`}
            tone="blue"
          />
          <StatTile
            label="Lavest kattometer"
            value={
              slowGeoStandings.filter((standing) => standing.lockedRounds > 0).sort((a, b) => a.totalKattometer - b.totalKattometer)[0]?.player.shortName ?? "-"
            }
            detail={formatKm(
              slowGeoStandings.filter((standing) => standing.lockedRounds > 0).sort((a, b) => a.totalKattometer - b.totalKattometer)[0]?.totalKattometer,
            )}
            tone="green"
          />
          <StatTile
            label="Tellende runder"
            value={state.rounds.filter((round) => round.status === "locked").length}
            detail="Alle står på 0 til nye runder føres"
            tone="gold"
          />
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        {scoreGames.map((game) => {
          const standings = computeGameStandings(state.players, gameSessions, game);
          return (
            <Section key={game.id} title={`${game.name}-tabell`} eyebrow={game.scoreHelp}>
              <div className="grid gap-3 md:hidden">
                {standings.map((standing) => (
                  <article key={standing.player.id} className="rounded border border-[#d8ded0] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e3030]">#{standing.rank}</p>
                    <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">{standing.player.shortName}</h2>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <MobileMetric label="Poeng" value={standing.totalPoints} />
                      <MobileMetric label="Økter" value={standing.sessionsPlayed} />
                      <MobileMetric label="Seire" value={standing.wins} />
                      <MobileMetric label="Beste" value={formatScore(standing.bestScore, game.scoreLabel)} />
                    </div>
                  </article>
                ))}
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
        })}
      </div>

      <Section title="Siste spilløkter" eyebrow="Nye annaler">
        {recentSessions.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {recentSessions.map((session) => {
              const game = state.games.find((candidate) => candidate.id === session.gameId);
              if (!game) return null;
              const computed = computeGameSession(session, state.players, game);
              return (
                <article key={session.id} className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
                    {game.name} · {dateLabel(session.date)}
                  </p>
                  <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">
                    {session.title}
                  </h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#60553f]">
                    <Trophy className="h-4 w-4 text-[#b8892f]" aria-hidden="true" />
                    Vinner: {computed.winnerNames.join(", ") || "-"} · {computed.participantCount} geoter
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded border border-dashed border-[#c49a3c] bg-[#c49a3c]/10 p-5">
            <p className="flex items-center gap-2 font-display text-2xl font-semibold text-[#654517]">
              <MapPinned className="h-5 w-5" aria-hidden="true" />
              Ingen nye spilløkter ført ennå.
            </p>
            <p className="mt-2 text-sm text-[#60553f]">Alle tabeller står på 0. Riket er nyvasket.</p>
          </div>
        )}
      </Section>
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
