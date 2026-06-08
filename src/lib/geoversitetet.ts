import catalog from "@/data/geoversitetet/fagkatalog.json";
import { isThirdCollegeMember } from "@/lib/kollegium";

export type GeoversitetetCatalog = {
  navn: string;
  status: string;
  motto: string;
  roller: Record<string, string>;
  diplomarkiv: DiplomarkivEntry[];
  fakulteter: Fakultet[];
  geofessorer: Geofessor[];
  grader: Grad[];
  studieprogresjon: Studieprogresjon[];
  eksamener: Eksamen[];
  organer: Organ[];
  geofessorprofiler: Geofessorprofil[];
  annales: Annales;
  feltmanual: Feltregel[];
  riksarkiv: RiksarkivEntry[];
};

export type DiplomarkivEntry = {
  navn: string;
  asset: string;
  rolle: string;
  status: string;
};

export type Fakultet = {
  id: string;
  navn: string;
  norsk_navn?: string;
  dekan?: string;
  motto?: string;
  motto_norsk?: string;
  beskrivelse: string;
  avdelinger: string[];
  fag: Array<{
    kode: string;
    navn: string;
    kort: string;
  }>;
};

export type Geofessor = {
  navn: string;
  diplomnavn?: string;
  embete: string;
  titler: string[];
  fag: string[];
  mandat: string;
  diplom_asset: string;
};

export type Grad = {
  kode: string;
  navn: string;
  kort: string;
  krav: string;
};

export type Studieprogresjon = {
  nivå: string;
  kjennetegn: string;
  opprykk: string;
};

export type Eksamen = {
  kode: string;
  navn: string;
  form: string;
  sensur: string;
};

export type Organ = {
  navn: string;
  mandat: string;
  når_aktiveres: string;
};

export type Geofessorprofil = {
  navn: string;
  embete: string;
  signaturteori: string;
  læresetninger: string[];
  avverger: string;
  tilkalles: string;
};

export type Annales = {
  navn: string;
  status: string;
  poster: string[];
  første_utgave: string;
};

export type Feltregel = {
  regel: string;
  forklaring: string;
};

export type RiksarkivEntry = {
  kategori: string;
  bruk: string;
};

export const geoversitetetCatalog = catalog as GeoversitetetCatalog;

export const geoversitetetAssets = {
  "geoversitetet-logo.jpeg": {
    contentType: "image/jpeg",
    label: "Geoversitetets segl",
  },
  "oyologi-kunngjoring.jpeg": {
    contentType: "image/jpeg",
    label: "Kunngjøring for Øyologi",
  },
  "geofessor-steinar-lofnes.png": {
    contentType: "image/png",
    label: "Diplom for Steinar Lofnes",
  },
  "geofessor-alf-kare-dalsbo.png": {
    contentType: "image/png",
    label: "Diplom for Alf Kåre Dalsbø",
  },
  "geofessor-vegard-lofnes.png": {
    contentType: "image/png",
    label: "Diplom for Vegard Lofnes",
  },
  "geofessor-sverre-skilbreid.png": {
    contentType: "image/png",
    label: "Diplom for Sverre Skilbreid",
  },
} as const;

export type GeoversitetetAssetName = keyof typeof geoversitetetAssets;

export function canViewGeoversitetet(playerId: string | null | undefined) {
  return isThirdCollegeMember(playerId);
}

export function isGeoversitetetAssetName(value: string): value is GeoversitetetAssetName {
  return value in geoversitetetAssets;
}

export function getGeoversitetetAsset(value: string) {
  return isGeoversitetetAssetName(value) ? geoversitetetAssets[value] : null;
}

export function geoversitetetAssetUrl(asset: string) {
  const assetName = asset.replace(/^assets\//, "");
  return `/geoversitetet/aktiva/${assetName}`;
}
