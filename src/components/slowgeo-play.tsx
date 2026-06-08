"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, LockKeyhole, MapPin, Maximize2, RotateCcw, Send, X } from "lucide-react";

import { replaceSlowGeoPanoramaAction, submitSlowGeoGuessAction } from "@/app/actions";
import { loadGoogleMaps, type GoogleMap, type GoogleMapsApi } from "@/components/google-maps-loader";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { SlowGeoAnswerStatus } from "@/components/slowgeo-answer-status";
import { SlowGeoImageViewer } from "@/components/slowgeo-image-viewer";
import { createSlowGeoMapMarker, type SlowGeoMapMarker } from "@/components/slowgeo-map-marker";
import { SlowGeoThreadShareButton } from "@/components/slowgeo-thread-share-button";
import { SlowGeoTipPanel } from "@/components/slowgeo-tip-panel";
import type { GeoGuessrTip } from "@/lib/geoguessr-tips";
import type { SlowGeoAnswerStatusItem } from "@/lib/slowgeo-answer-status";
import type { SlowGeoStreetViewPanoramaConfig } from "@/lib/streetview-panorama";
import type { StreetViewStaticViewConfig } from "@/lib/streetview-url";
import { buildOpenSlowGeoShareTextOptions } from "@/lib/slowgeo-share";
import type { SlowGeoMode } from "@/lib/types";
import { dateTimeLabel } from "@/lib/utils";

type Guess = {
  lat: number;
  lon: number;
  label: string;
};

type SlowGeoPlayProps = {
  roundId: string;
  roundName: string;
  deadlineAt: string | null;
  streetViewUrl: string | null;
  streetViewStaticViewConfig: StreetViewStaticViewConfig | null;
  streetViewPanorama: SlowGeoStreetViewPanoramaConfig | null;
  slowGeoMode?: SlowGeoMode;
  canReplacePanorama?: boolean;
  googleMapsApiKey: string;
  existingGuess: (Guess & { updatedAt?: string | null }) | null;
  existingNote?: string | null;
  shareUrl: string;
  tips?: GeoGuessrTip[];
  returnTo?: string;
  layout?: "split" | "stacked";
  showShareButton?: boolean;
  answerStatusItems?: SlowGeoAnswerStatusItem[];
};

