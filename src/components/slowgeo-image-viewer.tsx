"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";

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
  priority?: boolean;
  title?: string;
};

const minScale = 1;
const maxScale = 4;
const zoomStep = 0.5;

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
  priority = false,
  title = "SlowGeo-bilde",
}: SlowGeoImageViewerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const dragStartRef = useRef<{ point: Point; offset: Point } | null>(null);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [interacting, setInteracting] = useState(false);

  const clampOffset = useCallback((nextOffset: Point, nextScale: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect || nextScale <= 1) return { x: 0, y: 0 };

    return {
      x: clamp(nextOffset.x, -rect.width * (nextScale - 1) * 0.5, rect.width * (nextScale - 1) * 0.5),
      y: clamp(nextOffset.y, -rect.height * (nextScale - 1) * 0.5, rect.height * (nextScale - 1) * 0.5),
    };
  }, []);

  const setZoom = useCallback((nextScale: number) => {
    const normalizedScale = clamp(nextScale, minScale, maxScale);
    setScale(normalizedScale);
    setOffset((current) => clampOffset(current, normalizedScale));
  }, [clampOffset]);

  const resetViewer = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const openViewer = useCallback(() => {
    resetViewer();
    setOpen(true);
  }, [resetViewer]);

  const closeViewer = useCallback(() => {
    setOpen(false);
    resetViewer();
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

  function beginDrag(point: Point) {
    dragStartRef.current = {
      point,
      offset,
    };
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
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
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = Array.from(pointersRef.current.values());

    if (points.length === 2 && pinchStartRef.current) {
      const nextScale = clamp(
        pinchStartRef.current.scale * (distance(points[0], points[1]) / pinchStartRef.current.distance),
        minScale,
        maxScale,
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
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
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
                disabled={scale <= minScale}
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
                disabled={scale >= maxScale}
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
              src={src}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain will-change-transform"
              style={{
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                transition: interacting ? "none" : "transform 160ms ease-out",
              }}
              referrerPolicy="no-referrer-when-downgrade"
              unoptimized
              priority
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
