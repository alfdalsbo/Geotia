export const tipCategoryLabels = {
  workflow: "Metode",
  "driving-side": "Kjøreside",
  "road-markings": "Veilinjer",
  "license-plates": "Bilskilt",
  "google-car": "Google-bil",
  bollards: "Bollarder",
  poles: "Strømstolper",
  signposts: "Skiltstolper",
  domains: "Domener",
  "road-signs": "Veiskilt",
  "natural-clues": "Naturspor",
  coverage: "Dekning",
  language: "Språk",
  chevrons: "Svingpiler",
} as const;

export const tipCategoryOrder = Object.keys(tipCategoryLabels) as TipCategory[];

export const tipDifficultyLabels = {
  basic: "Grunnspor",
  intermediate: "Viderekommen",
  advanced: "Avansert",
} as const;

export const tipConfidenceLabels = {
  low: "Lav sikkerhet",
  medium: "Middels sikkerhet",
  high: "Høy sikkerhet",
  "very-high": "Svært høy sikkerhet",
} as const;

export type TipCategory = keyof typeof tipCategoryLabels;
export type TipDifficulty = keyof typeof tipDifficultyLabels;
export type TipConfidence = keyof typeof tipConfidenceLabels;

export type GeoGuessrTip = {
  id: string;
  title: string;
  body: string;
  category: TipCategory;
  countries: string[];
  regions: string[];
  difficulty: TipDifficulty;
  confidence: TipConfidence;
  tags: string[];
  sourceRefs: string[];
};

export type TipCategorySummary = {
  id: TipCategory;
  label: string;
  count: number;
};

export type TipPlacement =
  | "dashboard"
  | "global-toast"
  | "slowgeo-open"
  | "slowgeo-reveal"
  | "archive";
