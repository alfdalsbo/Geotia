"use client";

import type { GoogleMap, GoogleMapsApi, LatLngLiteral } from "@/components/google-maps-loader";

export type SlowGeoMarkerKind = "answer" | "guess";

export type SlowGeoMapMarker = {
  setMap(map: GoogleMap | null): void;
  setPosition(position: LatLngLiteral): void;
};

type SlowGeoMapMarkerOptions = {
  color: string;
  kind: SlowGeoMarkerKind;
  label?: string;
  map: GoogleMap;
  mapsApi: GoogleMapsApi;
  position: LatLngLiteral;
  title: string;
  zIndex?: number;
};

function shouldUseNativeMarkerOnThisScreen() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches || window.matchMedia("(pointer: coarse)").matches;
}

function nativeMarkerLabel(kind: SlowGeoMarkerKind, label?: string) {
  return {
    text: kind === "answer" ? "!" : label ?? "P",
    color: "#ffffff",
    fontSize: kind === "answer" ? "16px" : "13px",
    fontWeight: "800",
  };
}

function createPinElement({ color, kind, label, title, zIndex }: Omit<SlowGeoMapMarkerOptions, "map" | "mapsApi" | "position">) {
  const isAnswer = kind === "answer";
  const root = document.createElement("div");
  const width = isAnswer ? 58 : 46;
  const height = isAnswer ? 72 : 58;
  const bodySize = isAnswer ? 45 : 36;
  const coreSize = isAnswer ? 25 : 18;

  root.dataset.slowgeoMapMarker = kind;
  root.title = title;
  root.style.position = "absolute";
  root.style.width = `${width}px`;
  root.style.height = `${height}px`;
  root.style.transform = "translate(-50%, -100%)";
  root.style.transformOrigin = "50% 100%";
  root.style.pointerEvents = "auto";
  root.style.zIndex = String(zIndex ?? (isAnswer ? 1000 : 100));
  root.style.filter = "drop-shadow(0 6px 12px rgba(6, 29, 43, 0.34))";

  const pin = document.createElement("div");
  pin.style.position = "absolute";
  pin.style.left = `${(width - bodySize) / 2}px`;
  pin.style.top = isAnswer ? "5px" : "4px";
  pin.style.width = `${bodySize}px`;
  pin.style.height = `${bodySize}px`;
  pin.style.border = isAnswer ? "4px solid #fdf7e8" : "3px solid #fdf7e8";
  pin.style.borderRadius = "50% 50% 50% 0";
  pin.style.background = color;
  pin.style.boxShadow = "0 0 0 2px rgba(196, 154, 60, 0.78)";
  pin.style.transform = "rotate(-45deg)";
  pin.style.transformOrigin = "50% 50%";

  const core = document.createElement("span");
  core.textContent = label ?? "";
  core.style.position = "absolute";
  core.style.left = `${(bodySize - coreSize) / 2}px`;
  core.style.top = `${(bodySize - coreSize) / 2}px`;
  core.style.width = `${coreSize}px`;
  core.style.height = `${coreSize}px`;
  core.style.display = "grid";
  core.style.placeItems = "center";
  core.style.borderRadius = "999px";
  core.style.background = isAnswer ? "#fff3d4" : "#fdf7e8";
  core.style.color = isAnswer ? "#7c2430" : color;
  core.style.fontFamily = "var(--font-sans), system-ui, sans-serif";
  core.style.fontSize = isAnswer ? "13px" : "11px";
  core.style.fontWeight = "800";
  core.style.lineHeight = "1";
  core.style.transform = "rotate(45deg)";

  pin.appendChild(core);
  root.appendChild(pin);
  return root;
}

export function createSlowGeoMapMarker({
  color,
  kind,
  label,
  map,
  mapsApi,
  position,
  title,
  zIndex,
}: SlowGeoMapMarkerOptions): SlowGeoMapMarker {
  if (!mapsApi.OverlayView || shouldUseNativeMarkerOnThisScreen()) {
    return new mapsApi.Marker({
      clickable: false,
      label: nativeMarkerLabel(kind, label),
      map,
      optimized: false,
      position,
      title,
      zIndex,
    });
  }

  const element = createPinElement({ color, kind, label, title, zIndex });
  const overlay = new mapsApi.OverlayView();
  let currentPosition = position;

  overlay.onAdd = () => {
    const panes = overlay.getPanes?.();
    const pane = panes?.overlayMouseTarget ?? panes?.overlayLayer ?? panes?.floatPane;
    pane?.appendChild(element);
  };
  overlay.draw = () => {
    const projection = overlay.getProjection?.();
    const point = projection?.fromLatLngToDivPixel(currentPosition);
    if (!point) return;
    element.style.left = `${point.x}px`;
    element.style.top = `${point.y}px`;
  };
  overlay.onRemove = () => {
    element.remove();
  };
  overlay.setMap(map);

  return {
    setMap(nextMap) {
      overlay.setMap(nextMap);
    },
    setPosition(nextPosition) {
      currentPosition = nextPosition;
      overlay.draw?.();
    },
  };
}
