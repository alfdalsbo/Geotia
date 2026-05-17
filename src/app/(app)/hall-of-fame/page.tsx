import { Medal, Shield, Sparkles, Trophy } from "lucide-react";

import { Section } from "@/components/section";
import { computeStandings, getHallOfFame } from "@/lib/scoring";
import { getRoundsState } from "@/lib/store";
import { dateLabel, formatKm, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Æreshallen",
};

export default async function HallOfFamePage() {
  const state = await getRoundsState();
  const standings = computeStandings(state.players, state.rounds);
  const hall = getHallOfFame(standings, state.rounds, state.players);

  return (
    <div className="space-y-6">
      <div className="geotia-frame rounded p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
          De ærverdige annaler
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-normal text-[#062b40] sm:text-5xl">
          Æreshallen
        </h1>
        <p className="mt-3 max-w-3xl text-[#60553f]">
          Her heves bragdene frem, og her føres skammen med samme presisjon som
          poengene. Ingen medalje uten protokoll.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Podium
          title="Flest poeng"
          eyebrow="Poengmestere"
          icon={<Trophy className="h-5 w-5" aria-hidden="true" />}
          rows={hall.mostPoints.map((standing) => ({
            name: standing.player.shortName,
            value: `${standing.totalPoints} poeng`,
            detail: `${standing.roundsPlayed} runder spilt`,
          }))}
        />
        <Podium
          title="Lavest kattometer"
          eyebrow="Presisjonsadelen"
          icon={<Shield className="h-5 w-5" aria-hidden="true" />}
          rows={hall.lowestKattometer.map((standing) => ({
            name: standing.player.shortName,
            value: formatKm(standing.totalKattometer),
            detail: `${formatKm(standing.averageKattometer)} i snitt`,
          }))}
        />
        <Podium
          title="Flest seire"
          eyebrow="Kampvinnere"
          icon={<Medal className="h-5 w-5" aria-hidden="true" />}
          rows={hall.mostWins.map((standing) => ({
            name: standing.player.shortName,
            value: `${standing.wins} seire`,
            detail: `${standing.totalPoints} poeng totalt`,
          }))}
        />
        <Podium
          title="Beste snittpoeng"
          eyebrow="Jevn overmakt"
          icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
          rows={hall.bestAveragePoints.map((standing) => ({
            name: standing.player.shortName,
            value: formatNumber(standing.averagePoints),
            detail: `${standing.roundsPlayed} runder spilt`,
          }))}
        />
        <Podium
          title="Lavest snitt-km"
          eyebrow="Presisjon over tid"
          icon={<Shield className="h-5 w-5" aria-hidden="true" />}
          rows={hall.lowestAverageKattometer.map((standing) => ({
            name: standing.player.shortName,
            value: formatKm(standing.averageKattometer),
            detail: `${formatKm(standing.totalKattometer)} totalt`,
          }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Beste enkeltprestasjon" eyebrow="Udødelig øyeblikk">
          {hall.bestSingle ? (
            <RecordBlock
              name={hall.bestSingle.result.player.shortName}
              value={formatKm(hall.bestSingle.result.actualKm)}
              round={hall.bestSingle.round.name}
              date={dateLabel(hall.bestSingle.round.date)}
              tone="green"
            />
          ) : (
            <EmptyRecord text="Ingen udødelige øyeblikk ført ennå." />
          )}
        </Section>
        <Section title="Verste bom" eyebrow="Skammens protokoll">
          {hall.worstSingle ? (
            <RecordBlock
              name={hall.worstSingle.result.player.shortName}
              value={formatKm(hall.worstSingle.result.actualKm)}
              round={hall.worstSingle.round.name}
              date={dateLabel(hall.worstSingle.round.date)}
              tone="red"
            />
          ) : (
            <EmptyRecord text="Skammen ligger ennå urørt i arkivet." />
          )}
        </Section>
      </div>
    </div>
  );
}

function Podium({
  title,
  eyebrow,
  icon,
  rows,
}: {
  title: string;
  eyebrow: string;
  icon: React.ReactNode;
  rows: Array<{ name: string; value: string; detail: string }>;
}) {
  return (
    <Section title={title} eyebrow={eyebrow}>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={`${row.name}-${row.value}`}
              className="flex items-center justify-between rounded border border-[#d8ded0] bg-[#f7f8f5] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-white text-[#8e3030] shadow-sm">
                  {icon}
                </div>
                <div>
                  <p className="font-semibold text-[#161713]">
                    {index + 1}. {row.name}
                  </p>
                  <p className="text-sm text-[#5b6257]">{row.detail}</p>
                </div>
              </div>
              <p className="text-lg font-semibold text-[#203c62]">{row.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyRecord text="Æreshallen avventer første låste runde." />
      )}
    </Section>
  );
}

function RecordBlock({
  name,
  value,
  round,
  date,
  tone,
}: {
  name: string;
  value: string;
  round: string;
  date: string;
  tone: "green" | "red";
}) {
  return (
    <div
      className={
        tone === "green"
          ? "rounded border border-[#285c45]/25 bg-[#285c45]/8 p-5"
          : "rounded border border-[#8e3030]/25 bg-[#8e3030]/8 p-5"
      }
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5b6257]">{name}</p>
      <p className="mt-2 text-4xl font-semibold tracking-normal text-[#161713]">{value}</p>
      <p className="mt-3 text-sm text-[#5b6257]">
        {round} · {date}
      </p>
    </div>
  );
}

function EmptyRecord({ text }: { text: string }) {
  return (
    <div className="rounded border border-dashed border-[#b8892f] bg-[#b8892f]/8 p-5 text-sm text-[#7b591d]">
      {text}
    </div>
  );
}
