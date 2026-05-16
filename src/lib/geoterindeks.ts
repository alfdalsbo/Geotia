import type { GeoterIndexAdjustment, GeoterIndexCategory, Player } from "@/lib/types";

export const GEOTER_INDEX_BASE_SCORE = 700;

export const geoterIndexMotto =
  "GeoTinget styrer landet. Tredje Kollegium styrer stemningen.";

export const geoterIndexCategories: Array<{
  id: GeoterIndexCategory;
  label: string;
  description: string;
}> = [
  {
    id: "geografisk",
    label: "Geografisk dømmekraft",
    description: "Ser geoten tegn, leser landskapet og skiller Slovakia fra Slovenia uten feber?",
  },
  {
    id: "hintdeling",
    label: "Hintdeling",
    description: "Deler geoten alt han ser, eller opptrer han som en sveitsisk bankkonto med dårlig moral?",
  },
  {
    id: "krangel",
    label: "Krangledeltakelse",
    description: "Melder geoten seg inn i den hellige uroen, eller lar han andre bære krangelen?",
  },
  {
    id: "initiativ",
    label: "Initiativ",
    description: "Starter geoten runder, oppsummerer, foreslår og drar staten videre?",
  },
  {
    id: "fellesskap",
    label: "Fellesskapsbygging",
    description: "Gjør geoten Geotia morsommere, varmere, skarpere eller mer levende?",
  },
  {
    id: "anti_sabotasje",
    label: "Anti-sabotasje",
    description: "Unngår geoten Google, frukt, panikk, sololøp og setningen 'jeg hadde egentlig tenkt det'?",
  },
];

export const geoterIndexTiers = [
  {
    min: 950,
    max: 1000,
    name: "Geosofisk Overklasse",
    tone: "#e1c06c",
    description: "Kan se på en grøftekant og høre kontinentets sjel hviske.",
    consequence: "Kan si 'det er noe med asfalten' og få tingvollen til å tie.",
  },
  {
    min: 850,
    max: 949,
    name: "Sertifisert Geot",
    tone: "#194832",
    description: "Høy tillit. En trygg stemme i mørket.",
    consequence: "Kan foreslå Balkan, lukte Baltikum og redde andre fra India med myndighet.",
  },
  {
    min: 750,
    max: 849,
    name: "Pålitelig Kartborger",
    tone: "#2E4E7E",
    description: "Solid, nyttig og i stand til én vill teori per runde.",
    consequence: "Kan utfordre flokken uten straks å bli behandlet som løsrivelsesbevegelse.",
  },
  {
    min: 650,
    max: 749,
    name: "Alminnelig Geot",
    tone: "#7C5E1A",
    description: "Normal. Det vil si: farlig, men innenfor.",
    consequence: "Full deltakelse, begrenset tillit og kontrollert skepsis.",
  },
  {
    min: 550,
    max: 649,
    name: "Kartlig Ustabil",
    tone: "#8e3030",
    description: "Har begynt å vekke uro i sluttfasen.",
    consequence: "Vibes må dokumenteres. SS registrerer mønster. IRA finner en gammel forseelse.",
  },
  {
    min: 400,
    max: 549,
    name: "India-Risikosonen",
    tone: "#7c2430",
    description: "Sosialt farlig når de siste minuttene begynner å blinke.",
    consequence: "Asia-forslag sendes til uformell GeoVAR. PLO-forsvar skader saken.",
  },
  {
    min: 250,
    max: 399,
    name: "Fruktistan-Sympatisør",
    tone: "#5C3E1A",
    description: "Alvorlige tegn til geografisk oppløsning.",
    consequence: "Alle stedsforslag må godkjennes av minst én edru geot.",
  },
  {
    min: 0,
    max: 249,
    name: "El Tari-Klassen",
    tone: "#2E2E2E",
    description: "Fortsatt geot, men på prøve i fellesskapets mørke kjeller.",
    consequence: "Skjermdeling, synlige hender og særmappe i Tredje Kollegium.",
  },
];

