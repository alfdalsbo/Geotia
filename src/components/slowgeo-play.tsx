"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, LockKeyhole, MapPin, Maximize2, RotateCcw, Send, X } from "lucide-react";

import { submitSlowGeoGuessAction } from "@/app/actions";
import { loadGoogleMaps, type GoogleMap, type GoogleMapsApi, type GoogleMarker } from "@/components/google-maps-loader";
import { SlowGeoShareButton } from "@/components/slowgeo-share-button";
import { buildOpenSlowGeoShareText } from "@/lib/slowgeo-share";
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
  googleMapsApiKey: string;
  existingGuess: (Guess & { updatedAt?: string | null }) | null;
  existingNote?: string | null;
  shareUrl: string;
};

function guessLabel(lat: number, lon: number) {
  return `Pin ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export function SlowGeoPlay({
  roundId,
  roundName,
  deadlineAt,
  streetViewUrl,
  googleMapsApiKey,
  existingGuess,
  existingNote,
  shareUrl,
}: SlowGeoPlayProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const mapsApiRef = useRef<GoogleMapsApi | null>(null);
  const [guess, setGuess] = useState<Guess | null>(existingGuess);
  const [mapError, setMapError] = useState("");
  const [loadingMap, setLoadingMap] = useState(Boolean(googleMapsApiKey));
  const [mapOpen, setMapOpen] = useState(false);
  const answerLocked = Boolean(existingGuess);
  const openShareText = buildOpenSlowGeoShareText(roundName);

  const placeMarker = useCallback((nextGuess: Guess, center = true) => {
    const mapsApi = mapsApiRef.current;
    const map = mapRef.current;
    if (!mapsApi || !map) return;

    const position = { lat: nextGuess.lat, lng: nextGuess.lon };
    if (!markerRef.current) {
      markerRef.current = new mapsApi.Marker({
        map,
        position,
        title: nextGuess.label,
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

  useEffect(() => {
    if (!googleMapsApiKey || !mapElementRef.current) {
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
    };
  }, [answerLocked, existingGuess, googleMapsApiKey, placeMarker, updateGuess]);

  useEffect(() => {
    if (!mapOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMapOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
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
  const mapShellClass = mapOpen
    ? "fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#fff7e6] text-[#273125]"
    : "relative min-h-[280px] flex-1 overflow-hidden rounded border border-[#d8ded0] bg-[#e9dcc0] sm:min-h-[320px]";

  return (
    <section className="overflow-hidden rounded border border-[#c49a3c]/55 bg-[#fff7e6] shadow-[0_16px_34px_rgba(38,26,12,0.12)]">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
        <div className="bg-[#061d2b]">
          {streetViewUrl ? (
            <div className="relative aspect-video min-h-[240px] w-full sm:min-h-[300px]">
              <Image
                src={streetViewUrl}
                alt="SlowGeo-bilde"
                fill
                sizes="(min-width: 1280px) 58vw, 100vw"
                className="object-cover"
                referrerPolicy="no-referrer-when-downgrade"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex aspect-video min-h-[240px] items-center justify-center px-6 text-center text-sm font-semibold text-[#fff7e6] sm:min-h-[300px]">
              Street View-bildet mangler pano-ID eller Google-nøkkel. Sett Google-miljøvariablene og opprett en ny runde.
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-[#eadcbd]">
            <span>Google Street View</span>
            <SlowGeoShareButton
              title={`SlowGeo: ${roundName}`}
              text={openShareText}
              url={shareUrl}
              label="Del iMessage-tråden"
              copiedLabel="Trådtekst kopiert"
              tone="dark"
            />
          </div>
        </div>

        <form action={submitSlowGeoGuessAction} className="flex min-h-[420px] flex-col gap-4 p-4 sm:p-5">
          <input type="hidden" name="round_id" value={roundId} />
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
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded bg-[#203c62] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172d4b] xl:hidden"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                {answerLocked ? "Vis pin i fullskjermkart" : "Sett pin i fullskjermkart"}
              </button>
              <div
                className={mapShellClass}
                role={mapOpen ? "dialog" : undefined}
                aria-modal={mapOpen ? "true" : undefined}
                aria-label={mapOpen ? "Sett pin i kart" : undefined}
              >
                {mapOpen ? (
                  <div className="flex items-center justify-between gap-3 border-b border-[#d8ded0] bg-[#fff7e6] px-3 py-3 shadow-sm">
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
                <div className={mapOpen ? "relative min-h-0 flex-1" : "absolute inset-0"}>
                  <div ref={mapElementRef} data-testid="slowgeo-map-surface" className="absolute inset-0" />
                  {loadingMap ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-semibold text-[#203c62]">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Laster kart
                    </div>
                  ) : null}
                </div>
                {mapOpen ? (
                  <div className="grid gap-3 border-t border-[#d8ded0] bg-[#fff7e6] px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_24px_rgba(38,26,12,0.12)]">
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
                        <button
                          type="submit"
                          disabled={!guess}
                          className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded bg-[#285c45] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#214b38] disabled:cursor-not-allowed disabled:opacity-55 sm:col-span-1"
                        >
                          <Send className="h-4 w-4" aria-hidden="true" />
                          Send pin-svar
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
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
              <button
                type="submit"
                disabled={!guess}
                className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#285c45] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#214b38] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Send pin-svar
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
