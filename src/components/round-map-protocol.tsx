import type { RoundMapMarker, RoundMapSnapshot } from "@/lib/types";
import { formatKm } from "@/lib/utils";

const TILE_SIZE = 256;
const MAP_WIDTH = 900;
const MAP_HEIGHT = 420;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function project(lat: number, lon: number, zoom: number) {
  const sin = Math.sin((clamp(lat, -85.0511, 85.0511) * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;
  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function chooseViewport(markers: RoundMapMarker[]) {
  const usableWidth = MAP_WIDTH - 150;
  const usableHeight = MAP_HEIGHT - 110;

  for (let zoom = 10; zoom >= 1; zoom -= 1) {
    const projected = markers.map((marker) => project(marker.lat, marker.lon, zoom));
    const xs = projected.map((point) => point.x);
    const ys = projected.map((point) => point.y);
    if (Math.max(...xs) - Math.min(...xs) <= usableWidth && Math.max(...ys) - Math.min(...ys) <= usableHeight) {
      return {
        zoom,
        centerX: (Math.max(...xs) + Math.min(...xs)) / 2,
        centerY: (Math.max(...ys) + Math.min(...ys)) / 2,
      };
    }
  }

  const first = project(markers[0]?.lat ?? 0, markers[0]?.lon ?? 0, 1);
  return { zoom: 1, centerX: first.x, centerY: first.y };
}

export function RoundMapProtocol({ snapshot }: { snapshot: RoundMapSnapshot | null | undefined }) {
  if (!snapshot || snapshot.markers.length === 0) return null;

  const answer = snapshot.markers.find((marker) => marker.type === "answer") ?? snapshot.markers[0];
  const viewport = chooseViewport(snapshot.markers);
  const left = viewport.centerX - MAP_WIDTH / 2;
  const top = viewport.centerY - MAP_HEIGHT / 2;
  const tileMinX = Math.floor(left / TILE_SIZE);
  const tileMaxX = Math.floor((left + MAP_WIDTH) / TILE_SIZE);
  const tileMinY = Math.floor(top / TILE_SIZE);
  const tileMaxY = Math.floor((top + MAP_HEIGHT) / TILE_SIZE);
  const tileLimit = 2 ** viewport.zoom;
  const tiles = [];

  for (let x = tileMinX; x <= tileMaxX; x += 1) {
    for (let y = tileMinY; y <= tileMaxY; y += 1) {
      if (y < 0 || y >= tileLimit) continue;
      const wrappedX = ((x % tileLimit) + tileLimit) % tileLimit;
      tiles.push({
        key: `${x}-${y}`,
        src: `https://tile.openstreetmap.org/${viewport.zoom}/${wrappedX}/${y}.png`,
        x: x * TILE_SIZE - left,
        y: y * TILE_SIZE - top,
      });
    }
  }

  const positioned = snapshot.markers.map((marker) => {
    const point = project(marker.lat, marker.lon, viewport.zoom);
    return {
      ...marker,
      x: point.x - left,
      y: point.y - top,
    };
  });
  const answerPoint = positioned.find((marker) => marker.id === answer.id) ?? positioned[0];

  return (
    <section className="overflow-hidden rounded border border-[#c49a3c]/55 bg-[#061d2b] shadow-[0_18px_38px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-2 border-b border-[#c49a3c]/35 px-4 py-3 text-[#fff7e6] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">Kartprotokoll</p>
          <h2 className="font-display mt-1 text-2xl font-semibold">Fasit og geotenes svar</h2>
        </div>
        <p className="text-sm text-[#eadcbd]">Rekonstruert fra lagrede koordinater</p>
      </div>
      <div className="relative aspect-[15/7] min-h-[330px] w-full overflow-hidden bg-[#d8ded0]">
        <div className="absolute left-1/2 top-1/2" style={{ width: MAP_WIDTH, height: MAP_HEIGHT, transform: "translate(-50%, -50%)" }}>
          {tiles.map((tile) => (
            <div
              key={tile.key}
              aria-hidden="true"
              className="absolute h-64 w-64 max-w-none"
              style={{ left: tile.x, top: tile.y, backgroundImage: `url(${tile.src})`, backgroundSize: "cover" }}
            />
          ))}
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full">
            {positioned
              .filter((marker) => marker.type === "guess")
              .map((marker) => (
                <line
                  key={`line-${marker.id}`}
                  stroke={marker.color}
                  strokeDasharray="6 7"
                  strokeLinecap="round"
                  strokeOpacity="0.75"
                  strokeWidth="3"
                  x1={answerPoint.x}
                  x2={marker.x}
                  y1={answerPoint.y}
                  y2={marker.y}
                />
              ))}
          </svg>
          {positioned.map((marker) => (
            <div
              key={marker.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: marker.x, top: marker.y }}
            >
              <span
                className={
                  marker.type === "answer"
                    ? "block h-6 w-6 rounded-full border-4 border-white shadow-[0_0_0_2px_rgba(124,36,48,0.9),0_8px_18px_rgba(0,0,0,0.3)]"
                    : "block h-4 w-4 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(6,43,64,0.45),0_6px_14px_rgba(0,0,0,0.28)]"
                }
                style={{ background: marker.color }}
              />
            </div>
          ))}
        </div>
        <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-[#203c62]">
          © OpenStreetMap contributors
        </div>
      </div>
      <div className="grid gap-2 bg-[#fff7e6] p-4 text-sm md:grid-cols-2 xl:grid-cols-4">
        {snapshot.markers.map((marker) => (
          <div key={`summary-${marker.id}`} className="rounded border border-[#d8c48c] bg-white/75 p-3">
            <p className="flex items-center gap-2 font-semibold text-[#062b40]">
              <span className="h-3 w-3 rounded-sm" style={{ background: marker.color }} />
              {marker.type === "answer" ? "Fasit" : marker.label.split(":")[0]}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#60553f]">{marker.label}</p>
            {marker.type === "guess" ? (
              <p className="mt-2 font-mono text-[#7c2430]">{formatKm(marker.distanceKm)}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
