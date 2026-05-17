import type {
  GeoterIndexAdjustment,
  GeoticOrderAssessment,
  GeoticOrderHiddenCategory,
  GeoticOrderRankId,
  GeoticOrderStatus,
  Player,
  Standing,
} from "@/lib/types";
import { GEOTER_INDEX_BASE_SCORE, clampIndexScore } from "@/lib/geoterindeks";

export type GeoticOrderRank = {
  id: GeoticOrderRankId;
  number: number;
  name: string;
  motto: string;
  description: string;
  weeks: number;
  rounds: number;
  points: number;
  trust: number;
  publicRequirements: string[];
  rights: string[];
  duties: string[];
  ritual: string;
};

export const geoticOrderMotto =
  "Du får være med som Borger. Du blir geot gjennom innsats. Du får makt gjennom tillit.";

export const geoticOrderRanks: GeoticOrderRank[] = [
  {
    id: "borger",
    number: 1,
    name: "Borger av Geotia",
    motto: "Du er inne. Men du er ikke hjemme ennå.",
    description:
      "Startnivået for nye personer som har fått slippe inn på tingvollen, men ennå må lære hvordan man bommer med verdighet.",
    weeks: 0,
    rounds: 3,
    points: 0,
    trust: 0,
    publicRequirements: [
      "Invitasjon fra minst én etablert geot",
      "Tre prøverunder og grunnleggende møte med GeoKodeksen",
      "Ingen El Tari-adferd og evne til å tåle kjærlig hån",
    ],
    rights: [
      "Kan delta i spill og foreslå svar",
      "Kan diskutere, korrigeres offentlig og få kallenavn mot sin vilje",
      "Kan begynne å lære forskjellen på magefølelse og kartforståelse",
    ],
    duties: ["Dele hint", "Tåle ydmykelse", "Ikke bruke 'vi i Geotia' for selvsikkert"],
    ritual:
      "Jeg lover å dele mine hint, tåle min ydmykelse, unngå frukt som geografi, og aldri dra til India uten at flokken har fått rope først.",
  },
  {
    id: "anerkjent_borger",
    number: 2,
    name: "Anerkjent Borger",
    motto: "Du har sluttet å være gjest og begynt å bli problem.",
    description:
      "Borgeren har begynt å vise mønster. Han møter opp, bommer nyttig og gir gruppa materiale.",
    weeks: 4,
    rounds: 10,
    points: 25,
    trust: 690,
    publicRequirements: [
      "Minst fire uker som Borger",
      "Minst ti tellende runder og 25 livstidspoeng",
      "Tre faktiske hint og én krangel uten å ødelegge stemningen",
    ],
    rights: [
      "Kan nomineres til partimedlemskap",
      "Kan fremme enkle forslag",
      "Kan si 'dette føles som Balkan' én gang per måned",
    ],
    duties: ["Vise initiativ", "Bidra med analyse, humor, organisering eller ydmykende feil"],
    ritual:
      "Borgeren viser gryende geotisk substans, men har fortsatt ustabil kontinentforståelse.",
  },
  {
    id: "partiaspirant",
    number: 3,
    name: "Partiaspirant",
    motto: "Du banker på døren til makten. Makten later som den ikke hører.",
    description:
      "Prøvetiden før partimedlemskap. Aspiranten må finne ideologisk hjem og tåle at partiet ser skeptisk på ham.",
    weeks: 6,
    rounds: 15,
    points: 45,
    trust: 715,
    publicRequirements: [
      "Minst seks uker, femten runder og 45 livstidspoeng",
      "Sponsor fra eksisterende parti",
      "Én partiprøve: SS, PKK, PLO, IRA, MOSSAD, CIP eller PWP",
    ],
    rights: [
      "Kan delta i interne partisamtaler",
      "Kan være med å skrive forslag",
      "Kan observere GeoTinget med mistenkelig iver",
    ],
    duties: ["Utvikle egen ideologi", "Ikke starte fraksjon, bare bli mistenkt for det"],
    ritual:
      "Aspiranten må prøves i partiets særlige svakhet og komme ut med nok verdighet til å fortsette.",
  },
  {
    id: "partimedlem",
    number: 4,
    name: "Partimedlem",
    motto: "Du har fått farger, fiender og ansvar.",
    description:
      "Første fullverdige politiske nivå. Nå bærer geoten ikke bare seg selv, men en farge, en konflikt og en liten del av staten.",
    weeks: 8,
    rounds: 25,
    points: 75,
    trust: 735,
    publicRequirements: [
      "Minst åtte uker, 25 runder og 75 livstidspoeng",
      "Godkjent av partiet han søker opptak i",
      "Synlig fellesskapsbygging: lore, runder, initiativ eller språk som fester seg",
    ],
    rights: [
      "Fullt partimedlemskap og intern stemmerett",
      "Kan fremme saker via partiet",
      "Kan drive ideologisk rekruttering og offentlig kritikk",
    ],
    duties: ["Spille jevnlig", "Dele hint", "Støtte nye borgere", "Tåle gamle feil brukt med kjærlighet"],
    ritual:
      "Du er herved tatt opp i partiet. Måtte dine feil være offentlige og dine hint komme tidlig.",
  },
  {
    id: "geomentariker",
    number: 5,
    name: "Geomentariker",
    motto: "Du er ikke bare med i partiet. Du kan nå skade staten formelt.",
    description:
      "Tillitsnivået for dem som kan representere partiet i GeoTinget og gjøre egne preferanser til prinsipiell politikk.",
    weeks: 12,
    rounds: 40,
    points: 125,
    trust: 765,
    publicRequirements: [
      "Minst tolv uker, 40 runder og 125 livstidspoeng",
      "Minst ett seriøst useriøst forslag",
      "Evne til å skille god krangel, dårlig krangel og Steinar-krangel",
    ],
    rights: [
      "Kan representere parti i GeoTinget",
      "Kan fremme saker direkte",
      "Kan kreve GeoVAR, mistillit, omkamp eller pølsebasert løsning",
    ],
    duties: ["Holde GeoTinget levende", "Beskytte fellesskapet mot passivitet og overdreven seriøsitet"],
    ritual:
      "Jeg lover å tale lenge nok til å irritere, kort nok til å overleve, og alltid late som mine personlige preferanser er prinsipiell politikk.",
  },
  {
    id: "partileder",
    number: 6,
    name: "Partileder",
    motto: "Du har blitt så viktig at alle må få rive deg ned.",
    description:
      "Høyeste synlige lederrolle. En partileder bærer ikke bare et parti, men en konfliktlinje andre kan skyte på.",
    weeks: 16,
    rounds: 60,
    points: 200,
    trust: 800,
    publicRequirements: [
      "Minst seksten uker, 60 runder og 200 livstidspoeng",
      "Minst åtte uker som Partimedlem",
      "Intern tillit eller et kupp morsomt nok til å godtas",
    ],
    rights: [
      "Kan lede parti, forhandle koalisjoner og erklære ideologisk krig",
      "Kan oppta og ekskludere medlemmer med teatralsk begrunnelse",
      "Kan holde tale på merkedager",
    ],
    duties: ["Skape aktivitet", "Dyrke særpreg", "Være stor nok til å tåle latter"],
    ritual:
      "Jeg aksepterer byrden, tittelen og den kommende latterliggjøringen. Måtte mitt parti være sterkt, mine fiender svake og mine dårlige forslag tolkes i beste mening.",
  },
  {
    id: "partigrunder",
    number: 7,
    name: "Partigründer",
    motto: "Du har brutt ut av ordenen for å skape en ny orden som straks blir mistenkt.",
    description:
      "Den høyeste formen for geotisk selvhevdelse: å skape et nytt parti med navn, fiende, matprofil og akkurat passe irriterende særpreg.",
    weeks: 20,
    rounds: 75,
    points: 250,
    trust: 825,
    publicRequirements: [
      "Minst tjue uker, 75 runder og 250 livstidspoeng",
      "Tydelig ideologi, motto, hovedfiende og syn på India",
      "Støtte fra to geoter, eller én geot og et svært godt navn",
    ],
    rights: [
      "Kan søke opprettelse av nytt parti",
      "Kan utvide Geotias politiske landskap",
      "Kan bli umiddelbart mistenkt for å ligne et eksisterende parti",
    ],
    duties: ["Gi partiet sjel", "Gi det fiender", "Gi det signaturmat eller -drikke"],
    ritual:
      "Vi søker herved opprettelse av en ny orden i ordenen. Veien lyver aldri, men folket gjør.",
  },
];

