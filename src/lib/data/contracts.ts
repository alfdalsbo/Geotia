import type {
  GameSession,
  GeoterIndexAdjustment,
  GeoticOrderAssessment,
  GeoticOrderPromotionCase,
  GeotingProposal,
  GeoLocation,
  PlayerProfile,
  Round,
  SlowGeoUsedChallenge,
} from "@/lib/types";

export type StorageBackend = "file" | "postgres";

export type GeocodeCacheEntry = {
  queryKey: string;
  location: GeoLocation | null;
  updatedAt: string;
};

export type PersistentState = {
  rounds: Round[];
  gameSessions: GameSession[];
  geotingProposals: GeotingProposal[];
  geoterIndexAdjustments: GeoterIndexAdjustment[];
  geoticOrderAssessments: GeoticOrderAssessment[];
  geoticOrderPromotionCases: GeoticOrderPromotionCase[];
  playerProfiles: PlayerProfile[];
};

export type RuntimeState = PersistentState & {
  geocodeCache: GeocodeCacheEntry[];
  slowGeoUsedChallenges: SlowGeoUsedChallenge[];
};

export type RepositoryWriteOptions = {
  expectedVersion?: string | null;
};

export type GeotiaRepository = {
  backend: StorageBackend;
  readPersistentState(): Promise<PersistentState>;
  saveRound(round: Round, options?: RepositoryWriteOptions): Promise<void>;
  saveRounds(rounds: Round[], options?: RepositoryWriteOptions): Promise<void>;
  deleteRound(id: string): Promise<void>;
  saveGameSession(session: GameSession, options?: RepositoryWriteOptions): Promise<void>;
  saveGeotingProposal(proposal: GeotingProposal, options?: RepositoryWriteOptions): Promise<void>;
  saveGeoterIndexAdjustment(adjustment: GeoterIndexAdjustment, options?: RepositoryWriteOptions): Promise<void>;
  saveGeoticOrderAssessment(assessment: GeoticOrderAssessment, options?: RepositoryWriteOptions): Promise<void>;
  saveGeoticOrderPromotionCase(
    promotionCase: GeoticOrderPromotionCase,
    options?: RepositoryWriteOptions,
  ): Promise<void>;
  savePlayerProfile(profile: PlayerProfile, options?: RepositoryWriteOptions): Promise<void>;
  getCachedGeocodeLocation(queryKey: string): Promise<GeoLocation | null | undefined>;
  setCachedGeocodeLocation(queryKey: string, location: GeoLocation | null): Promise<GeocodeCacheEntry>;
  readSlowGeoUsedChallenges(): Promise<SlowGeoUsedChallenge[]>;
  saveSlowGeoUsedChallenge(entry: Partial<SlowGeoUsedChallenge>): Promise<void>;
};
