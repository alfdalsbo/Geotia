import type { GeoLocation, Player, PlayerResult, RoundMapSnapshot } from "@/lib/types";

const EARTH_RADIUS_KM = 6371.0088;

export function normalizeGeoQuery(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isGeoLocation(value: unknown): value is GeoLocation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GeoLocation>;
  return (
    typeof candidate.lat === "number" &&
    Number.isFinite(candidate.lat) &&
    typeof candidate.lon === "number" &&
    Number.isFinite(candidate.lon) &&
    typeof candidate.label === "string" &&
    typeof candidate.query === "string" &&
    (candidate.source === "nominatim" || candidate.source === "manual")
  );
}

export function parseGeoLocationJson(value: string): GeoLocation | null {
  if (!value.trim()) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return isGeoLocation(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKm(from: GeoLocation, to: GeoLocation) {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLon = toRadians(to.lon - from.lon);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

export function buildRoundMapSnapshot({
  answerLocation,
  players,
  results,
}: {
  answerLocation: GeoLocation | null;
  players: Player[];
  results: PlayerResult[];
}): RoundMapSnapshot | null {
  if (!answerLocation) return null;

  const playerById = new Map(players.map((player) => [player.id, player]));
  const markers = [
    {
      id: "answer",
      type: "answer" as const,
      label: answerLocation.label,
      lat: answerLocation.lat,
      lon: answerLocation.lon,
      color: "#7c2430",
      distanceKm: 0,
    },
    ...results
      .filter((result) => result.status === "deltatt" && result.guessLocation)
      .map((result) => {
        const player = playerById.get(result.playerId);
        const location = result.guessLocation!;
        return {
          id: `guess-${result.playerId}`,
          type: "guess" as const,
          playerId: result.playerId,
          label: `${player?.shortName ?? result.playerId}: ${location.label}`,
          lat: location.lat,
          lon: location.lon,
          color: player?.color ?? "#203c62",
          distanceKm: typeof result.actualKm === "number" ? result.actualKm : haversineKm(answerLocation, location),
        };
      }),
  ];

  const lats = markers.map((marker) => marker.lat);
  const lons = markers.map((marker) => marker.lon);
  const north = Math.max(...lats);
  const south = Math.min(...lats);
  const east = Math.max(...lons);
  const west = Math.min(...lons);
  const latPad = Math.max(0.2, (north - south) * 0.18);
  const lonPad = Math.max(0.2, (east - west) * 0.18);

  return {
    bounds: {
      north: Math.min(85, north + latPad),
      south: Math.max(-85, south - latPad),
      east: Math.min(180, east + lonPad),
      west: Math.max(-180, west - lonPad),
    },
    markers,
  };
}
