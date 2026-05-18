import Link from "next/link";
import { notFound } from "next/navigation";
import { Gavel, LockKeyhole, RotateCcw } from "lucide-react";

import { lockRoundAction, unlockRoundAction } from "@/app/actions";
import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { RoundForm } from "@/components/round-form";
import { RoundMapProtocol } from "@/components/round-map-protocol";
import { Section } from "@/components/section";
import { SlowGeoAftermath } from "@/components/slowgeo-aftermath";
import { SlowGeoPlay } from "@/components/slowgeo-play";
import { SlowGeoRevealMap } from "@/components/slowgeo-reveal-map";
import { getCurrentGeot } from "@/lib/auth";
import { selectGeoGuessrTips } from "@/lib/geoguessr-tips";
import { computeRound } from "@/lib/scoring";
import { buildSlowGeoAnswerStatusItems } from "@/lib/slowgeo-answer-status";
import { getRoundsState, maybeRevealRound } from "@/lib/store";
import { buildStreetViewPanoramaConfig } from "@/lib/streetview-panorama";
import {
  buildStreetViewImageUrl,
  buildStreetViewStaticViewConfig,
  STREET_VIEW_STATIC_PREVIEW_IMAGE_SIZE,
} from "@/lib/streetview-url";
import type { Round, RoundStatus } from "@/lib/types";
import { dateLabel, formatKm } from "@/lib/utils";

export const metadata = {
  title: "Rundeprotokoll",
};

function statusName(status: RoundStatus) {
  const labels: Record<RoundStatus, string> = {
    draft: "Utkast",
    open: "Åpen",
    revealed: "Fasit vist",
    locked: "Låst",
  };
  return labels[status];
}

function roundAction(round: Round) {
  if (round.status === "revealed" || round.status === "draft") {
    return (
      <form action={lockRoundAction}>
        <input type="hidden" name="id" value={round.id} />
        <PendingSubmitButton
          className="inline-flex h-10 items-center gap-2 rounded bg-[#285c45] px-3 text-sm font-semibold text-white"
        >
          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          Lås protokollen
        </PendingSubmitButton>
      </form>
    );
  }

  if (round.status === "locked") {
    return (
      <form action={unlockRoundAction}>
        <input type="hidden" name="id" value={round.id} />
        <PendingSubmitButton
          className="inline-flex h-10 items-center gap-2 rounded border border-[#b8892f]/40 bg-[#b8892f]/10 px-3 text-sm font-semibold text-[#7b591d]"
        >
          <Gavel className="h-4 w-4" aria-hidden="true" />
          Send til GeoVAR
        </PendingSubmitButton>
      </form>
    );
  }

  return null;
}

