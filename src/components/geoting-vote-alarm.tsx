import Link from "next/link";
import { BellRing, Gavel } from "lucide-react";

import { GeotingCountdown } from "@/components/geoting-countdown";
import type { GeotingProposal } from "@/lib/types";

export function GeotingVoteAlarm({
  proposals,
  context = "dashboard",
}: {
  proposals: GeotingProposal[];
  context?: "dashboard" | "geotinget";
}) {
  const active = proposals.filter((proposal) => proposal.status === "voting" && proposal.voteEndsAt);
  if (!active.length) return null;

  return (
    <section className="relative overflow-hidden rounded border-2 border-[#7c2430] bg-[#3b0e16] text-[#fff7e6] shadow-[0_24px_55px_rgba(124,36,48,0.34)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(90deg,#e1c06c_0,#e1c06c_18px,#7c2430_18px,#7c2430_36px)]" />
      <div className="grid gap-0 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <div className="p-5 sm:p-6">
          <p className="inline-flex items-center gap-2 rounded border border-[#e1c06c]/55 bg-[#020b11]/35 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#e1c06c] sm:tracking-[0.22em]">
            <BellRing className="h-4 w-4" aria-hidden="true" />
            GeoTinget kaller
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold leading-tight sm:text-5xl">
            Stemmeurnen er åpen
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#f5ddad]">
            Alle geoter er herved varslet ved synlig statlig uro. Saken står
            på tingvollen med levende frist, og unnlatelse blir ikke mindre
            synlig av at man later som man ikke så dette.
          </p>
          {context === "dashboard" ? (
            <Link
              href="/geotinget/avstemninger"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded bg-[#e1c06c] px-4 text-sm font-semibold text-[#321018] shadow-sm transition hover:bg-[#f0d78f]"
            >
              <Gavel className="h-4 w-4" aria-hidden="true" />
              Gå til avstemning
            </Link>
          ) : null}
        </div>
        <div className="border-t border-[#e1c06c]/35 bg-[#020b11]/40 p-4 sm:p-5 xl:border-l xl:border-t-0">
          <div className={context === "dashboard" ? "grid gap-3 lg:grid-cols-2 xl:grid-cols-1" : "grid gap-3 lg:grid-cols-2"}>
            {active.slice(0, 4).map((proposal) => (
              <article key={proposal.id} className="rounded border border-[#e1c06c]/45 bg-[#fff7e6]/8 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">
                  Tingfrist
                </p>
                <h3 className="mt-1 line-clamp-2 font-semibold text-[#fff7e6]">{proposal.title}</h3>
                <div className="mt-3">
                  <GeotingCountdown endsAt={proposal.voteEndsAt} compact title="Levende frist" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
