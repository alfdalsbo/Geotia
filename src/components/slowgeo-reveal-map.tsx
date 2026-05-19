"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, MapPin, Maximize2, Trophy, X } from "lucide-react";

import {
  loadGoogleMaps,
  type GoogleMap,
  type GoogleMapsApi,
  type GoogleMarker,
  type GooglePolyline,
} from "@/components/google-maps-loader";
import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { SlowGeoImageViewer } from "@/components/slowgeo-image-viewer";
import { SlowGeoThreadShareButton } from "@/components/slowgeo-thread-share-button";
import type { SlowGeoRevealMarker, SlowGeoRevealResult } from "@/lib/slowgeo-reveal";
import type { SlowGeoStreetViewPanoramaConfig } from "@/lib/streetview-panorama";
import type { StreetViewStaticViewConfig } from "@/lib/streetview-url";
import type { SlowGeoMode } from "@/lib/types";
import {
  buildPersonalRevealedSlowGeoShareTextOptions,
  buildRevealedSlowGeoShareTextOptions,
} from "@/lib/slowgeo-share";
import { cn, formatKm } from "@/lib/utils";

type SlowGeoRevealVariant = "full" | "summary";

export function SlowGeoRevealMap({
  roundName,
  roundNumber,
  streetViewUrl,
  streetViewStaticViewConfig,
  streetViewPanorama,
  slowGeoMode = "static",
  googleMapsApiKey,
  markers,
  results,
  shareUrl,
  detailHref,
  answerLabel,
  currentPlayerName,
  currentDistanceKm,
  winnerNames,
  imageDate,
  copyright,
  variant = "full",
}: {
  roundName: string;
  roundNumber?: number;
  streetViewUrl: string | null;
  streetViewStaticViewConfig: StreetViewStaticViewConfig | null;
  streetViewPanorama: SlowGeoStreetViewPanoramaConfig | null;
  slowGeoMode?: SlowGeoMode;
  googleMapsApiKey: string;
  markers: SlowGeoRevealMarker[];
  results: SlowGeoRevealResult[];
  shareUrl: string;
  detailHref?: string;
  answerLabel: string;
  currentPlayerName?: string;
  currentDistanceKm?: number | null;
  winnerNames: string[];
  imageDate?: string;
  copyright?: string;
  variant?: SlowGeoRevealVariant;
}) {
  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const mapsApiRef = useRef<GoogleMapsApi | null>(null);
  const markerRefs = useRef<GoogleMarker[]>([]);
  const polylineRefs = useRef<GooglePolyline[]>([]);
  const [loadingMap, setLoadingMap] = useState(Boolean(googleMapsApiKey && markers.length));
  const [mapError, setMapError] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const shareTexts =
    currentPlayerName && typeof currentDistanceKm === "number"
      ? buildPersonalRevealedSlowGeoShareTextOptions({
          roundName,
          answerLabel,
          playerName: currentPlayerName,
          distance: formatKm(currentDistanceKm),
          winnerNames,
          seed: `${shareUrl}:${currentPlayerName}`,
        })
      : buildRevealedSlowGeoShareTextOptions({
          roundName,
          answerLabel,
          winnerNames,
          seed: shareUrl,
        });
  const hasInteractiveMap = Boolean(googleMapsApiKey && markers.length > 0);
  const firstMarker = markers[0];
  const bestResult = results.find((result) => result.rank === 1) ?? null;
  const submittedCount = results.filter((result) => result.guessLabel || result.actualKm !== null).length;
  const cardTitle = roundNumber ? `SlowGeo #${roundNumber}` : "SlowGeo";
  const imageViewMode = slowGeoMode === "panorama" && streetViewPanorama ? "panorama" : "static";

  const fitMapToMarkers = useCallback(
    (mapsApi = mapsApiRef.current, map = mapRef.current) => {
      if (!mapsApi || !map || markers.length === 0) return;

      const bounds = new mapsApi.LatLngBounds();
      markers.forEach((marker) => bounds.extend({ lat: marker.lat, lng: marker.lon }));

      if (markers.length > 1) {
        map.fitBounds(bounds);
        return;
      }

      const onlyMarker = markers[0];
      map.setCenter({ lat: onlyMarker.lat, lng: onlyMarker.lon });
      map.setZoom(7);
    },
    [markers],
  );

  useEffect(() => {
    if (!hasInteractiveMap || !mapElementRef.current || !firstMarker) {
      setLoadingMap(false);
      return;
    }

    let cancelled = false;
    setLoadingMap(true);
    loadGoogleMaps(googleMapsApiKey)
      .then((mapsApi: GoogleMapsApi) => {
        if (cancelled || !mapElementRef.current) return;
        mapsApiRef.current = mapsApi;

        const map = new mapsApi.Map(mapElementRef.current, {
          center: { lat: firstMarker.lat, lng: firstMarker.lon },
          zoom: markers.length > 1 ? 4 : 7,
          gestureHandling: "greedy",
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });
        mapRef.current = map;

        const answerMarker = markers.find((marker) => marker.type === "answer");
        markerRefs.current = markers.map((marker) => {
          return new mapsApi.Marker({
            map,
            position: { lat: marker.lat, lng: marker.lon },
            title: marker.label,
            label: marker.type === "answer" ? "F" : marker.label.slice(0, 1),
          });
        });
        polylineRefs.current = answerMarker
          ? markers
              .filter((marker) => marker.type === "guess")
              .map(
                (marker) =>
                  new mapsApi.Polyline({
                    map,
                    path: [
                      { lat: answerMarker.lat, lng: answerMarker.lon },
                      { lat: marker.lat, lng: marker.lon },
                    ],
                    geodesic: true,
                    strokeColor: marker.color,
                    strokeOpacity: 0.62,
                    strokeWeight: 2,
                  }),
              )
          : [];

        fitMapToMarkers(mapsApi, map);
        setMapError("");
      })
      .catch((error: Error) => setMapError(error.message))
      .finally(() => {
        if (!cancelled) setLoadingMap(false);
      });

    return () => {
      cancelled = true;
      markerRefs.current.forEach((marker) => marker.setMap(null));
      polylineRefs.current.forEach((polyline) => polyline.setMap(null));
      markerRefs.current = [];
      polylineRefs.current = [];
    };
  }, [firstMarker, fitMapToMarkers, googleMapsApiKey, hasInteractiveMap, markers]);

  useEffect(() => {
    if (!mapOpen) return;

    const mapShell = mapShellRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMapOpen(false);
    };
    const blockPageGesture = (event: Event) => {
      event.preventDefault();
    };
    const blockPagePinch = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    mapShell?.addEventListener("touchmove", blockPagePinch, { passive: false });
    mapShell?.addEventListener("gesturestart", blockPageGesture, { passive: false });
    mapShell?.addEventListener("gesturechange", blockPageGesture, { passive: false });
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      mapShell?.removeEventListener("touchmove", blockPagePinch);
      mapShell?.removeEventListener("gesturestart", blockPageGesture);
      mapShell?.removeEventListener("gesturechange", blockPageGesture);
    };
  }, [mapOpen]);

  useEffect(() => {
    if (!mapRef.current) return;

    const timer = window.setTimeout(() => {
      if (!mapRef.current) return;
      mapsApiRef.current?.event?.trigger(mapRef.current, "resize");
      fitMapToMarkers();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [fitMapToMarkers, mapOpen]);

  const imageClass =
    variant === "summary"
      ? "aspect-[4/3] min-h-[260px] sm:aspect-video sm:min-h-[300px]"
      : "aspect-[4/3] min-h-[320px] sm:aspect-video sm:min-h-[420px]";
  const imageSizes = variant === "summary" ? "(min-width: 1024px) 44vw, 100vw" : "100vw";
  const gridClass =
    variant === "summary"
      ? "grid gap-0 lg:grid-cols-[minmax(0,0.96fr)_minmax(340px,1.04fr)]"
      : "grid gap-0 xl:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)]";
  const mapShellClass = mapOpen
    ? "fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#fff7e6] text-[#273125]"
    : cn(
        "relative min-h-[280px] overflow-hidden rounded border border-[#d8ded0] bg-[#e9dcc0]",
        variant === "summary" ? "sm:min-h-[300px]" : "sm:min-h-[340px]",
      );

  return (
    <section
      className={cn(
        "w-full min-w-0 overflow-hidden rounded border border-[#c49a3c]/55 bg-[#fff7e6] shadow-[0_16px_34px_rgba(38,26,12,0.12)]",
        variant === "full" && "shadow-[0_18px_40px_rgba(38,26,12,0.14)]",
      )}
    >
      <div className="flex flex-col gap-3 border-b border-[#d8c48c] bg-[#fff3d4] px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">{cardTitle} · Fasitkort</p>
          <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40] sm:text-4xl">{roundName}</h2>
          <p className="mt-2 text-sm leading-6 text-[#5b6257]">
            Fasit: {answerLabel}
            {winnerNames.length ? ` · vinner ${winnerNames.join(", ")}` : ""}
            {bestResult ? ` · beste bom ${formatKm(bestResult.actualKm)}` : ""}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          {detailHref ? (
            <Link
              href={detailHref}
              prefetch={false}
              className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[#d8ded0] bg-white px-3 text-sm font-semibold text-[#203c62]"
            >
              Åpne fasitkort
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <LinkPendingIndicator />
            </Link>
          ) : null}
          <SlowGeoThreadShareButton
            title={`SlowGeo-fasit: ${roundName}`}
            texts={shareTexts}
            url={shareUrl}
            label="Del fasit"
            copiedLabel="Fasitlenke kopiert"
            showPreview={false}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      <div className={gridClass}>
        <div className="min-w-0 bg-[#061d2b]">
          {streetViewUrl ? (
            <SlowGeoImageViewer
              src={streetViewUrl}
              alt="SlowGeo-fasitbilde"
              sizes={imageSizes}
              className={imageClass}
              staticViewConfig={streetViewStaticViewConfig}
              streetViewPanorama={streetViewPanorama}
              viewMode={imageViewMode}
              priority={variant === "full"}
              title={roundName}
            />
          ) : (
            <div className="flex min-h-[280px] w-full items-center justify-center px-6 text-center text-sm font-semibold text-[#fff7e6]">
              Street View-bildet kan ikke vises akkurat nå.
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-[#eadcbd]">
            <span>
              {imageDate ? `Street View ${imageDate}` : "Google Street View"} ·{" "}
              {slowGeoMode === "panorama" ? "Panorama" : "Statisk"}
            </span>
            <span>{copyright ?? "© Google"}</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-3">
            <RevealMetric label="Fasit" value={answerLabel} tone="blue" />
            <RevealMetric label="Vinner" value={winnerNames.join(", ") || "-"} tone="green" />
            <RevealMetric label="Levert" value={`${submittedCount}/${results.length}`} tone="gold" />
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">Kart</p>
                <h3 className="font-display text-2xl font-semibold text-[#062b40]">Fasit, linjer og bom</h3>
              </div>
              {hasInteractiveMap ? (
                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#203c62] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172d4b]"
                  aria-label="Vis fasitkart i fullskjerm"
                >
                  <Maximize2 className="h-4 w-4" aria-hidden="true" />
                  Vis kart i fullskjerm
                </button>
              ) : null}
            </div>

            {hasInteractiveMap ? (
              <div
                ref={mapShellRef}
                className={mapShellClass}
                role={mapOpen ? "dialog" : undefined}
                aria-modal={mapOpen ? "true" : undefined}
                aria-label={mapOpen ? "SlowGeo-fasitkart" : undefined}
                style={{ touchAction: "none", overscrollBehavior: mapOpen ? "none" : "contain" }}
              >
                {mapOpen ? (
                  <div className="flex items-center justify-between gap-3 border-b border-[#d8ded0] bg-[#fff7e6] px-3 py-3 shadow-sm">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">SlowGeo-kart</p>
                      <p className="truncate text-sm font-semibold text-[#062b40]">{roundName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMapOpen(false)}
                      className="inline-flex h-11 w-11 flex-none items-center justify-center rounded border border-[#d8ded0] bg-white text-[#203c62]"
                      aria-label="Lukk kart"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
                <div
                  className={mapOpen ? "relative min-h-0 flex-1" : "absolute inset-0"}
                  style={{ touchAction: "none", overscrollBehavior: "contain" }}
                >
                  <div
                    ref={mapElementRef}
                    data-testid="slowgeo-reveal-map-surface"
                    className="absolute inset-0"
                    style={{ touchAction: "none", overscrollBehavior: "contain" }}
                  />
                  {loadingMap ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-semibold text-[#203c62]">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Laster kart
                    </div>
                  ) : null}
                </div>
                {mapOpen ? (
                  <div className="border-t border-[#d8ded0] bg-[#fff7e6] px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_24px_rgba(38,26,12,0.12)]">
                    <p className="flex min-h-10 items-center gap-2 rounded border border-[#d8ded0] bg-white px-3 text-sm text-[#5b6257]">
                      <MapPin className="h-4 w-4 flex-none text-[#7c2430]" aria-hidden="true" />
                      <span>{markers.length} markører i kartet</span>
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded border border-dashed border-[#b8892f] bg-[#b8892f]/8 px-5 text-center text-sm font-semibold text-[#7b591d]">
                Kartet kan ikke vises uten kartdata og Google Maps-nøkkel.
              </div>
            )}
            {mapError ? (
              <p className="mt-2 rounded border border-[#8e3030]/25 bg-[#8e3030]/8 px-3 py-2 text-sm font-semibold text-[#8e3030]">
                {mapError}
              </p>
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[#203c62]">
              <Trophy className="h-5 w-5" aria-hidden="true" />
              <h3 className="font-display text-2xl font-semibold">Resultat</h3>
            </div>
            <div className={cn("grid gap-2", variant === "summary" ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3")}>
              {results.map((result) => (
                <ResultCard key={result.playerId} result={result} compact={variant === "summary"} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RevealMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "gold";
}) {
  const toneClass = {
    blue: "border-[#203c62]/20 bg-[#203c62]/8 text-[#203c62]",
    green: "border-[#285c45]/20 bg-[#285c45]/8 text-[#285c45]",
    gold: "border-[#b8892f]/30 bg-[#b8892f]/10 text-[#654517]",
  }[tone];

  return (
    <div className={cn("min-w-0 rounded border px-3 py-2", toneClass)}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function ResultCard({ result, compact }: { result: SlowGeoRevealResult; compact: boolean }) {
  const distance = result.actualKm ?? (result.chargedReason === "kattometerstraff" ? result.chargedKm : null);
  const distanceLabel = result.actualKm === null && result.chargedReason === "kattometerstraff" ? "Kattometer" : "Km";

  return (
    <article className="min-w-0 rounded border border-[#d8ded0] bg-white p-3 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 font-semibold text-[#203c62]">
          <span className="h-3 w-3 flex-none rounded-sm" style={{ background: result.playerColor }} />
          <span className="truncate">{result.playerShortName}</span>
        </p>
        {result.isWinner ? (
          <span className="inline-flex flex-none items-center gap-1 rounded border border-[#285c45]/25 bg-[#285c45]/10 px-2 py-1 text-xs font-semibold text-[#285c45]">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Vinner
          </span>
        ) : null}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <ResultDatum label="Plass" value={result.rank ? `#${result.rank}` : "-"} />
        <ResultDatum label={distanceLabel} value={formatKm(distance)} />
        <ResultDatum label="Poeng" value={String(result.points)} />
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7c2430]">{result.statusLabel}</p>
      {result.guessLabel ? (
        <p className={cn("mt-1 text-xs leading-5 text-[#5b6257]", compact ? "line-clamp-2" : "line-clamp-3")}>
          <MapPin className="mr-1 inline h-3 w-3" aria-hidden="true" />
          {result.guessLabel}
        </p>
      ) : null}
      {!compact && result.note ? (
        <p className="mt-2 rounded border border-[#d8ded0] bg-[#f7f8f5] px-2 py-1.5 text-xs leading-5 text-[#4f412b]">
          {result.note}
        </p>
      ) : null}
    </article>
  );
}

function ResultDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded bg-[#f7f8f5] px-2 py-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#5b6257]">{label}</p>
      <p className="truncate font-mono text-xs font-semibold text-[#062b40]">{value}</p>
    </div>
  );
}