export const geoticOrderHiddenCategories: Array<{
  id: GeoticOrderHiddenCategory;
  label: string;
  description: string;
}> = [
  { id: "baerer", label: "Bærer", description: "Bygger fellesskapet, starter spill, deler hint og får folk med." },
  { id: "krutt", label: "Krutt", description: "Skaper energi, konflikt og diskusjon uten å drepe rommet." },
  { id: "stolpe", label: "Stolpe", description: "Stabil, pålitelig og nødvendig. Geotias betong med hull." },
  { id: "risiko", label: "Risiko", description: "Tendenser til panikk, passivitet, sololøp eller geografisk delirium." },
  { id: "turist", label: "Turist", description: "Med, men ikke inne. Den farligste kategorien hvis den blir tallrik." },
];

export const geoticOrderStatuses: Array<{
  id: GeoticOrderStatus;
  label: string;
  publicLabel: string;
  description: string;
}> = [
  { id: "normal", label: "Normal drift", publicLabel: "Aktiv", description: "Geoten følger sin ordensvei uten særtiltak." },
  { id: "provetid", label: "Prøvetid", publicLabel: "På prøve", description: "Geoten er inne, men må vise mer geotisk substans." },
  { id: "frosset", label: "Midlertidig frys", publicLabel: "Frosset", description: "Opprykk stanser til spill, hint eller humør er rettet." },
  { id: "degradert", label: "Degradering", publicLabel: "Under gjenreisning", description: "Geoten må gjenreise rang gjennom handling." },
];

