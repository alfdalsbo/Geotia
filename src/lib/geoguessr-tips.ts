import rawTipsBank from "../../content/geoguessr-tips/tips.json";

import {
  tipCategoryLabels,
  tipCategoryOrder,
  type GeoGuessrTip,
  type TipCategory,
  type TipCategorySummary,
  type TipPlacement,
} from "@/lib/geoguessr-tip-types";

export type { GeoGuessrTip, TipCategory, TipPlacement };

type TipsBank = {
  tips: GeoGuessrTip[];
  sources: Array<{ id: string; title: string; url: string }>;
};

type BaseSelectContext = {
  seed?: string;
  count?: number;
};

export type TipSelectContext =
  | (BaseSelectContext & { placement: "dashboard" | "global-toast" | "archive" })
  | (BaseSelectContext & { placement: "slowgeo-open"; seed: string })
  | (BaseSelectContext & {
      placement: "slowgeo-reveal";
      seed: string;
      country?: string | null;
      continent?: string | null;
      tags?: string[];
    });

const tipsBank = rawTipsBank as TipsBank;

const defaultCounts: Record<TipPlacement, number> = {
  dashboard: 5,
  "global-toast": 12,
  "slowgeo-open": 3,
  "slowgeo-reveal": 4,
  archive: tipsBank.tips.length,
};

export function getGeoGuessrTips() {
  return tipsBank.tips;
}

export function getGeoGuessrTipSources() {
  return tipsBank.sources;
}

export function getGeoGuessrTipCategories(): TipCategorySummary[] {
  const counts = getGeoGuessrTips().reduce<Partial<Record<TipCategory, number>>>((acc, tip) => {
    acc[tip.category] = (acc[tip.category] ?? 0) + 1;
    return acc;
  }, {});

  return tipCategoryOrder
    .filter((category) => counts[category])
    .map((category) => ({
      id: category,
      label: tipCategoryLabels[category],
      count: counts[category] ?? 0,
    }));
}

export function getGeoGuessrTipDaySeed(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function selectGeoGuessrTips(context: TipSelectContext): GeoGuessrTip[] {
  const count = Math.max(0, Math.floor(context.count ?? defaultCounts[context.placement]));
  if (count === 0) return [];

  const seed = `${context.placement}:${context.seed ?? getGeoGuessrTipDaySeed()}`;

  if (context.placement === "slowgeo-open") {
    return takeSeeded(generalTips(), count, seed);
  }

  if (context.placement === "slowgeo-reveal") {
    const ranked = rankRevealTips(context);
    return takeWithFallback(ranked, generalTips(), count, seed);
  }

  if (context.placement === "dashboard") {
    const learningTips = getGeoGuessrTips().filter((tip) => tip.category !== "coverage");
    return takeSeeded(learningTips, count, seed);
  }

  if (context.placement === "global-toast") {
    const toastTips = getGeoGuessrTips().filter((tip) => tip.difficulty !== "advanced" || tip.confidence !== "low");
    return takeSeeded(toastTips, count, seed);
  }

  return takeSeeded(getGeoGuessrTips(), count, seed);
}

function generalTips() {
  return getGeoGuessrTips().filter((tip) => tip.countries.length === 0);
}

function rankRevealTips(context: Extract<TipSelectContext, { placement: "slowgeo-reveal" }>) {
  const country = normalizeToken(context.country ?? "");
  const continent = normalizeToken(context.continent ?? "");
  const tags = new Set((context.tags ?? []).map(normalizeToken).filter(Boolean));
  const seed = `${context.placement}:${context.seed}`;

  return getGeoGuessrTips()
    .map((tip) => {
      const score = revealScore(tip, country, continent, tags);
      return { tip, score, order: seededOrder(`${seed}:${tip.id}`) };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((entry) => entry.tip);
}

function revealScore(tip: GeoGuessrTip, country: string, continent: string, tags: Set<string>) {
  let score = 0;
  const tipCountries = tip.countries.map(normalizeToken);
  const tipRegions = tip.regions.map(normalizeToken);
  const tipTags = tip.tags.map(normalizeToken);

  if (country && tipCountries.includes(country)) score += 70;
  if (continent && tipRegions.includes(continent)) score += 28;

  for (const tag of tags) {
    if (tipTags.includes(tag)) score += 18;
    if (tipRegions.includes(tag)) score += 14;
    if (tipCountries.includes(tag)) score += 12;
  }

  return score;
}

function takeWithFallback(primary: GeoGuessrTip[], fallback: GeoGuessrTip[], count: number, seed: string) {
  const picked = uniqueTips(primary).slice(0, count);
  if (picked.length >= count) return picked;

  const used = new Set(picked.map((tip) => tip.id));
  return [
    ...picked,
    ...takeSeeded(
      fallback.filter((tip) => !used.has(tip.id)),
      count - picked.length,
      `${seed}:fallback`,
    ),
  ];
}

function takeSeeded(tips: GeoGuessrTip[], count: number, seed: string) {
  return uniqueTips(tips)
    .sort((a, b) => seededOrder(`${seed}:${a.id}`) - seededOrder(`${seed}:${b.id}`))
    .slice(0, count);
}

function uniqueTips(tips: GeoGuessrTip[]) {
  const seen = new Set<string>();
  return tips.filter((tip) => {
    if (seen.has(tip.id)) return false;
    seen.add(tip.id);
    return true;
  });
}

function seededOrder(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeToken(value: string) {
  return value
    .toLowerCase()
    .replaceAll("æ", "ae")
    .replaceAll("ø", "o")
    .replaceAll("å", "a")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