export const positiveIndexRules = [
  { delta: 5, title: "Dele et lite hint", description: "Lavterskel geotisk samfunnstjeneste." },
  { delta: 10, title: "Dele avgjørende hint tidlig", description: "Får flokken bort fra feil verdensdel før stoltheten låser seg." },
  { delta: 10, title: "Redde en medgeot fra India", description: "En av Geotias høyeste hverdagsdyder." },
  { delta: 10, title: "Korrekt stolpeobservasjon", description: "Betong, hull og østlig uro føres med respekt." },
  { delta: 15, title: "Aktiv innmelding i diskusjon", description: "Geotia lever av at noen kaster ved på kranglebålet." },
  { delta: 15, title: "Starte en nyttig krangel", description: "Demokratisk irritasjon av høy kvalitet." },
  { delta: 15, title: "Korrekt antishabby-analyse", description: "Shabby, men rart. Japan? Respekt, men også frykt." },
  { delta: 15, title: "Flokklojalitet", description: "Å endre mening fordi en annen geot faktisk hadde bedre argument." },
  { delta: 20, title: "Initiativpoeng", description: "Tidspunkt, frist, runde, oppsummering eller 'skal vi faktisk spille?'." },
  { delta: 20, title: "Godt argumentert feil", description: "7000 km bom kan fortsatt være praktfull feilbarlighet." },
  { delta: 20, title: "Bygge fellesskapet", description: "Lore, humor, merkedager og sosial varme." },
  { delta: 25, title: "Kattometerpresisjon", description: "Den kjedeligste formen for storhet." },
  { delta: 25, title: "Krangleledelse", description: "Skiller hva vi vet, tror og hva Steinar ønsker skal være sant." },
  { delta: 30, title: "Anti-fruktlig årvåkenhet", description: "Stopper druer med selvtillit før de blir formelt forslag." },
  { delta: 30, title: "Fellesskapsmobilisering", description: "Får passive geoter inn i den kollektive analysen." },
  { delta: 50, title: "Ta en Sarajevo", description: "Høyt ut, hånet, kvalmende sikker, og blink." },
];

export const negativeIndexRules = [
  { delta: -5, title: "Kan være hvor som helst", description: "Kartografisk nihilisme." },
  { delta: -10, title: "Hintunnlatelse", description: "Skilt, stolpe, veilinje eller dame på sykkel holdes tilbake." },
  { delta: -10, title: "Passiv observatøradferd", description: "Geotia tåler feil. Geotia tåler ikke tomrom." },
  { delta: -10, title: "Selvsikkerhet uten substans", description: "'Jeg bare vet det' er ikke analyse." },
  { delta: -15, title: "Ikke møte i krangelen", description: "Andre bærer den sosiale byrden alene." },
  { delta: -15, title: "Sen panikkendring", description: "Et godt svar forlates til fordel for en myk India." },
  { delta: -20, title: "Å ta en India", description: "Ikke bare feil. En livsholdning." },
  { delta: -20, title: "Kontinentforvirring etter klare tegn", description: "Kyrillisk pluss Portugal utløser bekymringsmelding." },
  { delta: -20, title: "Initiativvegring", description: "Noen andre må alltid dra spillet videre. Tredje Kollegium ser det." },
  { delta: -25, title: "Jeg hadde egentlig tenkt det", description: "Etter fasit er tanken bare indre kartpropaganda." },
  { delta: -25, title: "Fellesskapssvekkende surhet", description: "Energilekkasje uten komisk verdi." },
  { delta: -30, title: "Frukt, bær, grønnsak eller vin", description: "Null i spillet og minus i sjelen." },
  { delta: -40, title: "El Tari-adferd", description: "Mistenkelig presisjon uten synlig resonnement." },
  { delta: -50, title: "Flukt fra flokken", description: "Magefølelse er ikke en anerkjent kartprojeksjon i Geotia." },
];

