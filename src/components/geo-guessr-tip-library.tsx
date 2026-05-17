"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { GeoGuessrTipCard } from "@/components/geo-guessr-tip-card";
import { tipCategoryLabels, type GeoGuessrTip, type TipCategorySummary } from "@/lib/geoguessr-tip-types";

export function GeoGuessrTipLibrary({
  tips,
  categories,
}: {
  tips: GeoGuessrTip[];
  categories: TipCategorySummary[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredTips = useMemo(() => {
    return tips.filter((tip) => {
      const categoryMatch = category === "all" || tip.category === category;
      if (!categoryMatch) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        tip.title,
        tip.body,
        tip.category,
        tip.countries.join(" "),
        tip.regions.join(" "),
        tip.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [category, normalizedQuery, tips]);

  return (
    <section className="space-y-4">
      <div className="geotia-frame rounded p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c2430]">
          Geografisk tegnlære
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold text-[#062b40]">GeoGuessr-tipsbanken</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#60553f]">
              {tips.length} tips fra skilt, språk, veilinjer, bilmeta, stolper og andre spor som geoter faktisk kan lære.
            </p>
          </div>
          <label className="relative block w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c2430]" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded border border-[#d8ded0] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#203c62]"
              placeholder="Søk etter land, spor eller kategori"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`h-9 rounded border px-3 text-xs font-semibold ${
              category === "all"
                ? "border-[#203c62] bg-[#203c62] text-white"
                : "border-[#d8ded0] bg-white text-[#203c62]"
            }`}
          >
            Alle · {tips.length}
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`h-9 rounded border px-3 text-xs font-semibold ${
                category === item.id
                  ? "border-[#203c62] bg-[#203c62] text-white"
                  : "border-[#d8ded0] bg-white text-[#203c62]"
              }`}
            >
              {item.label} · {item.count}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#d8ded0] bg-white px-4 py-3 text-sm">
        <span className="font-semibold text-[#203c62]">{filteredTips.length} tips vist</span>
        {category !== "all" ? (
          <span className="text-[#5b6257]">{tipCategoryLabels[category as keyof typeof tipCategoryLabels]}</span>
        ) : (
          <span className="text-[#5b6257]">Alle kategorier</span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredTips.map((tip) => (
          <GeoGuessrTipCard key={tip.id} tip={tip} compact />
        ))}
      </div>
    </section>
  );
}
