"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, X } from "lucide-react";

import { GeoGuessrTipCard } from "@/components/geo-guessr-tip-card";
import type { GeoGuessrTip } from "@/lib/geoguessr-tips";

type TipToastState = {
  date: string;
  count: number;
  lastShownAt: number;
  seenIds: string[];
};

const defaultStorageKey = "geotia-geoguessr-tip-toast";

export function GeoGuessrTipToast({
  tips,
  delayMs = 35000,
  cooldownMs = 20 * 60 * 1000,
  maxPerDay = 3,
  storageKey = defaultStorageKey,
}: {
  tips: GeoGuessrTip[];
  delayMs?: number;
  cooldownMs?: number;
  maxPerDay?: number;
  storageKey?: string;
}) {
  const safeTips = useMemo(() => tips.filter(Boolean), [tips]);
  const [activeTip, setActiveTip] = useState<GeoGuessrTip | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (safeTips.length === 0) return;
    const timer = window.setTimeout(() => {
      const state = readToastState(storageKey);
      if (!canShowToast(state, maxPerDay, cooldownMs)) return;

      const tip = nextToastTip(safeTips, state);
      const nextState = recordToastShown(state, tip.id);
      writeToastState(storageKey, nextState);
      setActiveTip(tip);
      setVisible(true);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [cooldownMs, delayMs, maxPerDay, safeTips, storageKey]);

  if (!visible || !activeTip) return null;

  return (
    <aside
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded border border-[#c49a3c]/55 bg-[#fff7e6] p-3 shadow-[0_18px_50px_rgba(22,23,19,0.28)]"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          Tegnlære
        </p>
        <button
          type="button"
          aria-label="Lukk tips"
          onClick={() => setVisible(false)}
          className="flex h-8 w-8 items-center justify-center rounded border border-[#d8ded0] bg-white text-[#203c62]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <GeoGuessrTipCard tip={activeTip} compact />
      <Link
        href="/arkiv/kjennelaere"
        className="mt-3 inline-flex h-9 items-center justify-center rounded bg-[#203c62] px-3 text-sm font-semibold text-white"
        onClick={() => setVisible(false)}
      >
        Åpne tegnlæren
      </Link>
    </aside>
  );
}

export function canShowToast(state: TipToastState, maxPerDay: number, cooldownMs: number, now = Date.now()) {
  const today = toastDateKey(now);
  if (state.date !== today) return true;
  if (state.count >= maxPerDay) return false;
  return now - state.lastShownAt >= cooldownMs;
}

function nextToastTip(tips: GeoGuessrTip[], state: TipToastState) {
  const seen = new Set(state.seenIds);
  return tips.find((tip) => !seen.has(tip.id)) ?? tips[0];
}

function recordToastShown(state: TipToastState, tipId: string, now = Date.now()): TipToastState {
  const today = toastDateKey(now);
  const sameDay = state.date === today;
  const seenIds = sameDay ? state.seenIds : [];
  return {
    date: today,
    count: sameDay ? state.count + 1 : 1,
    lastShownAt: now,
    seenIds: [tipId, ...seenIds.filter((id) => id !== tipId)].slice(0, 50),
  };
}

function readToastState(storageKey: string): TipToastState {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return emptyToastState();
    const parsed = JSON.parse(raw) as Partial<TipToastState>;
    return {
      date: typeof parsed.date === "string" ? parsed.date : "",
      count: typeof parsed.count === "number" ? parsed.count : 0,
      lastShownAt: typeof parsed.lastShownAt === "number" ? parsed.lastShownAt : 0,
      seenIds: Array.isArray(parsed.seenIds) ? parsed.seenIds.filter((id): id is string => typeof id === "string") : [],
    };
  } catch {
    return emptyToastState();
  }
}

function writeToastState(storageKey: string, state: TipToastState) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // A blocked localStorage should not block the app.
  }
}

function emptyToastState(): TipToastState {
  return { date: "", count: 0, lastShownAt: 0, seenIds: [] };
}

function toastDateKey(value: number) {
  return new Date(value).toISOString().slice(0, 10);
}