export const partyTrials = [
  "SS-prøven: bevare og fornye noe uten at noen helt forstår om det betyr ja eller nei.",
  "PKK-prøven: starte en krangel som varer minst 20 minutter og etterlater gruppa mer levende.",
  "PLO-prøven: forsvare et tvilsomt svar med intensjon, følelser og sosial rettferdighet.",
  "IRA-prøven: finne en gammel regel og bruke den til å stanse noe praktisk.",
  "MOSSAD-prøven: få gruppa til å slutte å diskutere og faktisk spille.",
  "CIP-prøven: foreslå en enkel, jordnær løsning og omtale den som en planting.",
  "PWP-prøven: avgjøre en sak raskt, udemokratisk og med overraskende bred støtte.",
];

const foundingPlayerIds = new Set(["alf", "vegard", "jorgen", "steinar", "sverre", "fredrik", "ruben"]);
const GEOTIA_SERVICE_START_DATE = "2020-04-01";
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function getGeoticOrderRank(rankId: GeoticOrderRankId) {
  return geoticOrderRanks.find((rank) => rank.id === rankId) ?? geoticOrderRanks[0];
}

export function getNextGeoticOrderRank(rankId: GeoticOrderRankId) {
  const index = geoticOrderRanks.findIndex((rank) => rank.id === rankId);
  return index >= 0 ? geoticOrderRanks[index + 1] ?? null : null;
}

export function getGeoticOrderStatus(status: GeoticOrderStatus) {
  return geoticOrderStatuses.find((candidate) => candidate.id === status) ?? geoticOrderStatuses[0];
}

export function getHiddenOrderCategory(category: GeoticOrderHiddenCategory) {
  return geoticOrderHiddenCategories.find((candidate) => candidate.id === category) ?? geoticOrderHiddenCategories[2];
}

function defaultRankId(player: Player): GeoticOrderRankId {
  if (player.role === "tingvitne" || player.canVote === false) return "borger";
  if (foundingPlayerIds.has(player.id)) return "partigrunder";
  if (player.partyId) return "partimedlem";
  return "borger";
}

function serviceStartDate(player: Player) {
  if (player.role === "tingvitne" || player.id === "danny") return null;
  return GEOTIA_SERVICE_START_DATE;
}

export function getServiceWeeksSince(startDate: string, now = new Date()) {
  const [year, month, day] = startDate.split("-").map(Number);
  if (!year || !month || !day) return 0;
  const startUtc = Date.UTC(year, month - 1, day);
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((nowUtc - startUtc) / MS_PER_WEEK));
}

export function formatServiceTime(weeks: number) {
  const safeWeeks = Math.max(0, Math.round(weeks));
  const years = Math.floor(safeWeeks / 52);
  const remainingWeeks = safeWeeks % 52;
  const weekLabel = safeWeeks === 1 ? "uke" : "uker";
  if (years === 0) return `${safeWeeks} ${weekLabel}`;
  const remainingLabel = remainingWeeks === 1 ? "uke" : "uker";
  return remainingWeeks > 0
    ? `${safeWeeks} uker · ${years} år og ${remainingWeeks} ${remainingLabel}`
    : `${safeWeeks} uker · ${years} år`;
}

function defaultServiceWeeks(player: Player) {
  const startDate = serviceStartDate(player);
  if (startDate) return getServiceWeeksSince(startDate);
  if (player.role === "tingvitne") return 1;
  return 0;
}

