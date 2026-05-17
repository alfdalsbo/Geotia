import Link from "next/link";
import { BellRing, Gavel } from "lucide-react";

import { GeotingMiniCountdown } from "@/components/geoting-countdown";
import type { GeotingProposal } from "@/lib/types";

export function GeotingGlobalAlert({ proposals }: { proposals: GeotingProposal[] }) {
  const active = proposals.filter((proposal) => proposal.status === "voting" && proposal.voteEndsAt);
  const primary = active[0];
  if (!primary) return null;

  return (
    <div className="border-b border-[#e1c06c]/65 bg-[#3b0e16] text-[#fff7e6] shadow-[0_12px_28px_rgba(59,14,22,0.28)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded border border-[#e1c06c]/65 bg-[#e1c06c] text-[#3b0e16] shadow-[0_0_22px_rgba(225,192,108,0.55)]">
            <BellRing className="h-5 w-5 animate-pulse" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e1c06c] sm:tracking-[0.2em]">
              Aktiv avstemning i GeoTinget
            </p>
            <p className="mt-1 break-words font-semibold leading-6">
              {primary.title}
              {active.length > 1 ? ` + ${active.length - 1} til` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <p aria-live="polite" className="rounded border border-[#e1c06c]/45 bg-[#020b11]/55 px-3 py-2 text-sm font-semibold text-[#fff7e6]">
            Frist <GeotingMiniCountdown endsAt={primary.voteEndsAt} />
          </p>
          <Link
            href="/geotinget/avstemninger"
            className="inline-flex h-10 items-center justify-center gap-2 rounded bg-[#e1c06c] px-3 text-sm font-semibold text-[#321018] transition hover:bg-[#f0d78f]"
          >
            <Gavel className="h-4 w-4" aria-hidden="true" />
            Gå til avstemning
          </Link>
        </div>
      </div>
    </div>
  );
}
