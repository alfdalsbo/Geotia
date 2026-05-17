import Link from "next/link";
import { BellRing, MapPinned } from "lucide-react";

import { GeotingMiniCountdown } from "@/components/geoting-countdown";
import type { Round } from "@/lib/types";

export function SlowGeoGlobalAlert({ rounds }: { rounds: Round[] }) {
  const active = rounds.filter((round) => round.status === "open" && round.challenge && round.deadlineAt);
  const primary = active[0];
  if (!primary) return null;

  return (
    <div className="border-b border-[#9dd7b0]/65 bg-[#06311f] text-[#f4fff7] shadow-[0_12px_28px_rgba(6,49,31,0.28)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded border border-[#9dd7b0]/70 bg-[#9dd7b0] text-[#06311f] shadow-[0_0_22px_rgba(157,215,176,0.55)]">
            <BellRing className="h-5 w-5 animate-pulse" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9dd7b0] sm:tracking-[0.2em]">
              SlowGeo pågår nå
            </p>
            <p className="mt-1 break-words font-semibold leading-6">
              {primary.name}
              {active.length > 1 ? ` + ${active.length - 1} til` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <p aria-live="polite" className="rounded border border-[#9dd7b0]/45 bg-[#020b11]/55 px-3 py-2 text-sm font-semibold">
            Frist <GeotingMiniCountdown endsAt={primary.deadlineAt} />
          </p>
          <Link
            href={`/runder/${primary.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded bg-[#9dd7b0] px-3 text-sm font-semibold text-[#062113] transition hover:bg-[#b9e7c7]"
          >
            <MapPinned className="h-4 w-4" aria-hidden="true" />
            Gå til SlowGeo
          </Link>
        </div>
      </div>
    </div>
  );
}
