import Link from "next/link";
import { ArrowLeft, Gamepad2 } from "lucide-react";

import { GameSessionForm } from "@/components/game-session-form";
import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { Section } from "@/components/section";
import { games } from "@/lib/seed";
import { makeEmptyGameSession } from "@/lib/store";
import type { GameId } from "@/lib/types";

export const metadata = {
  title: "Før spilløkt",
};

const scoreGames = games.filter((game) => game.id !== "slowgeo");

function selectedGameId(value: string | undefined): GameId {
  const selected = scoreGames.find((game) => game.id === value);
  return selected?.id ?? "geo";
}

export default async function RegisterGamePage({
  searchParams,
}: {
  searchParams?: Promise<{ game?: string; status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const gameId = selectedGameId(params.game);
  const game = scoreGames.find((candidate) => candidate.id === gameId);

  return (
    <div className="space-y-7">
      <section className="geotia-frame rounded p-5 sm:p-8">
        <Link
          href="/spill"
          prefetch={false}
          className="inline-flex h-10 items-center gap-2 rounded border border-[#062b40]/30 bg-[#fdf7e8] px-3 text-sm font-semibold text-[#062b40]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Til spillkammeret
          <LinkPendingIndicator />
        </Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
          Geo · MapTap · Satle · Globle
        </p>
        <h1 className="font-display mt-2 text-5xl font-semibold tracking-normal text-[#062b40]">
          Før spilløkt
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-[#4f412b]">
          Registrer resultatene for de raske spillene. SlowGeo starter i eget rom,
          fordi Street View, krangling og låste pins krever sin egen sal.
        </p>
      </section>

      {params.status === "lagret" ? (
        <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
          Spilløkten er ført. Tabellen har flyttet på folk med den nødvendige verdighet.
        </div>
      ) : null}

      <Section
        title={game ? `Ny ${game.name}-økt` : "Ny spilløkt"}
        eyebrow={game?.scoreHelp ?? "Før resultat"}
        action={
          <span className="inline-flex h-10 items-center gap-2 rounded bg-[#fdf7e8] px-3 text-sm font-semibold text-[#062b40]">
            <Gamepad2 className="h-4 w-4" aria-hidden="true" />
            {game?.shortName ?? "Spill"}
          </span>
        }
      >
        <GameSessionForm session={makeEmptyGameSession(gameId)} />
      </Section>
    </div>
  );
}