function defaultHiddenCategory(player: Player): GeoticOrderHiddenCategory {
  if (player.id === "steinar") return "krutt";
  if (player.id === "fredrik") return "stolpe";
  if (player.role === "tingvitne") return "turist";
  return "baerer";
}

export function getOrderIndexScore(playerId: string, adjustments: GeoterIndexAdjustment[]) {
  const delta = adjustments
    .filter((adjustment) => adjustment.playerId === playerId)
    .reduce((sum, adjustment) => sum + adjustment.delta, 0);
  return clampIndexScore(GEOTER_INDEX_BASE_SCORE + delta);
}

export function getEligibleOrderRank({
  lifetimePoints,
  roundsPlayed,
  serviceWeeks,
  trustScore,
}: {
  lifetimePoints: number;
  roundsPlayed: number;
  serviceWeeks: number;
  trustScore: number;
}) {
  return [...geoticOrderRanks]
    .reverse()
    .find((rank) => {
      return (
        serviceWeeks >= rank.weeks &&
        roundsPlayed >= rank.rounds &&
        lifetimePoints >= rank.points &&
        trustScore >= rank.trust
      );
    }) ?? geoticOrderRanks[0];
}

export function getOrderProgressToRank({
  lifetimePoints,
  roundsPlayed,
  serviceWeeks,
}: {
  lifetimePoints: number;
  roundsPlayed: number;
  serviceWeeks: number;
}, rank: GeoticOrderRank | null) {
  if (!rank) return 100;
  const ratios = [
    rank.weeks > 0 ? serviceWeeks / rank.weeks : 1,
    rank.rounds > 0 ? roundsPlayed / rank.rounds : 1,
    rank.points > 0 ? lifetimePoints / rank.points : 1,
  ].map((value) => Math.max(0, Math.min(1, value)));
  return Math.round((ratios.reduce((sum, value) => sum + value, 0) / ratios.length) * 100);
}

export function getGeoticOrderRows(
  players: Player[],
  standings: Standing[],
  adjustments: GeoterIndexAdjustment[],
  assessments: GeoticOrderAssessment[],
) {
  const standingByPlayerId = new Map(standings.map((standing) => [standing.player.id, standing]));
  const assessmentByPlayerId = new Map(assessments.map((assessment) => [assessment.playerId, assessment]));

  return players.map((player) => {
    const standing = standingByPlayerId.get(player.id);
    const assessment = assessmentByPlayerId.get(player.id) ?? null;
    const baselineServiceWeeks = defaultServiceWeeks(player);
    const serviceWeeks = serviceStartDate(player)
      ? Math.max(assessment?.serviceWeeks ?? 0, baselineServiceWeeks)
      : (assessment?.serviceWeeks ?? baselineServiceWeeks);
    const roundsPlayed = standing?.roundsPlayed ?? 0;
    const lifetimePoints = standing?.totalPoints ?? 0;
    const trustScore = getOrderIndexScore(player.id, adjustments);
    const eligibleRank = getEligibleOrderRank({ lifetimePoints, roundsPlayed, serviceWeeks, trustScore });
    const baselineRank = getGeoticOrderRank(defaultRankId(player));
    const rank = getGeoticOrderRank(
      assessment?.rankId ?? (eligibleRank.number > baselineRank.number ? eligibleRank.id : baselineRank.id),
    );
    const nextRank = getNextGeoticOrderRank(rank.id);

    return {
      player,
      standing,
      assessment,
      rank,
      nextRank,
      status: getGeoticOrderStatus(assessment?.status ?? "normal"),
      hiddenCategory: getHiddenOrderCategory(assessment?.hiddenCategory ?? defaultHiddenCategory(player)),
      serviceWeeks,
      serviceTimeLabel: formatServiceTime(serviceWeeks),
      serviceStartedAt: serviceStartDate(player),
      roundsPlayed,
      lifetimePoints,
      trustScore,
      eligibleRank,
      progressToNext: getOrderProgressToRank({ lifetimePoints, roundsPlayed, serviceWeeks }, nextRank),
      publicNote: assessment?.publicNote ?? "",
      sponsor: assessment?.sponsor ?? "",
      trial: assessment?.trial ?? "",
    };
  }).sort((a, b) => {
    return (
      b.rank.number - a.rank.number ||
      b.lifetimePoints - a.lifetimePoints ||
      a.player.shortName.localeCompare(b.player.shortName, "nb")
    );
  });
}
