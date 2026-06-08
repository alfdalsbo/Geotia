import Image from "next/image";
import { Medal, Shield, Sparkles, Trophy } from "lucide-react";

import { Section } from "@/components/section";
import { SlowGeoSubnav } from "@/components/slowgeo-subnav";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RankMark } from "@/components/ui/rank-mark";
import { Stamp } from "@/components/ui/stamp";
import { computeStandings, getHallOfFame } from "@/lib/scoring";
import { filterScoreBearingRounds } from "@/lib/slowgeo";
import { getRoundsState } from "@/lib/store";
import { dateLabel, formatKm, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Æreshallen",
};

export default async function HallOfFamePage() {
  const state = await getRoundsState();
  const scoreBearingRounds = filterScoreBearingRounds(state.rounds);
  const standings = computeStandings(state.players, scoreBearingRounds);
  const hall = getHallOfFame(standings, scoreBearingRounds, state.players);

  return (
    <div className="space-y-6">
      <section className="geo-hero">
        <div className="geo-hero-grid">
          <div className="geo-hero-text">
            <Eyebrow tone="gold">De ærverdige annaler · Kapittel VIII</Eyebrow>
            <h1 className="geo-hero-title">Æreshallen</h1>
            <p className="geo-hero-lead geo-hero-lead-dropcap">
              Her heves bragdene frem, og her føres skammen med samme presisjon
              som poengene. Ingen medalje uten protokoll.
            </p>
          </div>
          <div className="geo-hero-poster">
            <Image
              src="/illustrations/vapen-tabeller.svg"
              alt="Riksvåpen for Tabellene"
              width={300}
              height={350}
              priority
              style={{ width: "auto", maxHeight: "440px" }}
            />
          </div>
        </div>
      </section>

      <SlowGeoSubnav />

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
              className="flex items-center justify-between gap-3 rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <RankMark rank={index + 1} />
                <div className="min-w-0">
                  <p className="geot-name">{row.name}</p>
                  <p className="geot-title">{row.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="num-display">{row.value}</span>
                <span className="hidden text-[#7e5a18] sm:inline-flex" aria-hidden="true">
                  {icon}
                </span>
              </div>
            </div>
          ))}
          <div className="pt-1 text-center">
            <Stamp tone="brass">REKORDER ARKIVERT</Stamp>
          </div>
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
          ? "rounded border border-[#285c45]/35 bg-[#fdf7e8] p-5 shadow-sm"
          : "rounded border border-[#8e3030]/35 bg-[#fdf7e8] p-5 shadow-sm"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5b6257]">{name}</p>
        <Stamp tone={tone === "green" ? "brass" : "alarm"}>
          {tone === "green" ? "ÆRE FØRT" : "EVIG REGISTRERT"}
        </Stamp>
      </div>
      <p className="font-display mt-2 text-4xl font-semibold tracking-normal text-[#062b40]">{value}</p>
      <p className="mt-3 text-sm font-italic-serif text-[#5b6257]">
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
