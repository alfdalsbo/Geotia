import { BookOpen, MapPinned } from "lucide-react";

import {
  tipCategoryLabels,
  tipConfidenceLabels,
  tipDifficultyLabels,
  type GeoGuessrTip,
} from "@/lib/geoguessr-tip-types";
import { cn } from "@/lib/utils";

export function GeoGuessrTipCard({
  tip,
  compact = false,
  className,
}: {
  tip: GeoGuessrTip;
  compact?: boolean;
  className?: string;
}) {
  const placeLabel =
    tip.countries.length > 0
      ? tip.countries.slice(0, 3).join(", ") + (tip.countries.length > 3 ? " +" : "")
      : tip.regions.filter((region) => region !== "global").slice(0, 2).join(", ") || "Globalt spor";

  return (
    <article
      className={cn(
        "rounded border border-[#d8ded0] bg-white p-4 shadow-sm",
        compact ? "p-3" : "",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
            {tipCategoryLabels[tip.category]}
          </p>
          <h3
            className={cn(
              "mt-1 break-words font-display font-semibold text-[#062b40]",
              compact ? "text-xl leading-6" : "text-2xl leading-7",
            )}
          >
            {tip.title}
          </h3>
        </div>
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded border border-[#c49a3c]/45 bg-[#fff7e6] text-[#7c2430]">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className={cn("mt-3 text-sm leading-6 text-[#4f412b]", compact ? "line-clamp-4" : "")}>
        {tip.body}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="inline-flex items-center gap-1 rounded border border-[#203c62]/20 bg-[#203c62]/8 px-2 py-1 text-[#203c62]">
          <MapPinned className="h-3 w-3" aria-hidden="true" />
          {placeLabel}
        </span>
        <span className="rounded border border-[#285c45]/20 bg-[#285c45]/8 px-2 py-1 text-[#285c45]">
          {tipDifficultyLabels[tip.difficulty]}
        </span>
        <span className="rounded border border-[#c49a3c]/35 bg-[#fff7e6] px-2 py-1 text-[#654517]">
          {tipConfidenceLabels[tip.confidence]}
        </span>
      </div>
    </article>
  );
}
