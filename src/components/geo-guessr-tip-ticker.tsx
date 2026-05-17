"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";

import { GeoGuessrTipCard } from "@/components/geo-guessr-tip-card";
import type { GeoGuessrTip } from "@/lib/geoguessr-tips";

export function GeoGuessrTipTicker({
  tips,
  title = "Dagens tegnlære",
  eyebrow = "GeoGuessr-tips",
  intervalMs = 8000,
}: {
  tips: GeoGuessrTip[];
  title?: string;
  eyebrow?: string;
  intervalMs?: number;
}) {
  const safeTips = useMemo(() => tips.filter(Boolean), [tips]);
  const [index, setIndex] = useState(0);
  const activeTip = safeTips[index % Math.max(safeTips.length, 1)];

  useEffect(() => {
    if (safeTips.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeTips.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, safeTips.length]);

  if (!activeTip) return null;

  return (
    <section className="geotia-panel rounded p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c2430]">{eyebrow}</p>
          <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">{title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {safeTips.length > 1 ? (
            <button
              type="button"
              onClick={() => setIndex((current) => (current + 1) % safeTips.length)}
              className="inline-flex h-10 items-center gap-2 rounded border border-[#d8ded0] bg-white px-3 text-sm font-semibold text-[#203c62]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Nytt tips
            </button>
          ) : null}
          <Link
            href="/arkiv/kjennelaere"
            className="inline-flex h-10 items-center gap-2 rounded bg-[#203c62] px-3 text-sm font-semibold text-white"
          >
            Tegnlære
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <GeoGuessrTipCard tip={activeTip} />
      {safeTips.length > 1 ? (
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {safeTips.map((tip, tipIndex) => (
            <span
              key={tip.id}
              className={`h-1.5 rounded-full transition-all ${
                tipIndex === index ? "w-8 bg-[#7c2430]" : "w-2 bg-[#c49a3c]/45"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
