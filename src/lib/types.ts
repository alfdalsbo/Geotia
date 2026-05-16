export type ResultStatus = "deltatt" | "ikke_deltatt" | "ugyldig";

export type RoundStatus = "draft" | "open" | "revealed" | "locked";

export type GameId = "slowgeo" | "geo" | "maptap" | "satle" | "globle";

export type ScoreDirection = "higher" | "lower";

export type DistanceSource = "auto" | "manual";

export type GeoLocation = {
  lat: number;
  lon: number;
  label: string;
  query: string;
  country?: string;
  source: "nominatim" | "manual" | "google_street_view";
};

export type SlowGeoChallenge = {
  id: string;
  candidateId: string;
  source: "google_street_view";
  lat: number;
  lon: number;
  label: string;
  country: string;
  continent: string;
  heading: number;
  pitch: number;
  fov: number;
  panoId?: string;
  imageDate?: string;
  copyright?: string;
  createdAt: string;
};

export type GameDefinition = {
  id: GameId;
  name: string;
  shortName: string;
  description: string;
  scoreLabel: string;
  scoreHelp: string;
  scoreDirection: ScoreDirection;
  ritual: string;
  color: string;
};

export type Player = {
  id: string;
  name: string;
  shortName: string;
  partyId: string;
  username?: string;
  role?: "geot" | "tingvitne";
  canCompete?: boolean;
  canVote?: boolean;
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
  guessText?: string;
  guessLocation?: GeoLocation | null;
  guessUpdatedAt?: string | null;
  distanceSource?: DistanceSource | null;
  note?: string;
};

export type RoundMapMarker = {
  id: string;
  type: "answer" | "guess";
  playerId?: string;
  label: string;
  lat: number;
  lon: number;
  color: string;
  distanceKm?: number | null;
};

export type RoundMapSnapshot = {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  markers: RoundMapMarker[];
};

export type GameResult = {
  playerId: string;
  status: ResultStatus;
  score: number | null;
  note?: string;
};

export type Round = {
  id: string;
  number: number;
  date: string;
  name: string;
  answer: string;
  answerLocation?: GeoLocation | null;
  mapSnapshot?: RoundMapSnapshot | null;
  challenge?: SlowGeoChallenge | null;
  deadlineAt?: string | null;
  revealedAt?: string | null;
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

export type GameSession = {
  id: string;
  gameId: GameId;
  number: number;
  date: string;
  title: string;
  context: string;
  status: RoundStatus;
  createdAt: string;
  updatedAt: string;
  results: GameResult[];
};

export type ComputedGameResult = GameResult & {
  player: Player;
  rank: number | null;
  points: number;
};

export type ComputedGameSession = Omit<GameSession, "results"> & {
  game: GameDefinition;
  participantCount: number;
  maxPoints: number;
  winnerNames: string[];
  results: ComputedGameResult[];
};

export type ComputedRound = Omit<Round, "results"> & {
  participantCount: number;
  maxPoints: number;
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

export type GameStanding = {
  rank: number;
  player: Player;
  game: GameDefinition;
  totalPoints: number;
  totalScore: number;
  sessionsPlayed: number;
  wins: number;
  absences: number;
  invalids: number;
  averageScore: number;
  bestScore: number | null;
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

export type ProposalRuleType = "grunnlov" | "mindre" | "annet";

export type VoteValue = "for" | "mot" | "blankt" | "avhold";

export type GeotingProposalStatus = "open" | "voting" | "passed" | "rejected" | "archived";

export type GeotingVote = {
  playerId: string;
  vote: VoteValue;
  comment: string;
  createdAt: string;
  automatic?: boolean;
};

export type GeotingProposal = {
  id: string;
  title: string;
  body: string;
  ruleType: ProposalRuleType;
  proposedBy: string;
  status: GeotingProposalStatus;
  createdAt: string;
  updatedAt: string;
  voteStartedAt?: string | null;
  voteEndsAt?: string | null;
  voteStartedBy?: string | null;
  oathText?: string;
  resolvedAt?: string | null;
  votes: GeotingVote[];
};

export type GeoterIndexCategory =
  | "geografisk"
  | "hintdeling"
  | "krangel"
  | "initiativ"
  | "fellesskap"
  | "anti_sabotasje";

export type GeoterIndexAdjustment = {
  id: string;
  playerId: string;
  delta: number;
  category: GeoterIndexCategory;
  title: string;
  reason: string;
  createdAt: string;
  createdBy: string;
};

export type GeoticOrderRankId =
  | "borger"
  | "anerkjent_borger"
  | "partiaspirant"
  | "partimedlem"
  | "geomentariker"
  | "partileder"
  | "partigrunder";

export type GeoticOrderHiddenCategory = "baerer" | "krutt" | "stolpe" | "risiko" | "turist";

export type GeoticOrderStatus = "normal" | "provetid" | "frosset" | "degradert";

export type GeoticOrderAssessment = {
  playerId: string;
  rankId: GeoticOrderRankId;
  serviceWeeks: number;
  hiddenCategory: GeoticOrderHiddenCategory;
  status: GeoticOrderStatus;
  sponsor: string;
  trial: string;
  publicNote: string;
  internalNote: string;
  updatedAt: string;
  updatedBy: string;
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
};

export type AppState = {
  players: Player[];
  parties: Party[];
  games: GameDefinition[];
  archive: ArchiveData;
  rounds: Round[];
  gameSessions: GameSession[];
  geotingProposals: GeotingProposal[];
  geoterIndexAdjustments: GeoterIndexAdjustment[];
  geoticOrderAssessments: GeoticOrderAssessment[];
};
