import Link from "next/link";
import type { ReactNode } from "react";
import { Archive, Clock, ExternalLink, MapPin, ScrollText, ShieldCheck, Trophy, UserRound } from "lucide-react";

import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { Section } from "@/components/section";
import { SlowGeoSubnav } from "@/components/slowgeo-subnav";
import { computeRound } from "@/lib/scoring";
import {
  getSlowGeoStartedAt,
  getSlowGeoStarterLabel,
  getSlowGeoVariant,
  hasMinimumSlowGeoRevealGuesses,
  isBohemGeoRound,
  isSlowGeoRound,
  slowGeoVariantLabels,
} from "@/lib/slowgeo";
import { getRoundsState } from "@/lib/store";
import type { ComputedRound, Round, RoundStatus } from "@/lib/types";
import { cn, dateTimeLabel, formatKm } from "@/lib/utils";

export const metadata = {
  title: "Fasitarkiv",
};

const statusLabel: Record<RoundStatus, string> = {
  draft: "Utkast",
  open: "Åpen",
  revealed: "Fasit vist",
  locked: "Låst",
};

export default async function RoundsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const state = await getRoundsState();
  const protocolRounds = state.rounds
    .filter((round) => isSlowGeoRound(round) && (round.status === "locked" || round.status === "revealed"))
    .sort((a, b) => roundSortStamp(b) - roundSortStamp(a));

  return (
    <div className="space-y-6">
      <div className="geotia-frame rounded p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
          Ferdige SlowGeo-fasitkort
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-normal text-[#062b40] sm:text-5xl">
          Fasitarkiv
        </h1>
        <p className="mt-3 max-w-3xl text-[#60553f]">
          Dette er hjemmet for alle ferdige SlowGeo-runder. Aktive runder bor i
          Spill nå; Fasitarkivet viser bare fasitkort, vinnere og ferdige kartspor.
        </p>
        <p className="mt-4 rounded border border-[#c49a3c]/35 bg-[#fdf7e8] px-3 py-2 text-sm leading-6 text-[#4f412b]">
          Nyeste fasit står først. Ingen startskjema, ingen manuell kontroll,
          ingen aktive runder som later som de er arkiv.
        </p>
      </div>

      <SlowGeoSubnav />

      {params.error ? (
        <div className="rounded border border-[#8e3030]/25 bg-[#8e3030]/8 px-4 py-3 text-sm font-medium text-[#8e3030]">
          {params.error}
        </div>
      ) : null}

      {params.status ? (
        <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
          {params.status === "last"
            ? "Protokollen er låst. Kattometeret har talt."
            : params.status === "avslort"
              ? "SlowGeo-fasiten er vist og fasitkortet ligger i hvelvet."
              : params.status === "bohemgeo_avslort"
                ? "BohemGeo-fasiten er vist og arkivert uten tabellføring."
              : "SlowGeo-protokollen er oppdatert."}
        </div>
      ) : null}

      <Section title="Alle ferdige fasitkort" eyebrow="Avsluttede SlowGeo-runder">
        {protocolRounds.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {protocolRounds.map((round) => {
              const computed = computeRound(round, state.players);
              return <ProtocolCard key={round.id} round={round} computed={computed} />;
            })}
          </div>
        ) : (
          <div className="rounded border border-dashed border-[#b8892f] bg-[#b8892f]/8 p-5">
            <p className="flex items-center gap-2 text-lg font-semibold text-[#7b591d]">
              <Archive className="h-5 w-5" aria-hidden="true" />
              Ingen ferdige SlowGeo-fasitkort ennå.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#5b6257]">
              Når en SlowGeo er avslørt, havner den her. Aktive runder ligger
              fortsatt i Spill nå.
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}

function ProtocolCard({ round, computed }: { round: Round; computed: ComputedRound }) {
  const bestResult = computed.results.find((result) => result.rank === 1) ?? null;
  const submittedCount = computed.results.filter((result) => result.guessLocation || result.actualKm !== null).length;
  const starterLabel = getSlowGeoStarterLabel(round, computed.results.map((result) => result.player));
  const startedAtLabel = dateTimeLabel(getSlowGeoStartedAt(round));
  const variant = getSlowGeoVariant(round);
  const isBohemGeo = isBohemGeoRound(round);
  const isUnderMinimumOfficialSlowGeo = !isBohemGeo && !hasMinimumSlowGeoRevealGuesses(round);
  const statusTone =
    round.status === "locked"
      ? "border-[#285c45]/25 bg-[#285c45]/10 text-[#285c45]"
      : "border-[#b8892f]/30 bg-[#b8892f]/10 text-[#7b591d]";

  return (
    <article
      data-testid="slowgeo-protocol-card"
      className="min-w-0 overflow-hidden rounded border border-[#c49a3c]/45 bg-[#fdf7e8] shadow-[0_12px_28px_rgba(38,26,12,0.1)]"
    >
      <div className="border-b border-[#d8c48c] bg-[#fff3d4] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
              <ScrollText className="h-4 w-4 flex-none" aria-hidden="true" />
              {slowGeoVariantLabels[variant]}-fasit #{round.number}
            </p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-[#062b40] sm:text-3xl">
              {round.name}
            </h2>
          </div>
          <span className={cn("inline-flex h-9 items-center gap-2 rounded border px-3 text-xs font-semibold", statusTone)}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {statusLabel[round.status]}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <ProtocolFact icon={<UserRound className="h-4 w-4" aria-hidden="true" />} label="Reist av" value={starterLabel} />
          <ProtocolFact icon={<Clock className="h-4 w-4" aria-hidden="true" />} label="Starttid" value={startedAtLabel} />
        </div>
        {isBohemGeo ? (
          <p className="mt-3 rounded border border-[#7c2430]/25 bg-[#7c2430]/8 px-3 py-2 text-sm font-semibold text-[#7c2430]">
            BohemGeo er arkivert uten tabellføring.
          </p>
        ) : isUnderMinimumOfficialSlowGeo ? (
          <p className="mt-3 rounded border border-[#7c2430]/25 bg-[#7c2430]/8 px-3 py-2 text-sm font-semibold text-[#7c2430]">
            Ikke tabellført: færre enn fire pin-svar.
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <ProtocolMetric label="Fasit" value={round.answer || round.challenge?.label || "-"} />
        <ProtocolMetric label="Vinner" value={computed.winnerNames.join(", ") || "-"} />
        <ProtocolMetric label="Beste bom" value={formatKm(bestResult?.actualKm ?? bestResult?.chargedKm)} />
        <ProtocolMetric label="Levert" value={`${submittedCount}/${computed.results.length}`} />
      </div>

      <div className="flex flex-col gap-3 border-t border-[#d8c48c] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="flex min-w-0 items-start gap-2 text-sm leading-6 text-[#5b6257]">
          <MapPin className="mt-0.5 h-4 w-4 flex-none text-[#7c2430]" aria-hidden="true" />
          <span className="min-w-0 break-words">
            {bestResult
              ? `${bestResult.player.shortName} kom nærmest med ${formatKm(bestResult.actualKm ?? bestResult.chargedKm)}.`
              : "Runden er ført, men ingen vinner er kåret."}
          </span>
        </p>
        <Link
          href={`/slowgeo/${round.id}`}
          prefetch={false}
          className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#203c62] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172d4b]"
        >
          <Trophy className="h-4 w-4" aria-hidden="true" />
          Åpne fasitkort
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          <LinkPendingIndicator />
        </Link>
      </div>
    </article>
  );
}

function ProtocolMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded border border-[#d8ded0] bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7c2430]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#062b40]">{value}</p>
    </div>
  );
}

function ProtocolFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded border border-[#d8ded0] bg-white px-3 py-2 text-sm text-[#203c62]">
      <span className="flex-none text-[#7c2430]">{icon}</span>
      <span className="min-w-0">
        <span className="font-semibold">{label}: </span>
        <span className="break-words">{value}</span>
      </span>
    </div>
  );
}

function roundSortStamp(round: Round) {
  const stamp = new Date(round.revealedAt ?? round.updatedAt ?? round.createdAt).getTime();
  return Number.isFinite(stamp) ? stamp : round.number;
}
