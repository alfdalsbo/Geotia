"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

import {
  loadGoogleMaps,
  type GoogleMap,
  type GoogleMapsApi,
  type GoogleMarker,
  type GooglePolyline,
} from "@/components/google-maps-loader";
import { SlowGeoShareButton } from "@/components/slowgeo-share-button";
import { buildRevealedSlowGeoShareText } from "@/lib/slowgeo-share";
import { formatKm } from "@/lib/utils";

type RevealMarker = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  color: string;
  distanceKm?: number | null;
  type: "answer" | "guess";
};

export function SlowGeoRevealMap({
  roundName,
  streetViewUrl,
  googleMapsApiKey,
  markers,
  shareUrl,
  answerLabel,
  currentPlayerName,
  currentDistanceKm,
  winnerNames,
  imageDate,
  copyright,
}: {
  roundName: string;
  streetViewUrl: string | null;
  googleMapsApiKey: string;
  markers: RevealMarker[];
  shareUrl: string;
  answerLabel: string;
  currentPlayerName?: string;
  currentDistanceKm?: number | null;
  winnerNames: string[];
  imageDate?: string;
  copyright?: string;
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markerRefs = useRef<GoogleMarker[]>([]);
  const polylineRefs = useRef<GooglePolyline[]>([]);
  const [loadingMap, setLoadingMap] = useState(Boolean(googleMapsApiKey));
  const [mapError, setMapError] = useState("");
  const revealSummaryText = buildRevealedSlowGeoShareText({ roundName, answerLabel, winnerNames });
  const shareText =
    currentPlayerName && typeof currentDistanceKm === "number"
      ? `${currentPlayerName} landet ${formatKm(currentDistanceKm)} fra fasit i ${roundName}. Fasit: ${answerLabel}.${winnerNames.length ? ` Vinner: ${winnerNames.join(", ")}.` : ""}`
      : revealSummaryText;

  useEffect(() => {
    if (!googleMapsApiKey || !mapElementRef.current || markers.length === 0) {
      setLoadingMap(false);
      return;
    }

    let cancelled = false;
    setLoadingMap(true);
    loadGoogleMaps(googleMapsApiKey)
      .then((mapsApi: GoogleMapsApi) => {
        if (cancelled || !mapElementRef.current) return;
        const first = markers[0];
        const map = new mapsApi.Map(mapElementRef.current, {
          center: { lat: first.lat, lng: first.lon },
          zoom: 4,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });
        mapRef.current = map;
        const bounds = new mapsApi.LatLngBounds();
        markerRefs.current = markers.map((marker) => {
          const position = { lat: marker.lat, lng: marker.lon };
          bounds.extend(position);
          return new mapsApi.Marker({
            map,
            position,
            title: marker.label,
            label: marker.type === "answer" ? "F" : marker.label.slice(0, 1),
          });
        });
        const answerMarker = markers.find((marker) => marker.type === "answer");
        polylineRefs.current =
          answerMarker
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
        if (markers.length > 1) {
          map.fitBounds(bounds);
        } else {
          map.setCenter({ lat: first.lat, lng: first.lon });
          map.setZoom(7);
        }
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
  }, [googleMapsApiKey, markers]);

  return (
    <section className="overflow-hidden rounded border border-[#c49a3c]/55 bg-[#fff7e6] shadow-[0_16px_34px_rgba(38,26,12,0.12)]">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="bg-[#061d2b]">
          {streetViewUrl ? (
            <div className="relative aspect-video min-h-[240px] w-full sm:min-h-[300px]">
              <Image
                src={streetViewUrl}
                alt="SlowGeo-fasitbilde"
                fill
                sizes="(min-width: 1280px) 55vw, 100vw"
                className="object-cover"
                referrerPolicy="no-referrer-when-downgrade"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex aspect-video min-h-[240px] items-center justify-center px-6 text-center text-sm font-semibold text-[#fff7e6] sm:min-h-[300px]">
              Street View-bildet kan ikke vises uten Google-nøkkel.
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs text-[#eadcbd]">
            <div className="flex flex-col gap-1">
              <span>{imageDate ? `Street View ${imageDate}` : "Google Street View"}</span>
              <span>{copyright ?? "© Google"}</span>
            </div>
            <SlowGeoShareButton
              title={`SlowGeo-fasit: ${roundName}`}
              text={shareText}
              url={shareUrl}
              label="Del fasit"
              copiedLabel="Fasitlenke kopiert"
              tone="dark"
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">Fasit</p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">Kart, linjer og bom</h2>
          </div>
          {googleMapsApiKey ? (
            <div className="relative min-h-[320px] overflow-hidden rounded border border-[#d8ded0] bg-[#e9dcc0]">
              <div ref={mapElementRef} className="absolute inset-0" />
              {loadingMap ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-semibold text-[#203c62]">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Laster kart
                </div>
              ) : null}
            </div>
          ) : null}
          {mapError ? (
            <p className="rounded border border-[#8e3030]/25 bg-[#8e3030]/8 px-3 py-2 text-sm font-semibold text-[#8e3030]">
              {mapError}
            </p>
          ) : null}
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {markers.map((marker) => (
              <div key={marker.id} className="rounded border border-[#d8ded0] bg-white p-3">
                <p className="flex items-center gap-2 font-semibold text-[#203c62]">
                  <span className="h-3 w-3 rounded-sm" style={{ background: marker.color }} />
                  {marker.type === "answer" ? "Fasit" : marker.label.split(":")[0]}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#5b6257]">
                  <MapPin className="mr-1 inline h-3 w-3" aria-hidden="true" />
                  {marker.label}
                </p>
                {marker.type === "guess" ? (
                  <p className="mt-2 font-mono text-[#7c2430]">{formatKm(marker.distanceKm)}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
