import type {
  GameSession,
  GeoterIndexAdjustment,
  GeoticOrderAssessment,
  GeoticOrderPromotionCase,
  GeotingProposal,
  GeoLocation,
  PlayerProfile,
  Round,
  RoundMapSnapshot,
  SlowGeoChallenge,
  SlowGeoMode,
  SlowGeoVariant,
  SlowGeoUsedChallenge,
} from "@/lib/types";

export type GeocodeCacheEntry = {
  queryKey: string;
  location: GeoLocation | null;
  updatedAt: string;
};

export type RoundLocationData = {
  answerLocation: GeoLocation | null;
  mapSnapshot: RoundMapSnapshot | null;
  challenge?: SlowGeoChallenge | null;
  slowGeoMode?: SlowGeoMode;
  slowGeoVariant?: SlowGeoVariant | null;
  slowGeoEraId?: string | null;
  slowGeoStartedBy?: string | null;
  slowGeoStartedAt?: string | null;
  deadlineAt?: string | null;
  revealedAt?: string | null;
};

export type FileState = {
  meta?: Record<string, string>;
  rounds: Round[];
  gameSessions: GameSession[];
  geotingProposals: GeotingProposal[];
  geoterIndexAdjustments: GeoterIndexAdjustment[];
  geoticOrderAssessments: GeoticOrderAssessment[];
  geoticOrderPromotionCases: GeoticOrderPromotionCase[];
  playerProfiles: PlayerProfile[];
  geocodeCache: GeocodeCacheEntry[];
  slowGeoUsedChallenges: SlowGeoUsedChallenge[];
};
