import { archive, parties, players } from "@/lib/seed";

export const archiveSections = [
  {
    slug: "ny-i-geotia",
    title: "Ny i Geotia",
    eyebrow: "Startguide",
    description: "En kort vei inn i riket: hva Geotia er, hva du gjør først, og hvor de viktigste rommene ligger.",
  },
  {
    slug: "kanon",
    title: "Rikets fulltekst",
    eyebrow: "Kanon",
    description: "Alt innsendt grunnstoff fra Geotia samlet som lesbar fulltekst.",
  },
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
    slug: "kjennelaere",
    title: "Kjennelæren",
    eyebrow: "GeoHeuristikk",
    description: "Skilt, stolper, veier, GeoGuessr-tips, magefølelse og andre nesten-sannheter.",
  },
  {
    slug: "geoter",
    title: "Geoterregisteret",
    eyebrow: "Geoter og tingvitner",
    description: "Personer, partier, benkeplasser, styrker, svakheter og offisielle merker.",
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
    slug: "episoder",
    title: "Rikets episoder",
    eyebrow: "Historiske hendelser",
    description: "Sarajevodagen, Byvandringsdagen, Pinot Noir, El Tari og andre hendelser med varig rettsvirkning.",
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
    eyebrow: "Den gamle tiden",
    description: "Importert æra fra før appens levende protokoll. Poeng og kattometer holdes ærbødig adskilt.",
  },
  {
    slug: "konespillet",
    title: "Konespillet",
    eyebrow: "Paraspill",
    description: "Et inoffisielt reaksjonsregister ført med altfor stor alvor.",
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
