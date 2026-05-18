"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Loader2, Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";

import { loadGoogleMaps, type GoogleMapsListener, type GoogleStreetViewPanorama } from "@/components/google-maps-loader";
import type { SlowGeoStreetViewPanoramaConfig } from "@/lib/streetview-panorama";
import {
  buildStreetViewStaticCrop,
  buildStreetViewStaticCropUrlFromSource,
  maxScaleForStreetViewStaticFov,
  STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE,
  type StreetViewStaticCrop,
  type StreetViewStaticViewConfig,
} from "@/lib/streetview-url";
import { cn } from "@/lib/utils";

type Point = {
  x: number;
  y: number;
};

type SlowGeoImageViewerProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  staticViewConfig?: StreetViewStaticViewConfig | null;
  streetViewPanorama?: SlowGeoStreetViewPanoramaConfig | null;
  viewMode?: "static" | "panorama";
  priority?: boolean;
  title?: string;
};

const minScale = 1;
const maxScale = 4;
const zoomStep = 0.5;
const maxPanoramaZoom = 4;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function SlowGeoImageViewer({
  src,
  alt,
  sizes,
  className,
  imageClassName,
  staticViewConfig,
  streetViewPanorama,
  viewMode = "static",
  priority = false,
  title = "SlowGeo-bilde",
}: SlowGeoImageViewerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panoramaElementRef = useRef<HTMLDivElement | null>(null);
  const panoramaRef = useRef<GoogleStreetViewPanorama | null>(null);
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const dragStartRef = useRef<{ point: Point; offset: Point } | null>(null);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [interacting, setInteracting] = useState(false);
  const [panoramaStatus, setPanoramaStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [activeStaticCrop, setActiveStaticCrop] = useState<StreetViewStaticCrop | null>(null);
  const [loadingStaticCrop, setLoadingStaticCrop] = useState(false);
  const panoramaEnabled = viewMode === "panorama" && Boolean(streetViewPanorama);
  const initialStaticCrop = useMemo(() => {
    if (!staticViewConfig) return null;
    return buildStreetViewStaticCrop({
      ...staticViewConfig,
      zoom: 1,
      centerX: 0,
      centerY: 0,
    });
  }, [staticViewConfig]);
  const staticMaxScale = staticViewConfig
    ? Math.min(maxScale, maxScaleForStreetViewStaticFov(staticViewConfig.fov))
    : maxScale;
  const committedStaticCrop = activeStaticCrop ?? initialStaticCrop;
  const staticTransformScale = committedStaticCrop ? Math.max(1, scale / committedStaticCrop.zoom) : scale;

  const clampOffset = useCallback((nextOffset: Point, nextScale: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect || nextScale <= 1) return { x: 0, y: 0 };

    return {
      x: clamp(nextOffset.x, -rect.width * (nextScale - 1) * 0.5, rect.width * (nextScale - 1) * 0.5),
      y: clamp(nextOffset.y, -rect.height * (nextScale - 1) * 0.5, rect.height * (nextScale - 1) * 0.5),
    };
  }, []);

  const buildCropFromView = useCallback((nextScale: number, nextOffset: Point) => {
    if (!staticViewConfig) return null;
    const rect = viewportRef.current?.getBoundingClientRect();
    const baseCrop = activeStaticCrop ?? initialStaticCrop;
    const maxX = rect ? rect.width * Math.max(nextScale - 1, 0) * 0.5 : 0;
    const maxY = rect ? rect.height * Math.max(nextScale - 1, 0) * 0.5 : 0;
    const centerX = clamp((baseCrop?.centerX ?? 0) + (maxX > 0 ? -nextOffset.x / maxX : 0), -1, 1);
    const centerY = clamp((baseCrop?.centerY ?? 0) + (maxY > 0 ? nextOffset.y / maxY : 0), -1, 1);

    return buildStreetViewStaticCrop({
      ...staticViewConfig,
      zoom: nextScale,
      centerX,
      centerY,
    });
  }, [activeStaticCrop, initialStaticCrop, staticViewConfig]);

  const applyPanoramaZoom = useCallback((nextScale: number) => {
    if (!panoramaEnabled || !streetViewPanorama || !panoramaRef.current) return;
    panoramaRef.current.setZoom(clamp(streetViewPanorama.initialZoom + nextScale - 1, 0, maxPanoramaZoom));
  }, [panoramaEnabled, streetViewPanorama]);

  const setZoom = useCallback((nextScale: number) => {
    const normalizedScale = clamp(nextScale, minScale, staticMaxScale);
    setScale(normalizedScale);
    applyPanoramaZoom(normalizedScale);
    setOffset((current) => clampOffset(current, normalizedScale));
  }, [applyPanoramaZoom, clampOffset, staticMaxScale]);

  const resetViewer = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setActiveStaticCrop(initialStaticCrop);
    setLoadingStaticCrop(false);
    if (panoramaEnabled && streetViewPanorama && panoramaRef.current) {
      panoramaRef.current.setPov(streetViewPanorama.pov);
      panoramaRef.current.setZoom(streetViewPanorama.initialZoom);
    }
  }, [initialStaticCrop, panoramaEnabled, streetViewPanorama]);

  const openViewer = useCallback(() => {
    resetViewer();
    setPanoramaStatus(panoramaEnabled ? "loading" : "idle");
    setOpen(true);
  }, [panoramaEnabled, resetViewer]);

  const closeViewer = useCallback(() => {
    setOpen(false);
    resetViewer();
    panoramaRef.current = null;
    setPanoramaStatus("idle");
    pointersRef.current.clear();
    dragStartRef.current = null;
    pinchStartRef.current = null;
    setInteracting(false);
  }, [resetViewer]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeViewer, open]);

  useEffect(() => {
    if (!open || !panoramaEnabled || !streetViewPanorama || !panoramaElementRef.current) return;

    let cancelled = false;
    const listeners: GoogleMapsListener[] = [];
    const element = panoramaElementRef.current;
    setPanoramaStatus("loading");

    loadGoogleMaps(streetViewPanorama.apiKey)
      .then((mapsApi) => {
        if (cancelled) return;
        if (!mapsApi.StreetViewPanorama) {
          throw new Error("Street View-panorama er ikke tilgjengelig.");
        }

        const options: Record<string, unknown> = {
          pov: streetViewPanorama.pov,
          zoom: streetViewPanorama.initialZoom,
          addressControl: false,
          clickToGo: false,
          disableDefaultUI: true,
          enableCloseButton: false,
          fullscreenControl: false,
          imageDateControl: false,
          linksControl: false,
          motionTracking: false,
          motionTrackingControl: false,
          panControl: false,
          scrollwheel: true,
          showRoadLabels: false,
          visible: true,
          zoomControl: false,
        };
        if (streetViewPanorama.panoId) {
          options.pano = streetViewPanorama.panoId;
        } else {
          options.position = streetViewPanorama.position;
        }

        const panorama = new mapsApi.StreetViewPanorama(element, options);
        panoramaRef.current = panorama;
        const statusListener = panorama.addListener?.("status_changed", () => {
          const status = panorama.getStatus?.();
          if (status && status !== "OK") {
            panoramaRef.current = null;
            setPanoramaStatus("error");
          }
        });
        if (statusListener) listeners.push(statusListener);
        setPanoramaStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setPanoramaStatus("error");
      });

    return () => {
      cancelled = true;
      listeners.forEach((listener) => listener.remove());
      panoramaRef.current = null;
    };
  }, [open, panoramaEnabled, streetViewPanorama]);

  useEffect(() => {
    if (!open || panoramaEnabled || !staticViewConfig || interacting) return;

    const timer = window.setTimeout(() => {
      const nextCrop = buildCropFromView(scale, offset);
      if (!nextCrop) return;

      const current = activeStaticCrop ?? initialStaticCrop;
      const changed =
        !current ||
        Math.abs(current.zoom - nextCrop.zoom) > 0.001 ||
        Math.abs(current.centerX - nextCrop.centerX) > 0.001 ||
        Math.abs(current.centerY - nextCrop.centerY) > 0.001 ||
        Math.abs(current.heading - nextCrop.heading) > 0.001 ||
        Math.abs(current.pitch - nextCrop.pitch) > 0.001 ||
        Math.abs(current.fov - nextCrop.fov) > 0.001;

      if (!changed) return;
      setLoadingStaticCrop(true);
      setActiveStaticCrop(nextCrop);
      setOffset({ x: 0, y: 0 });
    }, 160);

    return () => window.clearTimeout(timer);
  }, [
    activeStaticCrop,
    buildCropFromView,
    initialStaticCrop,
    interacting,
    offset,
    open,
    panoramaEnabled,
    scale,
    staticViewConfig,
  ]);

  function beginDrag(point: Point) {
    dragStartRef.current = {
      point,
      offset,
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (panoramaEnabled && panoramaStatus !== "error") return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointer events in tests do not always create an active capture target.
    }
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setInteracting(true);

    const points = Array.from(pointersRef.current.values());
    if (points.length === 1) {
      beginDrag(points[0]);
      pinchStartRef.current = null;
      return;
    }

    if (points.length === 2) {
      dragStartRef.current = null;
      pinchStartRef.current = {
        distance: distance(points[0], points[1]),
        scale,
      };
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (panoramaEnabled && panoramaStatus !== "error") return;
    if (!pointersRef.current.has(event.pointerId)) return;
    event.preventDefault();
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = Array.from(pointersRef.current.values());

    if (points.length === 2 && pinchStartRef.current) {
      const nextScale = clamp(
        pinchStartRef.current.scale * (distance(points[0], points[1]) / pinchStartRef.current.distance),
        minScale,
        staticMaxScale,
      );
      setScale(nextScale);
      setOffset((current) => clampOffset(current, nextScale));
      return;
    }

    if (points.length === 1 && dragStartRef.current && scale > 1) {
      const delta = {
        x: points[0].x - dragStartRef.current.point.x,
        y: points[0].y - dragStartRef.current.point.y,
      };
      setOffset(
        clampOffset(
          {
            x: dragStartRef.current.offset.x + delta.x,
            y: dragStartRef.current.offset.y + delta.y,
          },
          scale,
        ),
      );
    }
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (panoramaEnabled && panoramaStatus !== "error") return;
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore stale pointer capture after cancelled gestures.
      }
    }
    pointersRef.current.delete(event.pointerId);
    const points = Array.from(pointersRef.current.values());

    if (points.length === 1) {
      beginDrag(points[0]);
      pinchStartRef.current = null;
      return;
    }

    dragStartRef.current = null;
    pinchStartRef.current = null;
    setInteracting(false);
  }

  const usePanorama = Boolean(panoramaEnabled && panoramaStatus !== "error");
  const zoomControlsDisabled = usePanorama && panoramaStatus !== "ready";
  const activeStaticSrc =
    staticViewConfig && committedStaticCrop
      ? buildStreetViewStaticCropUrlFromSource({
          sourceUrl: src,
          crop: committedStaticCrop,
          size: staticViewConfig.size ?? STREET_VIEW_STATIC_FULLSCREEN_IMAGE_SIZE,
        })
      : src;

  return (
    <>
      <button
        type="button"
        onClick={openViewer}
        className={cn("group relative block w-full overflow-hidden bg-[#061d2b] text-left", className)}
        aria-label="Åpne SlowGeo-bildet i fullskjerm"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
          referrerPolicy="no-referrer-when-downgrade"
          unoptimized
          priority={priority}
        />
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex h-10 items-center gap-2 rounded bg-[#061d2b]/82 px-3 text-sm font-semibold text-white shadow-sm ring-1 ring-white/20 backdrop-blur">
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
          Fullskjerm
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#061d2b] text-white"
          role="dialog"
          aria-modal="true"
          aria-label="SlowGeo-bilde i fullskjerm"
        >
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 bg-[#061d2b]/95 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{title}</p>
              <p className="font-mono text-xs text-[#eadcbd]">{Math.round(scale * 100)}%</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom(scale - zoomStep)}
                disabled={zoomControlsDisabled || scale <= minScale}
                className="inline-flex h-11 w-11 items-center justify-center rounded border border-white/15 bg-white/10 text-white disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Zoom ut"
              >
                <Minus className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={resetViewer}
                className="inline-flex h-11 w-11 items-center justify-center rounded border border-white/15 bg-white/10 text-white"
                aria-label="Tilbakestill zoom"
              >
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(scale + zoomStep)}
                disabled={zoomControlsDisabled || scale >= staticMaxScale}
                className="inline-flex h-11 w-11 items-center justify-center rounded border border-white/15 bg-white/10 text-white disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Zoom inn"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={closeViewer}
                className="inline-flex h-11 w-11 items-center justify-center rounded border border-white/15 bg-white text-[#061d2b]"
                aria-label="Lukk bilde"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {usePanorama ? (
            <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
              <div ref={panoramaElementRef} data-testid="slowgeo-panorama-viewport" className="absolute inset-0" />
              {panoramaStatus === "loading" ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-semibold text-white">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Laster panorama
                </div>
              ) : null}
            </div>
          ) : (
            <div
              ref={viewportRef}
              data-testid="slowgeo-image-viewport"
              className="relative min-h-0 flex-1 overflow-hidden bg-black"
              style={{ touchAction: "none" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              onDoubleClick={() => (scale === 1 ? setZoom(2) : resetViewer())}
            >
              <Image
                key={activeStaticSrc}
                src={activeStaticSrc}
                alt={alt}
                fill
                sizes="100vw"
                className="object-contain will-change-transform"
                style={{
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${staticTransformScale})`,
                  transition: interacting ? "none" : "transform 160ms ease-out",
                }}
                referrerPolicy="no-referrer-when-downgrade"
                unoptimized
                priority
                onLoad={() => setLoadingStaticCrop(false)}
                onError={() => setLoadingStaticCrop(false)}
              />
              {loadingStaticCrop ? (
                <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/65 px-3 py-2 text-xs font-semibold text-white">
                  Laster skarpere utsnitt
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