function guessLabel(lat: number, lon: number) {
  return `Pin ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export function SlowGeoPlay({
  roundId,
  roundName,
  deadlineAt,
  streetViewUrl,
  streetViewStaticViewConfig,
  streetViewPanorama,
  slowGeoMode = "static",
  canReplacePanorama = false,
  googleMapsApiKey,
  existingGuess,
  existingNote,
  shareUrl,
  tips = [],
  returnTo,
  layout = "split",
  showShareButton = true,
  answerStatusItems = [],
}: SlowGeoPlayProps) {
  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markerRef = useRef<SlowGeoMapMarker | null>(null);
  const mapsApiRef = useRef<GoogleMapsApi | null>(null);
  const [guess, setGuess] = useState<Guess | null>(existingGuess);
  const [mapError, setMapError] = useState("");
  const [loadingMap, setLoadingMap] = useState(false);
  const [mapReadyToLoad, setMapReadyToLoad] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [panoramaLoadFailed, setPanoramaLoadFailed] = useState(false);
  const answerLocked = Boolean(existingGuess);
  const openShareTexts = buildOpenSlowGeoShareTextOptions(roundName, roundId);
  const imageViewMode = slowGeoMode === "panorama" && streetViewPanorama ? "panorama" : "static";
  const showPanoramaRetry = slowGeoMode === "panorama" && (!streetViewPanorama || panoramaLoadFailed);
  const replacePanoramaReturnTo = returnTo ?? `/runder/${roundId}`;

  const placeMarker = useCallback((nextGuess: Guess, center = true) => {
    const mapsApi = mapsApiRef.current;
    const map = mapRef.current;
    if (!mapsApi || !map) return;

    const position = { lat: nextGuess.lat, lng: nextGuess.lon };
    if (!markerRef.current) {
      markerRef.current = createSlowGeoMapMarker({
        color: "#285c45",
        kind: "guess",
        label: "P",
        map,
        mapsApi,
        position,
        title: nextGuess.label,
        zIndex: 1000,
      });
    } else {
      markerRef.current.setPosition(position);
    }
    if (center) map.setCenter(position);
  }, []);

  const updateGuess = useCallback((lat: number, lon: number, label = guessLabel(lat, lon), center = true) => {
    const nextGuess = { lat, lon, label };
    setGuess(nextGuess);
    placeMarker(nextGuess, center);
  }, [placeMarker]);

  const clearGuess = useCallback(() => {
    if (answerLocked) return;
    markerRef.current?.setMap(null);
    markerRef.current = null;
    setGuess(null);
  }, [answerLocked]);

  const recenterMap = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (guess) {
      map.setCenter({ lat: guess.lat, lng: guess.lon });
      map.setZoom(7);
      return;
    }

    map.setCenter({ lat: 20, lng: 12 });
    map.setZoom(2);
  }, [guess]);

  const handlePanoramaUnavailable = useCallback(() => {
    if (slowGeoMode === "panorama") {
      setPanoramaLoadFailed(true);
    }
  }, [slowGeoMode]);

  useEffect(() => {
    if (!googleMapsApiKey || mapReadyToLoad) return;

    const mapShell = mapShellRef.current;
    if (!mapShell || !("IntersectionObserver" in window)) {
      const timer = window.setTimeout(() => setMapReadyToLoad(true), 250);
      return () => window.clearTimeout(timer);
    }

    const idleTimer = window.setTimeout(() => setMapReadyToLoad(true), 900);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setMapReadyToLoad(true);
          window.clearTimeout(idleTimer);
          observer.disconnect();
        }
      },
      { rootMargin: "180px" },
    );
    observer.observe(mapShell);
    return () => {
      window.clearTimeout(idleTimer);
      observer.disconnect();
    };
  }, [googleMapsApiKey, mapReadyToLoad]);

  useEffect(() => {
    if (!googleMapsApiKey || !mapReadyToLoad || !mapElementRef.current) {
      setLoadingMap(false);
      return;
    }

    let cancelled = false;
    setLoadingMap(true);
    loadGoogleMaps(googleMapsApiKey)
      .then((mapsApi) => {
        if (cancelled || !mapElementRef.current) return;
        mapsApiRef.current = mapsApi;
        const map = new mapsApi.Map(mapElementRef.current, {
          center: existingGuess ? { lat: existingGuess.lat, lng: existingGuess.lon } : { lat: 20, lng: 12 },
          zoom: existingGuess ? 7 : 2,
          gestureHandling: "greedy",
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });
        mapRef.current = map;
        if (!answerLocked) {
          map.addListener("click", (event) => {
            const lat = event.latLng?.lat();
            const lon = event.latLng?.lng();
            if (typeof lat === "number" && typeof lon === "number") {
              updateGuess(lat, lon);
            }
          });
        }
        if (existingGuess) {
          placeMarker(existingGuess, false);
        }
        setMapError("");
      })
      .catch((error: Error) => setMapError(error.message))
      .finally(() => {
        if (!cancelled) setLoadingMap(false);
      });

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
    };
  }, [answerLocked, existingGuess, googleMapsApiKey, mapReadyToLoad, placeMarker, updateGuess]);

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
      recenterMap();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [mapOpen, recenterMap]);

  const hasMap = Boolean(googleMapsApiKey);
  const gridClass =
    layout === "stacked"
      ? "grid min-w-0 gap-0"
      : "grid min-w-0 gap-0 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]";
  const imageSizes = layout === "stacked" ? "100vw" : "(min-width: 1280px) 58vw, 100vw";
  const imageClass =
    layout === "stacked"
      ? "aspect-[4/3] min-h-[320px] w-full sm:aspect-video sm:min-h-[420px]"
      : "aspect-[4/3] min-h-[320px] w-full sm:aspect-video sm:min-h-[300px]";
  const mapShellClass = mapOpen
    ? "fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#fdf7e8] text-[#273125]"
    : "relative min-h-[280px] flex-1 overflow-hidden rounded border border-[#d8ded0] bg-[#e9dcc0] sm:min-h-[320px]";

  return (
    <section className="w-full min-w-0 overflow-hidden rounded border border-[#c49a3c]/55 bg-[#fdf7e8]">
      <div className={gridClass}>
        <div className="min-w-0 bg-[#061d2b]">
          {streetViewUrl ? (
            <SlowGeoImageViewer
              src={streetViewUrl}
              alt="SlowGeo-bilde"
              sizes={imageSizes}
              className={imageClass}
              staticViewConfig={streetViewStaticViewConfig}
              streetViewPanorama={streetViewPanorama}
              viewMode={imageViewMode}
              onPanoramaUnavailable={handlePanoramaUnavailable}
              title={roundName}
            />
          ) : (
            <div className="flex min-h-[240px] w-full items-center justify-center px-6 text-center text-sm font-semibold text-[#fdf7e8] sm:min-h-[300px]">
              Street View-bildet mangler pano-ID eller Google-nøkkel. Sett Google-miljøvariablene og opprett en ny runde.
            </div>
          )}
          {slowGeoMode === "panorama" ? (
            <div className="border-t border-white/10 bg-[#0b2838] px-4 py-3 text-sm leading-6 text-[#eadcbd]">
              <span className="font-semibold text-white">Panorama-modus.</span>{" "}
              {streetViewPanorama ? "360-visningen åpnes i fullskjerm." : "Panorama mangler for dette bildet."}
            </div>
          ) : null}
          {showPanoramaRetry ? (
            <form action={replaceSlowGeoPanoramaAction} className="grid gap-3 border-t border-white/10 bg-[#fdf7e8] px-4 py-4 text-[#273125]">
              <input type="hidden" name="round_id" value={roundId} />
              <input type="hidden" name="return_to" value={replacePanoramaReturnTo} />
              <p className="text-sm leading-6 text-[#4f412b]">
                Panorama kunne ikke lastes for dette bildet.
                {canReplacePanorama && !answerLocked
                  ? " Du kan bytte til et nytt panorama før første pin-svar låses."
                  : " Runden beholdes fordi minst ett pin-svar er låst."}
              </p>
              {canReplacePanorama && !answerLocked ? (
                <PendingSubmitButton className="inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-[#203c62] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172d4b] sm:w-auto">
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Prøv nytt panorama
                </PendingSubmitButton>
              ) : null}
            </form>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-[#eadcbd]">
            <span>{slowGeoMode === "panorama" ? "Google Street View · Panorama" : "Google Street View · Statisk"}</span>
            {showShareButton ? (
              <SlowGeoThreadShareButton
                title={`SlowGeo: ${roundName}`}
                texts={openShareTexts}
                url={shareUrl}
                label="Del iMessage-tråden"
                copiedLabel="Trådtekst kopiert"
                tone="dark"
                className="min-w-[260px]"
              />
            ) : null}
          </div>
        </div>

        <form action={submitSlowGeoGuessAction} className="geo-form flex min-h-[420px] min-w-0 flex-col gap-4 p-4 sm:p-5">
          <input type="hidden" name="round_id" value={roundId} />
          <input type="hidden" name="return_to" value={returnTo ?? `/runder/${roundId}`} />
          {hasMap ? (
            <>
              <input type="hidden" name="guess_lat" value={guess?.lat ?? ""} />
              <input type="hidden" name="guess_lon" value={guess?.lon ?? ""} />
            </>
          ) : null}
          <input type="hidden" name="guess_label" value={guess?.label ?? ""} />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">Ditt svar</p>
              <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">
                {answerLocked ? "Pin-svaret er låst" : "Sett pinnen"}
              </h2>
            </div>
            <p className="rounded border border-[#d8ded0] bg-white px-3 py-2 text-sm font-semibold text-[#203c62]">
              Frist {deadlineAt ? dateTimeLabel(deadlineAt) : "ikke satt"}
            </p>
          </div>

          {hasMap ? (
            <>
              <div
                ref={mapShellRef}
                className={mapShellClass}
                role={mapOpen ? "dialog" : undefined}
                aria-modal={mapOpen ? "true" : undefined}
                aria-label={mapOpen ? "Sett pin i kart" : undefined}
                style={{ touchAction: "none", overscrollBehavior: mapOpen ? "none" : "contain" }}
              >
                {mapOpen ? (
                  <div className="flex items-center justify-between gap-3 border-b border-[#d8ded0] bg-[#fdf7e8] px-3 py-3 shadow-sm">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
                        SlowGeo-kart
                      </p>
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
                    data-testid="slowgeo-map-surface"
                    className="absolute inset-0"
                    style={{ touchAction: "none", overscrollBehavior: "contain" }}
                  />
                  {loadingMap ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-semibold text-[#203c62]">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Laster kart
                    </div>
                  ) : !mapReadyToLoad ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/55 text-sm font-semibold text-[#203c62]">
                      Kartet klargjøres
                    </div>
                  ) : null}
                </div>
                {mapOpen ? (
                  <div className="grid gap-3 border-t border-[#d8ded0] bg-[#fdf7e8] px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                    <p className="flex min-h-10 items-center gap-2 rounded border border-[#d8ded0] bg-white px-3 text-sm text-[#5b6257]">
                      <MapPin className="h-4 w-4 flex-none text-[#7c2430]" aria-hidden="true" />
                      <span className="min-w-0 break-words">
                        {guess ? `${guess.lat.toFixed(5)}, ${guess.lon.toFixed(5)}` : "Trykk i kartet for å sette pin."}
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_auto_1fr]">
                      <button
                        type="button"
                        onClick={recenterMap}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded border border-[#d8ded0] bg-white px-3 text-sm font-semibold text-[#203c62]"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Sentrer
                      </button>
                      <button
                        type="button"
                        onClick={clearGuess}
                        disabled={!guess || answerLocked}
                        className="inline-flex h-11 items-center justify-center rounded border border-[#d8ded0] bg-white px-3 text-sm font-semibold text-[#203c62] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        Nullstill
                      </button>
                      {answerLocked ? (
                        <span className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded border border-[#285c45]/25 bg-[#285c45]/10 px-4 text-sm font-semibold text-[#285c45] sm:col-span-1">
                          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                          Svar låst
                        </span>
                      ) : (
                        <PendingSubmitButton
                          disabled={!guess}
                          className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded bg-[#285c45] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#214b38] disabled:cursor-not-allowed disabled:opacity-55 sm:col-span-1"
                        >
                          <Send className="h-4 w-4" aria-hidden="true" />
                          Send pin-svar
                        </PendingSubmitButton>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setMapReadyToLoad(true);
                  setMapOpen(true);
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded bg-[#203c62] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172d4b] xl:hidden"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                {answerLocked ? "Vis pin i fullskjermkart" : "Vis kart i fullskjerm"}
              </button>
            </>
          ) : (
            <div className="grid gap-3 rounded border border-[#d8ded0] bg-white p-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#273125]">Breddegrad</span>
                <input
                  name="guess_lat"
                  type="number"
                  step="0.000001"
                  value={guess?.lat ?? ""}
                  onChange={(event) => updateGuess(Number(event.target.value), guess?.lon ?? 0)}
                  disabled={answerLocked}
                  className="h-10 w-full rounded border border-[#d8ded0] px-2 outline-none focus:border-[#203c62]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#273125]">Lengdegrad</span>
                <input
                  name="guess_lon"
                  type="number"
                  step="0.000001"
                  value={guess?.lon ?? ""}
                  onChange={(event) => updateGuess(guess?.lat ?? 0, Number(event.target.value))}
                  disabled={answerLocked}
                  className="h-10 w-full rounded border border-[#d8ded0] px-2 outline-none focus:border-[#203c62]"
                />
              </label>
            </div>
          )}

          {mapError ? (
            <p className="rounded border border-[#8e3030]/25 bg-[#8e3030]/8 px-3 py-2 text-sm font-semibold text-[#8e3030]">
              {mapError}
            </p>
          ) : null}

          <SlowGeoAnswerStatus items={answerStatusItems} />

          <SlowGeoTipPanel tips={tips} />

          <label className="block rounded border border-[#d8ded0] bg-white p-3">
            <span className="text-sm font-semibold text-[#273125]">Begrunnelse</span>
            <textarea
              name="guess_note"
              maxLength={280}
              defaultValue={existingNote ?? ""}
              disabled={answerLocked}
              placeholder="Valgfritt: skriv hva du så, trodde eller overbeviste deg selv om."
              className="mt-2 min-h-24 w-full resize-none rounded border border-[#d8ded0] bg-[#f7f8f5] px-3 py-2 text-sm leading-6 text-[#273125] outline-none focus:border-[#203c62] disabled:bg-[#eef1eb]"
            />
            <span className="mt-2 block text-xs leading-5 text-[#5b6257]">
              Begrunnelsen låses med pinnen og vises først når fasit er avslørt.
            </span>
          </label>

          <div className="flex flex-col gap-3 rounded border border-[#d8ded0] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex min-h-10 items-center gap-2 text-sm text-[#5b6257]">
              <MapPin className="h-4 w-4 flex-none text-[#7c2430]" aria-hidden="true" />
              <span>
                {guess
                  ? `${guess.lat.toFixed(5)}, ${guess.lon.toFixed(5)}${existingGuess?.updatedAt ? ` · låst ${dateTimeLabel(existingGuess.updatedAt)}` : ""}`
                  : "Ingen pin satt ennå."}
              </span>
            </p>
            {answerLocked ? (
              <span className="inline-flex h-11 items-center justify-center gap-2 rounded border border-[#285c45]/25 bg-[#285c45]/10 px-4 text-sm font-semibold text-[#285c45]">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                Svar låst
              </span>
            ) : (
              <PendingSubmitButton
                disabled={!guess}
                className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#285c45] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#214b38] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Send pin-svar
              </PendingSubmitButton>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
