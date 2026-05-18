import Link from "next/link";
import { ArrowRight, Gamepad2 } from "lucide-react";

import { ExpandableImage } from "@/components/expandable-image";
import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { buttonClass } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
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
          prefetch={false}
          className="archive-card group block transition hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 text-white shadow-sm"
              style={{ background: game.color, borderColor: "var(--gold-deep)" }}
            >
              <Gamepad2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-[#7c2430] transition group-hover:translate-x-1" aria-hidden="true" />
              <LinkPendingIndicator />
            </span>
          </div>
          <h3 className="mt-3 break-words">{game.shortName}</h3>
          <p className="lead-detail">
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>GeoTingets partier</Eyebrow>
          <h2 className="font-display text-3xl font-semibold uppercase tracking-[0.06em] text-[#062b40]">
            Partikort fra rikets urolige sal
          </h2>
        </div>
        <Link
          href="/arkiv/partier"
          prefetch={false}
          className={buttonClass({ variant: "quiet", size: "small" })}
        >
          Se alle vedtekter
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          <LinkPendingIndicator />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {parties.map((party) => {
          const partyLeader = players.find((player) => player.partyId === party.id);
          return (
            <article
              key={party.id}
              className="party-poster-card group overflow-hidden bg-[#fff7e6] transition hover:-translate-y-0.5"
            >
              {party.asset ? (
                <div className="poster-frame relative aspect-[4/5] w-full bg-[#061d2b]">
                  <ExpandableImage
                    src={party.asset}
                    alt={`Partikort for ${party.name}`}
                    loading="eager"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="absolute inset-0 h-full w-full"
                    imageClassName="object-cover transition duration-300 group-hover:scale-[1.02]"
                    caption={`Partikort for ${party.name}`}
                  />
                </div>
              ) : (
                <div className="poster-frame relative aspect-[4/5] bg-[#061d2b]" />
              )}
              <div className="border-t-2 border-double border-[#b8892f] p-4">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7c2430]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {party.id.toUpperCase()} · {party.ideology}
                </p>
                <h3 className="font-display mt-1 text-2xl font-semibold uppercase tracking-[0.06em] text-[#062b40]">
                  {party.name.split(" - ")[0]}
                </h3>
                <p
                  className="mt-2 text-sm leading-6 text-[#55452f]"
                  style={{ fontFamily: "var(--font-italic)", fontStyle: "italic" }}
                >
                  {party.motto}. Leder: {partyLeader?.shortName ?? party.leader}.
                </p>
                <Link
                  href={`/arkiv/partier#${party.id}`}
                  prefetch={false}
                  className={`${buttonClass({ variant: "quiet", size: "small" })} mt-4`}
                >
                  Åpne partiarkiv
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  <LinkPendingIndicator />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
