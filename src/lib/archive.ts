import { archive, parties, players } from "@/lib/seed";

export const archiveSections = [
  {
    slug: "grunnloven",
    title: "GeoGrunnloven",
    eyebrow: "Konstitusjonen",
    description: "Frister, deltakelse, poeng, kattometer og rikets formelle ro.",
  },
  {
    slug: "leksikon",
    title: "GeoLeksikon",
    eyebrow: "Ord og uttrykk",
    description: "Kjennetegn, begreper, fadesevarsler og språk fra riket.",
  },
  {
    slug: "geoter",
    title: "Geoterregisteret",
    eyebrow: "De syv geograter",
    description: "Personer, partier, styrker, svakheter og offisielle merker.",
  },
  {
    slug: "partier",
    title: "Partiregisteret",
    eyebrow: "GeoTinget",
    description: "Partiene, lederne, ideologiene og de naturlige konfliktene.",
  },
  {
    slug: "merkedager",
    title: "Merkedager",
    eyebrow: "Geotisk kalender",
    description: "Dager som staten har funnet verdige til å huske.",
  },
  {
    slug: "geotinget",
    title: "GeoTinget",
    eyebrow: "Saker og vedtak",
    description: "Forslag, vedtak og saksbehandling i rikets kranglende kammer.",
  },
  {
    slug: "gammel-slowgeo",
    title: "Gammel SlowGeo",
    eyebrow: "Historisk arkiv",
    description: "Tidligere data vist som arkiv, ikke blandet inn i aktiv sesong.",
  },
] as const;

export type ArchiveSectionSlug = (typeof archiveSections)[number]["slug"];

export function getArchiveSection(slug: string) {
  return archiveSections.find((section) => section.slug === slug) ?? null;
}

export const archiveSources = {
  archive,
  players,
  parties,
};
