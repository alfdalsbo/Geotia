import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function GeotingSummaryActionStrip({
  actionLabel,
  className,
  openLabel = "Lukk sak",
}: {
  actionLabel: string;
  className?: string;
  openLabel?: string;
}) {
  return (
    <div
      className={cn(
        "mt-1 flex min-h-12 w-full items-center justify-between gap-3 rounded border border-[#7c2430]/55 bg-[#7c2430] px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.12em] text-[#fff7e6] shadow-sm transition group-hover:bg-[#641923] group-active:bg-[#4f121b] group-open:border-[#062b40]/55 group-open:bg-[#062b40] lg:col-span-3",
        className,
      )}
      data-testid="geoting-action-strip"
    >
      <span className="min-w-0">
        <span className="group-open:hidden">{actionLabel}</span>
        <span className="hidden group-open:inline">{openLabel}</span>
      </span>
      <ChevronDown className="h-5 w-5 flex-none transition group-open:rotate-180" aria-hidden="true" />
    </div>
  );
}

export function GeotingCloseStrip({
  className,
  label = "Lukk sak",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "mt-4 flex min-h-11 w-full items-center justify-between gap-3 rounded border border-[#062b40]/45 bg-[#062b40] px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.12em] text-[#fff7e6] shadow-sm transition hover:bg-[#0d3a55] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c49a3c]",
        className,
      )}
      data-geoting-close
    >
      <span>{label}</span>
      <ChevronDown className="h-5 w-5 rotate-180" aria-hidden="true" />
    </button>
  );
}
