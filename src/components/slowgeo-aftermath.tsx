import { AlertTriangle, BookOpen, Crown, MapPinned, ShieldAlert } from "lucide-react";

import { Section } from "@/components/section";
import { getSlowGeoRoundInsights, slowGeoDifficultyLabels } from "@/lib/slowgeo-insights";
import type { ComputedRound } from "@/lib/types";
import { formatKm } from "@/lib/utils";

const toneClasses = {
  green: "border-[#285c45]/30 bg-[#285c45]/10 text-[#194832]",
  blue: "border-[#203c62]/30 bg-[#203c62]/10 text-[#203c62]",
  gold: "border-[#c49a3c]/45 bg-[#c49a3c]/14 text-[#654517]",
  red: "border-[#8e3030]/30 bg-[#8e3030]/10 text-[#7c2430]",
};

export function SlowGeoAftermath({ round }: { round: ComputedRound }) {
  const insights = getSlowGeoRoundInsights(round);
  const challenge = round.challenge;
  const difficulty = challenge?.difficulty ? slowGeoDifficultyLabels[challenge.difficulty] : null;
  const bestKm = insights.bestResult?.actualKm ?? null;
  const worstKm = insights.worstResult?.actualKm ?? null;

  return (
    <Section title="Fasitseremoni" eyebrow="Etterspill og riksarkivets dom">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <CeremonyStat
          icon={<Crown className="h-4 w-4" aria-hidden="true" />}
          label="Vinner"
          value={round.winnerNames.join(", ") || "-"}
          detail={formatKm(bestKm)}
        />
        <CeremonyStat
          icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
          label="Verste bom"
          value={insights.worstResult?.player.shortName ?? "-"}
          detail={formatKm(worstKm)}
        />
        <CeremonyStat
          icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
          label="Kattometerstraff"
          value={formatKm(round.worstThreeAverage)}
          detail={insights.missingCount ? `${insights.missingCount} uten pin` : "Alle førte pin"}
        />
        <CeremonyStat
          icon={<MapPinned className="h-4 w-4" aria-hidden="true" />}
          label="Rundens natur"
          value={difficulty ?? "Umerket"}
          detail={challenge?.theme ?? challenge?.country ?? "Street View"}
        />
      </div>

      {challenge?.signature || challenge?.tags?.length ? (
        <div className="mt-4 rounded border border-[#c49a3c]/35 bg-[#fff7e6] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Kuratornotat
          </p>
          {challenge.signature ? (
            <p className="mt-2 text-sm leading-6 text-[#4f412b]">&ldquo;{challenge.signature}&rdquo;</p>
          ) : null}
          {challenge.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {challenge.tags.map((tag) => (
                <span key={tag} className="rounded border border-[#d8ded0] bg-white px-2 py-1 text-xs font-semibold text-[#203c62]">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {insights.insightCards.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {insights.insightCards.map((insight) => (
            <article key={insight.id} className={`rounded border p-4 ${toneClasses[insight.tone]}`}>
              <h3 className="text-lg font-semibold">{insight.title}</h3>
              <p className="mt-2 text-sm leading-6 opacity-90">{insight.body}</p>
            </article>
          ))}
        </div>
      ) : null}

      {insights.notes.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
            Begrunnelser fra pin-øyeblikket
          </h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {insights.notes.map((entry) => (
              <article key={`${entry.playerName}-${entry.note}`} className="rounded border border-[#d8ded0] bg-white p-4">
                <p className="flex items-center gap-2 font-semibold text-[#203c62]">
                  <span className="h-3 w-3 rounded-sm" style={{ background: entry.playerColor }} />
                  {entry.playerName}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#4f412b]">&ldquo;{entry.note}&rdquo;</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </Section>
  );
}

function CeremonyStat({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <div className="rounded border border-[#d8ded0] bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
        {icon}
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-semibold text-[#062b40]">{value}</p>
      <p className="mt-1 break-words text-sm text-[#5b6257]">{detail}</p>
    </div>
  );
}
