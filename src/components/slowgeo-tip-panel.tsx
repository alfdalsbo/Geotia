"use client";

import { useMemo, useState } from "react";
import { Lightbulb, RotateCcw } from "lucide-react";

import { GeoGuessrTipCard } from "@/components/geo-guessr-tip-card";
import type { GeoGuessrTip } from "@/lib/geoguessr-tips";

export function SlowGeoTipPanel({
  tips,
  title = "Tegnlære for kranglingen",
}: {
  tips: GeoGuessrTip[];
  title?: string;
}) {
  const safeTips = useMemo(() => tips.filter(Boolean), [tips]);
  const [index, setIndex] = useState(0);
  const activeTip = safeTips[index % Math.max(safeTips.length, 1)];

  if (!activeTip) return null;

  return (
    <div className="rounded border border-[#c49a3c]/35 bg-[#fdf7e8] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#7c2430]">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
          {title}
        </p>
        {safeTips.length > 1 ? (
          <button
            type="button"
            onClick={() => setIndex((current) => (current + 1) % safeTips.length)}
            className="inline-flex h-9 items-center gap-2 rounded border border-[#d8ded0] bg-white px-3 text-xs font-semibold text-[#203c62]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Nytt tips
          </button>
        ) : null}
      </div>
      <GeoGuessrTipCard tip={activeTip} compact />
    </div>
  );
}
