export type ResultStatus = "deltatt" | "ikke_deltatt" | "ugyldig";

export type RoundStatus = "draft" | "locked";

export type Player = {
  id: string;
  name: string;
  shortName: string;
  partyId: string;
  color: string;
  title: string;
  specialty: string;
  strengths: string;
  weaknesses: string;
  moment: string;
  mark: string;
};

export type Party = {
  id: string;
  name: string;
  leader: string;
  motto: string;
  ideology: string;
  agenda: string;
  allies: string;
  rivals: string;
  comment: string;
  color: string;
  asset?: string;
  manifesto?: string[];
  doctrine?: string[];
};

export type PlayerResult = {
  playerId: string;
  status: ResultStatus;
  actualKm: number | null;
  note?: string;
};

export type Round = {
  id: string;
  number: number;
  date: string;
  name: string;
  answer: string;
  country: string;
  continent: string;
  comment: string;
  status: RoundStatus;
  createdAt: string;
  updatedAt: string;
  results: PlayerResult[];
};

export type ComputedPlayerResult = PlayerResult & {
  player: Player;
  rank: number | null;
  points: number;
  chargedKm: number | null;
  chargedReason: "actual" | "kattometerstraff" | "pending";
};

export type ComputedRound = Omit<Round, "results"> & {
  participantCount: number;
  worstThreeAverage: number | null;
  results: ComputedPlayerResult[];
  winnerNames: string[];
};

export type Standing = {
  rank: number;
  player: Player;
  totalPoints: number;
  totalKattometer: number;
  lockedRounds: number;
  roundsPlayed: number;
  wins: number;
  top3: number;
  lastPlaces: number;
  absences: number;
  invalids: number;
  averagePoints: number;
  averageKattometer: number;
  bestKm: number | null;
  worstKm: number | null;
  bestSinglePoints: number;
};

export type LexiconEntry = {
  term: string;
  definition: string;
  origin: string;
  example: string;
  comment: string;
  category: string;
};

export type CalendarEvent = {
  date: string;
  name: string;
  category: string;
  description: string;
  significance: string;
};

export type ConstitutionSection = {
  paragraph: string;
  title: string;
  body: string[];
};

export type GeotingCase = {
  date: string;
  caseNumber?: string;
  caseName: string;
  proposal: string;
  proposedBy: string;
  decision: string;
  votes: string;
  status: string;
  comment: string;
};

export type OldSlowGeoRecord = {
  player: string;
  points: number;
  pointRounds: number;
  kattometer: number;
  kattometerRounds: number;
};

export type CanonSection = {
  title: string;
  eyebrow: string;
  body: string[];
};

export type KnowledgeGroup = {
  title: string;
  description: string;
  items: string[];
};

export type KonespillRule = {
  points: number;
  reaction: string;
};

export type ArchiveData = {
  constitution: ConstitutionSection[];
  code: string[];
  lexicon: LexiconEntry[];
  calendar: CalendarEvent[];
  geotingCases: GeotingCase[];
  oldSlowGeo: OldSlowGeoRecord[];
  geosophy: string[];
  canon: CanonSection[];
  knowledgeGroups: KnowledgeGroup[];
  konespillet: KonespillRule[];
  excelNotes: CanonSection[];
};

export type AppState = {
  players: Player[];
  parties: Party[];
  archive: ArchiveData;
  rounds: Round[];
};
