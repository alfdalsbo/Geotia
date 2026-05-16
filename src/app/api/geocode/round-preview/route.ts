import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { haversineKm, normalizeGeoQuery } from "@/lib/geo";
import { getCachedGeocodeLocation, setCachedGeocodeLocation } from "@/lib/store";
import type { GeoLocation } from "@/lib/types";

type RoundPreviewRequest = {
  answer: string;
  guesses: Array<{
    playerId: string;
    text: string;
  }>;
};

type NominatimPlace = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    country?: string;
  };
};

let lastNominatimRequestAt = 0;

function userAgent() {
  return process.env.GEOTIA_NOMINATIM_USER_AGENT || "GeotiaSlowGeo/0.1 (private SlowGeo archive)";
}

function isRoundPreviewRequest(value: unknown): value is RoundPreviewRequest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RoundPreviewRequest>;
  return (
    typeof candidate.answer === "string" &&
    Array.isArray(candidate.guesses) &&
    candidate.guesses.every((guess) => {
      return (
        guess &&
        typeof guess === "object" &&
        typeof guess.playerId === "string" &&
        typeof guess.text === "string"
      );
    })
  );
}

async function waitForNominatimSlot() {
  const elapsed = Date.now() - lastNominatimRequestAt;
  const delayMs = Math.max(0, 1100 - elapsed);
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  lastNominatimRequestAt = Date.now();
}

async function geocode(text: string): Promise<GeoLocation | null> {
  const query = text.trim();
  const queryKey = normalizeGeoQuery(query);
  if (!queryKey) return null;

  const cached = await getCachedGeocodeLocation(queryKey);
  if (cached !== undefined) return cached;

  await waitForNominatimSlot();
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "Accept-Language": "nb,en;q=0.8",
      "User-Agent": userAgent(),
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim svarte ${response.status}`);
  }

  const places = (await response.json()) as NominatimPlace[];
  const place = places[0];
  const location = place
    ? {
        lat: Number(place.lat),
        lon: Number(place.lon),
        label: place.display_name,
        query,
        country: place.address?.country,
        source: "nominatim" as const,
      }
    : null;

  await setCachedGeocodeLocation(queryKey, location);
  return location;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget." }, { status: 401 });
  }

  const payload = (await request.json()) as unknown;
  if (!isRoundPreviewRequest(payload)) {
    return NextResponse.json({ error: "Ugyldig geokodeforespørsel." }, { status: 400 });
  }

  try {
    const answerLocation = await geocode(payload.answer);
    const results = [];

    for (const guess of payload.guesses) {
      const location = await geocode(guess.text);
      results.push({
        playerId: guess.playerId,
        location,
        distanceKm: answerLocation && location ? haversineKm(answerLocation, location) : null,
      });
    }

    return NextResponse.json({
      answerLocation,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Geokoding feilet.",
      },
      { status: 502 },
    );
  }
}
