import { CheckCircle2, CircleDashed } from "lucide-react";

import type { SlowGeoAnswerStatusItem } from "@/lib/slowgeo-answer-status";

export function SlowGeoAnswerStatus({ items }: { items: SlowGeoAnswerStatusItem[] }) {
  const answeredCount = items.filter((item) => item.hasAnswered).length;
  const totalCount = items.length;

  if (totalCount === 0) return null;

  return (
    <section aria-label="Hvem har svart" className="rounded border border-[#d8ded0] bg-white p-3 shadow-sm">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">Svarstatus</p>
          <h3 className="font-display mt-1 text-lg font-semibold text-[#062b40]">Hvem har svart</h3>
        </div>
        <p className="inline-flex w-fit items-center rounded border border-[#285c45]/25 bg-[#285c45]/10 px-3 py-1.5 text-sm font-semibold text-[#285c45]">
          {answeredCount}/{totalCount} pin-svar låst
        </p>
      </div>

      <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const statusLabel = item.hasAnswered ? (item.isCurrent ? "Ditt svar låst" : "Svar låst") : "Mangler pin";
          const Icon = item.hasAnswered ? CheckCircle2 : CircleDashed;

          return (
            <div
              key={item.playerId}
              className="flex min-w-0 items-center justify-between gap-3 rounded border border-[#d8ded0] bg-[#fdf7e8] px-3 py-2"
            >
              <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-[#203c62]">
                <span className="h-3 w-3 flex-none rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="min-w-0 truncate" title={item.name}>
                  {item.shortName}
                </span>
              </span>
              <span
                className={
                  item.hasAnswered
                    ? "inline-flex flex-none items-center gap-1.5 rounded border border-[#285c45]/20 bg-[#285c45]/10 px-2 py-1 text-xs font-semibold text-[#285c45]"
                    : "inline-flex flex-none items-center gap-1.5 rounded border border-[#8e3030]/20 bg-[#8e3030]/8 px-2 py-1 text-xs font-semibold text-[#8e3030]"
                }
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
