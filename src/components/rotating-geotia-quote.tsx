"use client";

import { useEffect, useMemo, useState } from "react";
import { Quote } from "lucide-react";

export function RotatingGeotiaQuote({ quotes }: { quotes: string[] }) {
  const safeQuotes = useMemo(() => quotes.filter(Boolean), [quotes]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeQuotes.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeQuotes.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [safeQuotes.length]);

  const quote = safeQuotes[index] ?? "Kjennelæren avventer sitt neste innfall.";

  return (
    <div className="geotia-inscription rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[#c49a3c]/45 bg-[#062b40] text-[#e1c06c]">
          <Quote className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c2430]">
            Rullerende kjennelære
          </p>
          <p className="font-display mt-2 text-2xl font-semibold leading-8 text-[#062b40]">
            {quote}
          </p>
        </div>
      </div>
    </div>
  );
}
