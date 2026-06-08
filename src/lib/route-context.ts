export type RouteAreaId = "home" | "slowgeo" | "geotinget" | "ordenen" | "arkiv" | "min-geot";

export type RouteMatch = string;

export type RiksNavItem = {
  id: RouteAreaId;
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  match: readonly RouteMatch[];
};

export type SecondaryNavItem = {
  id: string;
  href: string;
  label: string;
  description: string;
  match: readonly RouteMatch[];
};

export const RIKS_NAV_ITEMS: readonly RiksNavItem[] = [
  {
    id: "home",
    href: "/",
    label: "Kommandosentral",
    shortLabel: "Kommando",
    description: "Start og veivalg",
    match: ["/"],
  },
  {
    id: "slowgeo",
    href: "/spill/slowgeo",
    label: "SlowGeo",
    shortLabel: "SlowGeo",
    description: "Spill, tabeller og fasitarkiv",
    match: ["/spill*", "/slowgeo*", "/runder*", "/tabeller", "/stilling", "/hall-of-fame"],
  },
  {
    id: "geotinget",
    href: "/geotinget",
    label: "GeoTinget",
    shortLabel: "Tinget",
    description: "Forslag, urner og vedtak",
    match: ["/geotinget*"],
  },
  {
    id: "ordenen",
    href: "/ordenen",
    label: "Ordenen",
    shortLabel: "Ordenen",
    description: "Rang, prøver og rettigheter",
    match: ["/ordenen"],
  },
  {
    id: "arkiv",
    href: "/arkiv",
    label: "Riksarkivet",
    shortLabel: "Arkivet",
    description: "Lore, lover og tegnlære",
    match: ["/arkiv*"],
  },
  {
    id: "min-geot",
    href: "/min-geot",
    label: "Min geot",
    shortLabel: "Min geot",
    description: "Din mappe og rolle",
    match: ["/min-geot", "/tredje-kollegium", "/geoversitetet"],
  },
];

export const SLOWGEO_SECONDARY_NAV: readonly SecondaryNavItem[] = [
  {
    id: "spillrom",
    href: "/spill/slowgeo",
    label: "Spill nå",
    description: "Start og følg SlowGeo",
    match: ["/spill*", "/slowgeo*"],
  },
  {
    id: "tabeller",
    href: "/tabeller",
    label: "Tabeller",
    description: "Poeng og kattometer",
    match: ["/tabeller", "/stilling"],
  },
  {
    id: "runder",
    href: "/runder",
    label: "Fasitarkiv",
    description: "Ferdige kort og protokoll",
    match: ["/runder*"],
  },
  {
    id: "aereshall",
    href: "/hall-of-fame",
    label: "Æreshall",
    description: "Rekorder og bragder",
    match: ["/hall-of-fame"],
  },
];

const ROUTE_LABELS: readonly { match: readonly RouteMatch[]; label: string; shortLabel?: string }[] = [
  { match: ["/"], label: "Kommandosentral" },
  { match: ["/spill/slowgeo"], label: "Spill nå", shortLabel: "Spill nå" },
  { match: ["/spill/registrer*"], label: "Spillregistrering", shortLabel: "Registrer" },
  { match: ["/slowgeo*"], label: "SlowGeo-kort", shortLabel: "Delingskort" },
  { match: ["/runder*"], label: "Fasitarkiv", shortLabel: "Fasit" },
  { match: ["/tabeller"], label: "Rikets tabeller", shortLabel: "Tabeller" },
  { match: ["/stilling"], label: "SlowGeo-tabell", shortLabel: "Stilling" },
  { match: ["/hall-of-fame"], label: "Æreshallen", shortLabel: "Ære" },
  { match: ["/geotinget/avstemninger*"], label: "Stemmeurnen", shortLabel: "Urnen" },
  { match: ["/geotinget/pergamenter*"], label: "Tingpergamentene", shortLabel: "Pergamenter" },
  { match: ["/geotinget*"], label: "Tingvollen", shortLabel: "Tingvollen" },
  { match: ["/ordenen"], label: "Den Geotiske Orden", shortLabel: "Ordenen" },
  { match: ["/arkiv/ny-i-geotia"], label: "Ny i Geotia", shortLabel: "Ny i Geotia" },
  { match: ["/arkiv/*"], label: "Arkivseksjon", shortLabel: "Arkiv" },
  { match: ["/arkiv"], label: "Riksarkivet", shortLabel: "Arkivet" },
  { match: ["/min-geot"], label: "Min geot" },
  { match: ["/tredje-kollegium"], label: "Tredje Kollegium", shortLabel: "3K" },
  { match: ["/geoversitetet"], label: "Geoversitetet", shortLabel: "Geo-U" },
];

export function routeMatches(pathname: string | null | undefined, pattern: RouteMatch) {
  const path = normalizePath(pathname);
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return prefix.endsWith("/")
      ? path.startsWith(prefix)
      : path === prefix || path.startsWith(`${prefix}/`);
  }
  return path === pattern;
}

export function itemMatches(pathname: string | null | undefined, item: { match: readonly RouteMatch[] }) {
  return item.match.some((pattern) => routeMatches(pathname, pattern));
}

export function getRouteContext(pathname: string | null | undefined) {
  const path = normalizePath(pathname);
  const primary = RIKS_NAV_ITEMS.find((item) => itemMatches(path, item)) ?? RIKS_NAV_ITEMS[0];
  const label = ROUTE_LABELS.find((candidate) => candidate.match.some((pattern) => routeMatches(path, pattern)));
  const pageLabel = label?.label ?? primary.label;
  const shortPageLabel = label?.shortLabel ?? pageLabel;
  const trail =
    pageLabel === primary.label
      ? ["Geotia", primary.label]
      : ["Geotia", primary.label, pageLabel];

  return {
    pathname: path,
    primary,
    pageLabel,
    shortPageLabel,
    trail,
  };
}

function normalizePath(pathname: string | null | undefined) {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}
