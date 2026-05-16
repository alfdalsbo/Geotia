import Link from "next/link";
import { notFound } from "next/navigation";
import { Gavel, LockKeyhole, RotateCcw } from "lucide-react";

import { lockRoundAction, unlockRoundAction } from "@/app/actions";
import { RoundForm } from "@/components/round-form";
import { RoundMapProtocol } from "@/components/round-map-protocol";
import { Section } from "@/components/section";
import { computeRound } from "@/lib/scoring";
import { getAppState, getRound } from "@/lib/store";
import { dateLabel, formatKm } from "@/lib/utils";

export const metadata = {
  title: "Rundeprotokoll",
};

export default async function RoundDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; status?: string }>;
}) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const [round, state] = await Promise.all([getRound(id), getAppState()]);
  if (!round) notFound();

  const computed = computeRound(round, state.players);

  return (
    <div className="space-y-6">
      <div className="geotia-frame flex flex-col gap-4 rounded p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
            Runde #{round.number}
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-normal text-[#062b40] sm:text-5xl">
            {round.name}
          </h1>
          <p className="mt-3 text-[#60553f]">
            {dateLabel(round.date)} · {round.answer || "Fasit ikke ført"} ·{" "}
            {computed.participantCount} gyldige deltakere
          </p>
        </div>
        <Link
          href="/runder"
          className="inline-flex h-10 items-center justify-center rounded border border-[#062b40]/30 bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]"
        >
          Til rundearkivet
        </Link>
      </div>

      {query.error ? (
        <div className="rounded border border-[#8e3030]/25 bg-[#8e3030]/8 px-4 py-3 text-sm font-medium text-[#8e3030]">
          {query.error}
        </div>
      ) : null}
      {query.status === "geovar" ? (
        <div className="rounded border border-[#b8892f]/30 bg-[#b8892f]/10 px-4 py-3 text-sm font-medium text-[#7b591d]">
          GeoVAR har åpnet protokollen for ny behandling.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-[#d8ded0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b6257]">
            Status
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#203c62]">
            {round.status === "locked" ? "Låst" : "Utkast"}
          </p>
        </div>
        <div className="rounded border border-[#d8ded0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b6257]">
            Kattometerstraff
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#8e3030]">
            {formatKm(computed.worstThreeAverage)}
          </p>
        </div>
        <div className="rounded border border-[#d8ded0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b6257]">
            Vinner
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#285c45]">
            {computed.winnerNames.join(", ") || "-"}
          </p>
        </div>
      </div>

      <RoundMapProtocol snapshot={round.mapSnapshot} />

      <Section
        title="Protokollføring"
        eyebrow="Km, deltakelse og kattometer"
        action={
          <div className="flex flex-wrap gap-2">
            {round.status === "draft" ? (
              <form action={lockRoundAction}>
                <input type="hidden" name="id" value={round.id} />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded bg-[#285c45] px-3 text-sm font-semibold text-white"
                >
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  Lås protokollen
                </button>
              </form>
            ) : (
              <form action={unlockRoundAction}>
                <input type="hidden" name="id" value={round.id} />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded border border-[#b8892f]/40 bg-[#b8892f]/10 px-3 text-sm font-semibold text-[#7b591d]"
                >
                  <Gavel className="h-4 w-4" aria-hidden="true" />
                  Send til GeoVAR
                </button>
              </form>
            )}
            <Link
              href="/runder"
              className="inline-flex h-10 items-center gap-2 rounded border border-[#d8ded0] bg-white px-3 text-sm font-semibold text-[#203c62]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Arkivet
            </Link>
          </div>
        }
      >
        <RoundForm round={round} />
      </Section>
    </div>
  );
}
