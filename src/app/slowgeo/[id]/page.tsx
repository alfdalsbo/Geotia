import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { PublicGeotiaHeader } from "@/components/public-geotia-header";
import { SlowGeoPlay } from "@/components/slowgeo-play";
import { SlowGeoRevealMap } from "@/components/slowgeo-reveal-map";
import { SlowGeoThreadShareButton } from "@/components/slowgeo-thread-share-button";
import { getCurrentGeot } from "@/lib/auth";
import { selectGeoGuessrTips } from "@/lib/geoguessr-tips";
import { computeRound } from "@/lib/scoring";
import { players } from "@/lib/seed";
import { getSlowGeoMode, getSlowGeoStartedAt, getSlowGeoStarterLabel, hasLockedSlowGeoGuess } from "@/lib/slowgeo";
import {
  buildOpenSlowGeoShareTextOptions,
  buildRevealedSlowGeoShareTextOptions,
} from "@/lib/slowgeo-share";
import { buildSlowGeoAnswerStatusItems } from "@/lib/slowgeo-answer-status";
import { buildSlowGeoRevealMarkers, buildSlowGeoRevealResults } from "@/lib/slowgeo-reveal";
import { getSlowGeoRoundState, maybeRevealRound } from "@/lib/store";
import { buildStreetViewPanoramaConfig } from "@/lib/streetview-panorama";
import {
  buildStreetViewImageUrl,
  buildStreetViewStaticViewConfig,
  STREET_VIEW_STATIC_PREVIEW_IMAGE_SIZE,
} from "@/lib/streetview-url";
import { dateTimeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getSlowGeoRound(id: string) {
  return (await getSlowGeoRoundState(id)).round;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const round = await getSlowGeoRound(id);
  if (!round?.challenge) {
    return {
      title: "SlowGeo",
      robots: { index: false, follow: false },
    };
  }

  const streetViewUrl = buildStreetViewImageUrl({
    challenge: round.challenge,
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    allowLocationFallback: round.status !== "open",
  });
  const title = `SlowGeo: ${round.name}`;
  const description =
    round.status === "open"
      ? "Nytt SlowGeo-bilde er oppe. Krangle først, sett pinnen etterpå."
      : `Fasit er avslørt: ${round.answer || round.challenge.label}.`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "article",
      images: streetViewUrl
        ? [
            {
              url: streetViewUrl,
              width: 640,
              height: 640,
              alt: `SlowGeo-bilde for ${round.name}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: streetViewUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: streetViewUrl ? [streetViewUrl] : undefined,
    },
  };
}

export default async function SlowGeoSharePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ created?: string; error?: string; status?: string }>;
}) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const revealedRound = await maybeRevealRound(id);
  if (!revealedRound?.challenge) notFound();

  const round = revealedRound;
  if (!round.challenge) notFound();

  const computed = computeRound(round, players);
  const currentGeot = await getCurrentGeot();
  const publicGoogleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const streetViewUrl = buildStreetViewImageUrl({
    challenge: round.challenge,
    apiKey: publicGoogleKey,
    allowLocationFallback: round.status !== "open",
    size: STREET_VIEW_STATIC_PREVIEW_IMAGE_SIZE,
  });
  const streetViewStaticViewConfig = buildStreetViewStaticViewConfig(round.challenge);
  const streetViewPanorama = buildStreetViewPanoramaConfig({
    challenge: round.challenge,
    apiKey: publicGoogleKey,
    allowLocationFallback: round.status !== "open",
  });
  const isOpen = round.status === "open";
  const slowGeoMode = getSlowGeoMode(round);
  const canReplacePanorama = isOpen && slowGeoMode === "panorama" && !hasLockedSlowGeoGuess(round);
  const answerLabel = round.answer || round.challenge.label;
  const submittedCount = round.results.filter((result) => result.guessLocation).length;
  const participantCount = round.results.length;
  const shareUrl = `/slowgeo/${round.id}`;
  const starterLabel = getSlowGeoStarterLabel(round, players);
  const startedAtLabel = dateTimeLabel(getSlowGeoStartedAt(round));
  const shareTexts = isOpen
    ? buildOpenSlowGeoShareTextOptions(round.name, round.id)
    : buildRevealedSlowGeoShareTextOptions({
        roundName: round.name,
        answerLabel,
        winnerNames: computed.winnerNames,
        seed: round.id,
      });
  const shareText = shareTexts[0] ?? "";
  const highlightThreadShare = isOpen && query.created === "1";
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
  const openSlowGeoTips = isOpen
    ? selectGeoGuessrTips({
        placement: "slowgeo-open",
        seed: round.id,
        count: 3,
      })
    : [];
  const revealMarkers = buildSlowGeoRevealMarkers(computed);
  const revealResults = buildSlowGeoRevealResults(computed);

  return (
    <div className="min-h-screen bg-[#f3ead7] text-[#273125]">
      <PublicGeotiaHeader />
      <main className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-5">
        <header className="flex min-w-0 flex-col gap-4 rounded border border-[#d6b565]/55 bg-[#fff7e6] p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c2430]">
              SlowGeo #{round.number}
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold text-[#062b40] sm:text-5xl">
              {round.name}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#60553f]">
              {isOpen
                ? `Fasit skjult. ${submittedCount}/${participantCount} pin-svar er låst.`
                : `Fasit: ${answerLabel}`}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7c2430]">
              Reist av {starterLabel} · {startedAtLabel}
            </p>
          </div>
          {isOpen ? (
            <SlowGeoThreadShareButton
              title={`SlowGeo: ${round.name}`}
              texts={shareTexts}
              url={shareUrl}
              label="Del iMessage-tråden"
              copiedLabel="Trådtekst kopiert"
              showCopyFallback={highlightThreadShare}
              showPreview={false}
            />
          ) : null}
        </header>

        {query.error ? (
          <div className="rounded border border-[#8e3030]/25 bg-[#8e3030]/8 px-4 py-3 text-sm font-medium text-[#8e3030]">
            {query.error}
          </div>
        ) : null}
        {query.status ? (
          <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
            {query.status === "gjettet"
              ? "Pin-svaret er låst. Kranglingen kan fortsette uten at pinnen flytter seg."
              : query.status === "avslort"
                ? "Fasit er avslørt, protokollen er låst og runden ligger i arkivet."
                : query.status === "panorama_nytt"
                  ? "Nytt panorama er hentet inn i samme SlowGeo-lenke."
                : "SlowGeo er oppdatert."}
          </div>
        ) : null}

        {highlightThreadShare ? (
          <section className="flex flex-col gap-4 rounded border border-[#203c62]/20 bg-[#203c62] p-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#eadcbd]">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Klar for tråden
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold">Del SlowGeo før pin-svarene kommer</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#f5ead3]">{shareText}</p>
            </div>
            <SlowGeoThreadShareButton
              title={`SlowGeo: ${round.name}`}
              texts={shareTexts}
              url={shareUrl}
              label="Del iMessage-tråden"
              copiedLabel="Trådtekst kopiert"
              showCopyFallback
              tone="dark"
              shareButtonClassName="bg-white text-[#203c62] hover:bg-[#f7f8f5]"
            />
          </section>
        ) : null}

        {isOpen ? (
          <SlowGeoPlay
            roundId={round.id}
            roundName={round.name}
            deadlineAt={round.deadlineAt ?? null}
            streetViewUrl={streetViewUrl}
            streetViewStaticViewConfig={streetViewStaticViewConfig}
            streetViewPanorama={streetViewPanorama}
            slowGeoMode={slowGeoMode}
            canReplacePanorama={canReplacePanorama}
            googleMapsApiKey={publicGoogleKey}
            existingGuess={existingGuess}
            existingNote={currentResult?.note ?? ""}
            shareUrl={shareUrl}
            tips={openSlowGeoTips}
            returnTo={shareUrl}
            layout="stacked"
            showShareButton={false}
            answerStatusItems={answerStatusItems}
          />
        ) : (
          <SlowGeoRevealMap
            roundName={round.name}
            roundNumber={round.number}
            streetViewUrl={streetViewUrl}
            streetViewStaticViewConfig={streetViewStaticViewConfig}
            streetViewPanorama={streetViewPanorama}
            slowGeoMode={slowGeoMode}
            googleMapsApiKey={publicGoogleKey}
            markers={revealMarkers}
            results={revealResults}
            shareUrl={shareUrl}
            answerLabel={answerLabel}
            startedByLabel={starterLabel}
            startedAtLabel={startedAtLabel}
            currentPlayerName={currentComputedResult?.player.shortName}
            currentDistanceKm={currentComputedResult?.actualKm}
            winnerNames={computed.winnerNames}
            imageDate={round.challenge.imageDate}
            copyright={round.challenge.copyright}
            variant="full"
          />
        )}
        </div>
      </main>
    </div>
  );
}
