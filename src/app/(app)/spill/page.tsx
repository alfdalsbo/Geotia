import Link from "next/link";
import { ArrowRight, Gamepad2, MapPinned, TableProperties, Trophy } from "lucide-react";

import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { computeGameStandings, computeStandings } from "@/lib/scoring";
import { getGamesState } from "@/lib/store";
import type { GameDefinition } from "@/lib/types";

export const metadata = {
  title: "Spill",
};

function gameHref(game: GameDefinition) {
  return game.id === "slowgeo" ? "/spill/slowgeo" : `/spill/registrer?game=${game.id}`;
}

function gameAction(game: GameDefinition) {
  return game.id === "slowgeo" ? "Åpne SlowGeo" : "Før økt";
}

export default async function GamesPage() {
  const state = await getGamesState();
  const slowGeoStandings = computeStandings(state.players, state.rounds);
  const openSlowGeoRounds = state.rounds.filter((round) => round.challenge && round.status === "open").length;
  const lockedSlowGeoRounds = state.rounds.filter((round) => round.challenge && round.status === "locked").length;

  return (
    <div className="space-y-7">
      <section className="geotia-frame geotia-temple rounded p-5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
          Spillnasjonen · velg arena
        </p>
        <h1 className="font-display mt-2 text-5xl font-semibold tracking-normal text-[#062b40]">
          Geotias spillkammer
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-[#4f412b]">
          Velg spillet først. SlowGeo har eget rom for Street View-bilde, pin-svar og
          deling i krangletråden. De andre spillene føres i én rask protokoll.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {state.games.map((game) => {
          const sessions =
            game.id === "slowgeo"
              ? lockedSlowGeoRounds
              : state.gameSessions.filter((session) => session.gameId === game.id).length;
          const leader =
            game.id === "slowgeo"
              ? slowGeoStandings[0]
              : computeGameStandings(state.players, state.gameSessions, game)[0];
          const href = gameHref(game);

          return (
            <article key={game.id} className="geotia-panel flex min-h-[280px] flex-col rounded p-4">
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded border border-[#c49a3c]/45 text-white"
                  style={{ background: game.color }}
                >
                  {game.id === "slowgeo" ? (
                    <MapPinned className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Gamepad2 className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <span className="rounded border border-[#c49a3c]/35 bg-[#fff7e6] px-2 py-1 text-xs font-semibold text-[#7c2430]">
                  {sessions} økter
                </span>
              </div>
              <h2 className="font-display mt-4 text-2xl font-semibold text-[#062b40]">{game.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#60553f]">{game.description}</p>
              <p className="mt-3 text-sm font-semibold text-[#194832]">
                Leder: {leader?.player.shortName ?? "-"}
              </p>
              {game.id === "slowgeo" && openSlowGeoRounds > 0 ? (
                <p className="mt-2 rounded border border-[#285c45]/25 bg-[#285c45]/10 px-2 py-1 text-xs font-semibold text-[#285c45]">
                  {openSlowGeoRounds} åpen runde
                </p>
              ) : null}
              <Link
                href={href}
                prefetch={false}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded bg-[#203c62] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172d4b]"
              >
                {gameAction(game)}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                <LinkPendingIndicator className="text-white" />
              </Link>
            </article>
          );
        })}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/tabeller"
          prefetch={false}
          className="geotia-panel group rounded p-5 transition hover:-translate-y-0.5 hover:border-[#c49a3c]"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
                Tabeller og ære
              </p>
              <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
                Se stillingen
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#60553f]">
                SlowGeo-tabell, spilltabeller og Æreshallen samlet på ett sted.
              </p>
            </div>
            <span className="flex flex-none items-center gap-2">
              <Trophy className="h-8 w-8 text-[#b8892f]" aria-hidden="true" />
              <LinkPendingIndicator />
            </span>
          </div>
        </Link>
        <Link
          href="/runder"
          prefetch={false}
          className="geotia-panel group rounded p-5 transition hover:-translate-y-0.5 hover:border-[#c49a3c]"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
                Protokoll
              </p>
              <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
                Åpne rundearkivet
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#60553f]">
                Arkiv og manuell etterføring når embetsverket trenger full kontroll.
              </p>
            </div>
            <span className="flex flex-none items-center gap-2">
              <TableProperties className="h-8 w-8 text-[#203c62]" aria-hidden="true" />
              <LinkPendingIndicator />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
