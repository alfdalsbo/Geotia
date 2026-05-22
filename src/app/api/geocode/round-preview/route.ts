import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { haversineKm, normalizeGeoQuery } from "@/lib/geo";
import { competingPlayers } from "@/lib/seed";
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
const maxGeocodeTextLength = 180;
const nominatimTimeoutMs = 8_000;
const competingPlayerIds = new Set(competingPlayers.map((player) => player.id));

function userAgent() {
  return process.env.GEOTIA_NOMINATIM_USER_AGENT || "GeotiaSlowGeo/0.1 (private SlowGeo archive)";
}

function parseRoundPreviewRequest(value: unknown): RoundPreviewRequest | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<RoundPreviewRequest>;
  if (typeof candidate.answer !== "string" || !Array.isArray(candidate.guesses)) return null;

  const answer = candidate.answer.trim();
  if (!answer || answer.length > maxGeocodeTextLength) return null;
  if (candidate.guesses.length < 1 || candidate.guesses.length > competingPlayers.length) return null;

  const seenPlayerIds = new Set<string>();
  const guesses: RoundPreviewRequest["guesses"] = [];
  for (const guess of candidate.guesses) {
    if (
      !guess ||
      typeof guess !== "object" ||
      typeof guess.playerId !== "string" ||
      typeof guess.text !== "string"
    ) {
      return null;
    }

    const playerId = guess.playerId.trim();
    const text = guess.text.trim();
    if (!competingPlayerIds.has(playerId) || seenPlayerIds.has(playerId) || !text || text.length > maxGeocodeTextLength) {
      return null;
    }

    seenPlayerIds.add(playerId);
    guesses.push({ playerId, text });
  }

  return { answer, guesses };
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), nominatimTimeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "Accept-Language": "nb,en;q=0.8",
        "User-Agent": userAgent(),
      },
    });
  } finally {
    clearTimeout(timeout);
  }

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

function isTimeoutError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Ikke innlogget." }, { status: 401 });
  }

  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig geokodeforespørsel." }, { status: 400 });
  }

  const payload = parseRoundPreviewRequest(rawPayload);
  if (!payload) {
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
        error: isTimeoutError(error)
          ? "Geokoding tok for lang tid."
          : error instanceof Error
            ? error.message
            : "Geokoding feilet.",
      },
      { status: isTimeoutError(error) ? 408 : 502 },
    );
  }
}