export default async function RoundDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; status?: string }>;
}) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const round = await maybeRevealRound(id);
  if (!round) notFound();

  const [state, currentGeot] = await Promise.all([getRoundsState(), getCurrentGeot()]);
  const computed = computeRound(round, state.players);
  const isStreetViewRound = Boolean(round.challenge);
  const isOpenStreetViewRound = isStreetViewRound && round.status === "open";
  const slowGeoShareUrl = `/slowgeo/${round.id}`;
  const publicGoogleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const streetViewUrl = round.challenge
    ? buildStreetViewImageUrl({
        challenge: round.challenge,
        apiKey: publicGoogleKey,
        allowLocationFallback: round.status !== "open",
        size: STREET_VIEW_STATIC_PREVIEW_IMAGE_SIZE,
      })
    : null;
  const streetViewStaticViewConfig = round.challenge ? buildStreetViewStaticViewConfig(round.challenge) : null;
  const streetViewPanorama = round.challenge
    ? buildStreetViewPanoramaConfig({
        challenge: round.challenge,
        apiKey: publicGoogleKey,
        allowLocationFallback: round.status !== "open",
      })
    : null;
  const currentResult = currentGeot
    ? round.results.find((result) => result.playerId === currentGeot.id)
    : null;
  const currentComputedResult = currentGeot
    ? computed.results.find((result) => result.playerId === currentGeot.id)
    : null;
  const answerStatusItems = buildSlowGeoAnswerStatusItems(computed.results, currentGeot?.id);
  const existingGuess = currentResult?.guessLocation
    ? {
        lat: currentResult.guessLocation.lat,
        lon: currentResult.guessLocation.lon,
        label: currentResult.guessLocation.label,
        updatedAt: currentResult.guessUpdatedAt,
      }
    : null;
  const openSlowGeoTips = isOpenStreetViewRound
    ? selectGeoGuessrTips({
        placement: "slowgeo-open",
        seed: round.id,
        count: 3,
      })
    : [];
  const revealMarkers =
    round.mapSnapshot?.markers.map((marker) => ({
      id: marker.id,
      type: marker.type,
      label: marker.label,
      lat: marker.lat,
      lon: marker.lon,
      color: marker.color,
      distanceKm: marker.distanceKm,
    })) ?? [];

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
            {dateLabel(round.date)} ·{" "}
            {isOpenStreetViewRound ? "Fasit skjult til reveal" : round.answer || "Fasit ikke ført"} ·{" "}
            {computed.participantCount} gyldige deltakere
          </p>
        </div>
        <Link
          href="/runder"
          prefetch={false}
          className="inline-flex h-10 items-center justify-center rounded border border-[#062b40]/30 bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]"
        >
          Til rundearkivet
          <LinkPendingIndicator />
        </Link>
      </div>

      {query.error ? (
        <div className="rounded border border-[#8e3030]/25 bg-[#8e3030]/8 px-4 py-3 text-sm font-medium text-[#8e3030]">
          {query.error}
        </div>
      ) : null}
      {query.status ? (
        <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
          {query.status === "geovar"
            ? "GeoVAR har åpnet protokollen for ny behandling."
            : query.status === "gjettet"
              ? "Pin-svaret er låst. Kranglingen kan fortsette uten at pinnen flytter seg."
              : query.status === "avslort"
                ? "Fasit er avslørt, protokollen er låst og runden ligger i arkivet."
                : query.status === "apnet"
                  ? "SlowGeo-runden er åpnet."
                  : "Protokollen er oppdatert."}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded border border-[#d8ded0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b6257]">
            Status
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#203c62]">{statusName(round.status)}</p>
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
            {round.status === "open" ? "-" : computed.winnerNames.join(", ") || "-"}
          </p>
        </div>
      </div>

      {isOpenStreetViewRound && round.challenge ? (
        <SlowGeoPlay
          roundId={round.id}
          roundName={round.name}
          deadlineAt={round.deadlineAt ?? null}
          streetViewUrl={streetViewUrl}
          streetViewStaticViewConfig={streetViewStaticViewConfig}
          streetViewPanorama={streetViewPanorama}
          googleMapsApiKey={publicGoogleKey}
          existingGuess={existingGuess}
          existingNote={currentResult?.note ?? ""}
          shareUrl={slowGeoShareUrl}
          tips={openSlowGeoTips}
          answerStatusItems={answerStatusItems}
        />
      ) : null}

      {isStreetViewRound && round.challenge && round.status !== "open" ? (
        <SlowGeoRevealMap
          roundName={round.name}
          streetViewUrl={streetViewUrl}
          streetViewStaticViewConfig={streetViewStaticViewConfig}
          streetViewPanorama={streetViewPanorama}
          googleMapsApiKey={publicGoogleKey}
          markers={revealMarkers}
          shareUrl={slowGeoShareUrl}
          answerLabel={round.answer || round.challenge.label}
          currentPlayerName={currentComputedResult?.player.shortName}
          currentDistanceKm={currentComputedResult?.actualKm}
          winnerNames={computed.winnerNames}
          imageDate={round.challenge.imageDate}
          copyright={round.challenge.copyright}
        />
      ) : null}

      {isStreetViewRound && round.challenge && round.status !== "open" ? (
        <SlowGeoAftermath round={computed} />
      ) : null}

      {!isStreetViewRound ? <RoundMapProtocol snapshot={round.mapSnapshot} /> : null}

      {!isOpenStreetViewRound ? (
        <Section
          title="Protokollføring"
          eyebrow="Km, deltakelse og kattometer"
          action={
            <div className="flex flex-wrap gap-2">
              {roundAction(round)}
              <Link
                href="/runder"
                prefetch={false}
                className="inline-flex h-10 items-center gap-2 rounded border border-[#d8ded0] bg-white px-3 text-sm font-semibold text-[#203c62]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Arkivet
                <LinkPendingIndicator />
              </Link>
            </div>
          }
        >
          {isStreetViewRound ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b border-[#d8ded0] text-xs uppercase tracking-[0.12em] text-[#5b6257]">
                  <tr>
                    <th className="py-2 pr-3">Geot</th>
                    <th className="py-2 pr-3">Svar</th>
                    <th className="py-2 pr-3 text-right">Km</th>
                    <th className="py-2 pr-3 text-right">Poeng</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Begrunnelse</th>
                  </tr>
                </thead>
                <tbody>
                  {computed.results.map((result) => (
                    <tr key={result.playerId} className="border-b border-[#eef1eb] last:border-b-0">
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-2 font-semibold text-[#203c62]">
                          <span className="h-3 w-3 rounded-sm" style={{ background: result.player.color }} />
                          {result.player.shortName}
                        </span>
                      </td>
                      <td className="py-3 pr-3">{result.guessText || result.guessLocation?.label || "-"}</td>
                      <td className="py-3 pr-3 text-right font-mono">{formatKm(result.actualKm)}</td>
                      <td className="py-3 pr-3 text-right font-mono">{result.points}</td>
                      <td className="py-3 pr-3">
                        {result.status === "deltatt" ? "Deltatt" : result.guessLocation ? "Levert" : "Ikke levert"}
                      </td>
                      <td className="max-w-xs py-3 pr-3 text-[#5b6257]">{result.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <RoundForm round={round} />
          )}
        </Section>
      ) : null}
    </div>
  );
}
