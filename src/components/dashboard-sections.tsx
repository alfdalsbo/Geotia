import Link from "next/link";
import { ArrowRight, Gamepad2 } from "lucide-react";

import { ExpandableImage } from "@/components/expandable-image";
import type { Party, Player } from "@/lib/types";

type GameCard = {
  id: string;
  shortName: string;
  color: string;
  href: string;
  count: number;
  leaderName: string;
};

export function DashboardGameGrid({ games }: { games: GameCard[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-5">
      {games.map((game) => (
        <Link
          key={game.id}
          href={game.href}
          className="geotia-panel group rounded p-4 transition hover:-translate-y-0.5 hover:border-[#c49a3c]"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div
              className="flex h-10 w-10 items-center justify-center rounded border border-[#c49a3c]/45 text-white"
              style={{ background: game.color }}
            >
              <Gamepad2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <ArrowRight className="h-4 w-4 text-[#7c2430] transition group-hover:translate-x-1" aria-hidden="true" />
          </div>
          <h2 className="font-display relative z-10 mt-4 text-2xl font-semibold text-[#062b40]">
            {game.shortName}
          </h2>
          <p className="relative z-10 mt-2 text-sm leading-6 text-[#60553f]">
            {game.count} økter · leder {game.leaderName}
          </p>
        </Link>
      ))}
    </section>
  );
}

export function DashboardPartyGrid({ parties, players }: { parties: Party[]; players: Player[] }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
            GeoTingets partier
          </p>
          <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
            Partikort fra rikets urolige sal
          </h2>
        </div>
        <Link
          href="/arkiv/partier"
          className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[#062b40]/30 bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40] transition hover:border-[#c49a3c]"
        >
          Se alle vedtekter
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {parties.map((party) => {
          const partyLeader = players.find((player) => player.partyId === party.id);
          return (
            <article
              key={party.id}
              className="group overflow-hidden rounded border border-[#c49a3c]/45 bg-[#fff7e6] shadow-[0_16px_28px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:border-[#e1c06c]"
            >
              {party.asset ? (
                <ExpandableImage
                  src={party.asset}
                  alt={`Partikort for ${party.name}`}
                  loading="eager"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="relative aspect-[4/5] w-full bg-[#061d2b]"
                  imageClassName="object-cover transition duration-300 group-hover:scale-[1.02]"
                  caption={`Partikort for ${party.name}`}
                />
              ) : (
                <div className="relative aspect-[4/5] bg-[#061d2b]" />
              )}
              <div className="border-t border-[#c49a3c]/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c2430]">
                  {party.id.toUpperCase()} · {party.ideology}
                </p>
                <h3 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">
                  {party.name.split(" - ")[0]}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#55452f]">
                  {party.motto}. Leder: {partyLeader?.shortName ?? party.leader}.
                </p>
                <Link
                  href={`/arkiv/partier#${party.id}`}
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded border border-[#062b40]/25 bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40] transition hover:border-[#c49a3c]"
                >
                  Åpne partiarkiv
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