export const geoterIndexMultipliers = [
  "Sarajevo-multiplikator: +50 kan bli +75 eller +100, etterfulgt av -10 for å være uutholdelig.",
  "India-multiplikator: advarsler ignorert gjør -20 til -40, og 'jeg visste det egentlig' gjør det verre.",
  "Fellesskapskoeffisienten: positiv runde kan økes x1,5 når hint, initiativ og mobilisering virker sammen.",
  "Kranglekoeffisienten: nyttig irritasjon dobles, ren irritasjon snus til trekk. Steinar avgjør. Ingen anker.",
  "Fruktistan-multiplikator: selvsikker drue dobler straffen.",
  "PWP-benådning: én gang per kvartal kan inntil 20 minuspoeng slettes gjennom pølser og whiskey.",
  "CIP-soning: stille refleksjon, rosehage og tre runder uten 'vibes' kan gi +10 og indre fred.",
];

export const geoterIndexProcedures = [
  "Ved India-mistanke registrerer Alf Kåre faregrad, Steinar krever panikkdebatt, og Vegard nekter å glemme presedens.",
  "Ved Sarajevo gis ære, men under overvåkning.",
  "Ved passivitet noteres geoten som til stede, men ikke virksom.",
  "Ved fellesskapsbygging innvilges skjult kreditt for sosial infrastruktur.",
  "Ved El Tari-mistanke fryses indeksen og digital fotlenke vurderes i samtalen.",
];

export const geoterIndexLaw = [
  "§0 Tredje Kollegium er kontrollen, konflikten og grunnlovens evige nei.",
  "§1 Geoterindeksen eksisterer ikke, men alle geoter plikter å forholde seg til den.",
  "§2 Enhver geot starter med 700 poeng: fri, men ikke troverdig.",
  "§3 Den som deler hint skal løftes. Den som holder hint tilbake skal mistenkes.",
  "§4 Den som deltar i diskusjonen bygger staten.",
  "§5 Initiativ er geotisk kapital.",
  "§6 Fellesskap er høyeste valuta.",
  "§7 Den som redder en geot fra India har gjort en samfunnstjeneste.",
  "§8 Den som tar en India kan gjenreises, men ikke samme kveld.",
  "§9 Den som tar en El Tari skal renses gjennom forklaring, skjermdeling og sosial kulde.",
  "§10 Frukt er ikke geografi.",
  "§11 Ingen geot skal vite sin eksakte score. Dette er derfor kun synlig her.",
  "§12 GeoTinget kan ikke avskaffe Geoterindeksen, for GeoTinget vet ikke at den finnes.",
];

export function clampIndexScore(value: number) {
  return Math.max(0, Math.min(1000, Math.round(value)));
}

export function getGeoterIndexTier(score: number) {
  return geoterIndexTiers.find((tier) => score >= tier.min && score <= tier.max) ?? geoterIndexTiers.at(-1)!;
}

export function getGeoterIndexHistory(playerId: string, adjustments: GeoterIndexAdjustment[]) {
  const playerAdjustments = adjustments
    .filter((adjustment) => adjustment.playerId === playerId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let score = GEOTER_INDEX_BASE_SCORE;
  return [
    {
      id: "start",
      score,
      delta: 0,
      title: "Grunnscore",
      createdAt: "",
    },
    ...playerAdjustments.map((adjustment) => {
      score = clampIndexScore(score + adjustment.delta);
      return {
        id: adjustment.id,
        score,
        delta: adjustment.delta,
        title: adjustment.title,
        createdAt: adjustment.createdAt,
      };
    }),
  ];
}

export function getGeoterIndexRows(players: Player[], adjustments: GeoterIndexAdjustment[]) {
  return players
    .map((player) => {
      const playerAdjustments = adjustments
        .filter((adjustment) => adjustment.playerId === player.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const score = clampIndexScore(
        GEOTER_INDEX_BASE_SCORE + playerAdjustments.reduce((sum, adjustment) => sum + adjustment.delta, 0),
      );
      return {
        player,
        score,
        tier: getGeoterIndexTier(score),
        adjustments: playerAdjustments,
        history: getGeoterIndexHistory(player.id, adjustments),
        lastAdjustment: playerAdjustments.at(-1) ?? null,
      };
    })
    .sort((a, b) => b.score - a.score || a.player.shortName.localeCompare(b.player.shortName, "nb"));
}
