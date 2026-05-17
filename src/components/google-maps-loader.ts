"use client";

export type LatLngLiteral = {
  lat: number;
  lng: number;
};

export type GoogleMapClickEvent = {
  latLng?: {
    lat(): number;
    lng(): number;
  };
};

export type GoogleLatLngBounds = {
  extend(point: LatLngLiteral): void;
};

export type GoogleMap = {
  addListener(eventName: string, handler: (event: GoogleMapClickEvent) => void): unknown;
  fitBounds(bounds: GoogleLatLngBounds): void;
  setCenter(point: LatLngLiteral): void;
  setZoom(zoom: number): void;
};

export type GoogleMarker = {
  setMap(map: GoogleMap | null): void;
  setPosition(point: LatLngLiteral): void;
};

export type GooglePolyline = {
  setMap(map: GoogleMap | null): void;
};

export type GoogleStreetViewPov = {
  heading: number;
  pitch: number;
};

export type GoogleMapsListener = {
  remove(): void;
};

export type GoogleStreetViewPanorama = {
  addListener?(eventName: string, handler: () => void): GoogleMapsListener | void;
  getStatus?(): string;
  getZoom(): number;
  setPov(pov: GoogleStreetViewPov): void;
  setZoom(zoom: number): void;
};

export type GoogleMapsApi = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap;
  Marker: new (options: Record<string, unknown>) => GoogleMarker;
  Polyline: new (options: Record<string, unknown>) => GooglePolyline;
  StreetViewPanorama?: new (element: HTMLElement, options: Record<string, unknown>) => GoogleStreetViewPanorama;
  LatLngBounds: new () => GoogleLatLngBounds;
  event?: {
    trigger(instance: unknown, eventName: string): void;
  };
};

declare global {
  interface Window {
    google?: {
      maps: GoogleMapsApi;
    };
    __slowGeoGoogleMapsPromise?: Promise<GoogleMapsApi>;
  }
}

export function loadGoogleMaps(apiKey: string) {
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API-nøkkel mangler."));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (window.__slowGeoGoogleMapsPromise) {
    return window.__slowGeoGoogleMapsPromise;
  }

  window.__slowGeoGoogleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-slowgeo-google-maps]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google!.maps), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google Maps kunne ikke lastes.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.dataset.slowgeoGoogleMaps = "true";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps startet ikke riktig."));
      }
    };
    script.onerror = () => reject(new Error("Google Maps kunne ikke lastes."));
    document.head.appendChild(script);
  });

  return window.__slowGeoGoogleMapsPromise;
}
