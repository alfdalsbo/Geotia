import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Crown,
  Footprints,
  Gavel,
  Milestone,
  ScrollText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Section, StatTile } from "@/components/section";
import { getCurrentGeot } from "@/lib/auth";
import {
  geoticOrderMotto,
  geoticOrderRanks,
  getGeoticOrderRows,
  partyTrials,
} from "@/lib/geotisk-orden";
import { computeStandings } from "@/lib/scoring";
import { getAppState } from "@/lib/store";
import type { GeoticOrderRank } from "@/lib/geotisk-orden";
import { formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Den Geotiske Orden",
};

type OrderRow = ReturnType<typeof getGeoticOrderRows>[number];

export default async function GeoticOrderPage() {
  const state = await getAppState();
  const currentGeot = await getCurrentGeot();
  const standings = computeStandings(state.players, state.rounds);
  const rows = getGeoticOrderRows(
    state.players,
    standings,
    state.geoterIndexAdjustments,
    state.geoticOrderAssessments,
  );
  const currentRow = rows.find((row) => row.player.id === currentGeot?.id) ?? rows[0];
  const topRanks = rows.filter((row) => row.rank.id === "partigrunder").length;
  const candidates = rows.filter((row) => row.rank.number < 4).length;

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded border border-[#c49a3c]/70 bg-[#061d2b] text-[#fff7e6] shadow-[0_22px_48px_rgba(0,0,0,0.22)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded border border-[#c49a3c]/55 bg-[#020b11]/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#e1c06c]">
              <Milestone className="h-4 w-4" aria-hidden="true" />
              Fra borger til ordensmakt
            </div>
            <h1 className="font-display mt-5 text-5xl font-semibold tracking-normal sm:text-7xl">
              Den Geotiske Orden
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#eadcbd]">
              Geotia er ikke bare et rom man går inn i. Det er en kultur man
              opptas i, prøves av og langsomt blir farlig nok til å forvalte.
              Nye deltakere starter som Borgere og kan arbeide seg oppover
              gjennom tid, spill, poeng, engasjement og fellesskap.
            </p>
            <div className="geotia-ornament mt-7 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">
              <span>{geoticOrderMotto}</span>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#ordensstigen"
                className="inline-flex h-11 items-center gap-2 rounded bg-[#e1c06c] px-4 text-sm font-semibold text-[#062b40] shadow-sm transition hover:bg-[#f0d78f]"
              >
                Se rangstigen
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#protokollen"
                className="inline-flex h-11 items-center gap-2 rounded border border-[#e1c06c]/45 bg-[#fff7e6]/10 px-4 text-sm font-semibold text-[#fff7e6] transition hover:bg-[#fff7e6]/16"
              >
                Se geotenes vei
                <UsersRound className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="border-t border-[#c49a3c]/35 bg-[#020b11] p-5 lg:border-l lg:border-t-0">
            <div className="flex h-full flex-col justify-between rounded border border-[#c49a3c]/45 bg-[#fff7e6]/8 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">
                  Din ordensvei
                </p>
                <h2 className="font-display mt-2 text-3xl font-semibold">{currentRow?.rank.name}</h2>
                <p className="mt-3 text-sm leading-6 text-[#eadcbd]">{currentRow?.rank.motto}</p>
              </div>
              {currentRow ? <PersonalPathCard row={currentRow} /> : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile
          label="Ordensnivåer"
          value={geoticOrderRanks.length}
          detail="Fra Borger til Partigründer"
          tone="gold"
        />
        <StatTile
          label="Ordensborgere"
          value={rows.length}
          detail="Ført i den synlige protokollen"
          tone="blue"
        />
        <StatTile
          label="Under herding"
          value={candidates}
          detail="Borger, Anerkjent Borger eller Aspirant"
          tone="green"
        />
        <StatTile
          label="Partigründere"
          value={topRanks}
          detail="Farlige nok til å starte sin egen orden"
          tone="red"
        />
      </div>

      <section id="ordensstigen" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
              Den synlige rangstigen
            </p>
            <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
              Veien opp gjennom Geotia
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#60553f]">
            Rang er ikke vern mot hån. Rang er bare en større blink, båret med
            mer ansvar og bedre protokollføring.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {geoticOrderRanks.map((rank) => (
            <RankCard key={rank.id} rank={rank} current={rank.id === currentRow?.rank.id} />
          ))}
        </div>
      </section>

      <section id="protokollen" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
              Rikets ordensprotokoll
            </p>
            <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
              Geotenes nåværende rang
            </h2>
          </div>
          <Link
            href="/stilling"
            className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[#062b40]/30 bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40] transition hover:border-[#c49a3c]"
          >
            Se poenggrunnlaget
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((row) => (
            <OrderPersonCard key={row.player.id} row={row} current={row.player.id === currentGeot?.id} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Section title="Ritualene" eyebrow="Løfter som virker fordi de nesten ikke gjør det">
          <div className="grid gap-3">
            {geoticOrderRanks.slice(0, 6).map((rank) => (
              <div key={rank.id} className="rounded border border-[#d8c48c] bg-white/72 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
                  {rank.name}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#4f412b]">“{rank.ritual}”</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Partiprøvene" eyebrow="Aspirantens syv dører">
          <div className="grid gap-3 md:grid-cols-2">
            {partyTrials.map((trial) => (
              <div key={trial} className="rounded border border-[#d8c48c] bg-white/72 p-3 text-sm leading-6 text-[#4f412b]">
                {trial}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function PersonalPathCard({ row }: { row: OrderRow }) {
  const nextRank = row.nextRank;
  return (
    <div className="mt-6 rounded border border-[#c49a3c]/40 bg-[#020b11]/45 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">
            Neste steg
          </p>
          <p className="font-display mt-1 text-2xl font-semibold">
            {nextRank?.name ?? "Ordensstigen er foreløpig toppet"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-semibold text-[#e1c06c]">
            {nextRank ? `${row.progressToNext}%` : "100%"}
          </p>
          <p className="text-xs uppercase tracking-[0.12em] text-[#eadcbd]">ferd</p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded bg-[#fff7e6]/12">
        <div
          className="h-full rounded bg-[#e1c06c]"
          style={{ width: `${nextRank ? row.progressToNext : 100}%` }}
        />
      </div>
      <div className="mt-4 grid gap-2 text-sm text-[#eadcbd]">
        <p className="flex items-center justify-between gap-3">
          <span>Tjenestetid</span>
          <span className="text-right font-semibold text-[#fff7e6]">{row.serviceTimeLabel}</span>
        </p>
        <p className="flex items-center justify-between gap-3">
          <span>Tellende runder</span>
          <span className="font-semibold text-[#fff7e6]">{row.roundsPlayed}</span>
        </p>
        <p className="flex items-center justify-between gap-3">
          <span>Livstidspoeng</span>
          <span className="font-semibold text-[#fff7e6]">{formatNumber(row.lifetimePoints)}</span>
        </p>
        <p className="flex items-center justify-between gap-3">
          <span>Fellesskapstillit</span>
          <span className="font-semibold text-[#fff7e6]">Vurderes i ordenen</span>
        </p>
      </div>
    </div>
  );
}

function RankCard({ rank, current }: { rank: GeoticOrderRank; current: boolean }) {
  return (
    <article
      className={
        current
          ? "overflow-hidden rounded border-2 border-[#7c2430] bg-[#fff7e6] shadow-[0_18px_35px_rgba(124,36,48,0.18)]"
          : "overflow-hidden rounded border border-[#c49a3c]/50 bg-[#fff7e6] shadow-sm"
      }
    >
      <div className="flex items-start gap-4 border-b border-[#d8c48c] bg-[#061d2b] p-4 text-[#fff7e6]">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded border border-[#e1c06c]/60 bg-[#fff7e6]/10 font-display text-2xl font-semibold text-[#e1c06c]">
          {rank.number}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">
            Ordensrang
          </p>
          <h3 className="font-display mt-1 text-2xl font-semibold leading-7">{rank.name}</h3>
          <p className="mt-2 text-sm leading-6 text-[#eadcbd]">{rank.motto}</p>
        </div>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm leading-6 text-[#4f412b]">{rank.description}</p>
          <div className="mt-4 grid gap-2">
            {rank.publicRequirements.map((item) => (
              <p key={item} className="flex items-start gap-2 text-sm leading-6 text-[#4f412b]">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[#194832]" aria-hidden="true" />
                {item}
              </p>
            ))}
          </div>
        </div>
        <div className="grid gap-3">
          <MiniList icon={<BadgeCheck className="h-4 w-4" aria-hidden="true" />} title="Rettigheter" items={rank.rights} />
          <MiniList icon={<ScrollText className="h-4 w-4" aria-hidden="true" />} title="Plikter" items={rank.duties} />
        </div>
      </div>
    </article>
  );
}

function OrderPersonCard({ row, current }: { row: OrderRow; current: boolean }) {
  const nextRank = row.nextRank;
  return (
    <article className="geotia-panel rounded p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 h-12 w-2 flex-none rounded-full" style={{ background: row.player.color }} />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
              {current ? "Din plass i ordenen" : "Ordensført geot"}
            </p>
            <h3 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">{row.player.shortName}</h3>
            <p className="text-sm text-[#60553f]">{row.player.title}</p>
          </div>
        </div>
        <div className="rounded border border-[#c49a3c]/40 bg-[#061d2b] px-3 py-2 text-right text-[#fff7e6]">
          <p className="text-xs uppercase tracking-[0.14em] text-[#e1c06c]">Rang</p>
          <p className="font-display mt-1 text-xl font-semibold">{row.rank.name}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#4f412b]">
        {row.publicNote || row.rank.description}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Metric icon={<Footprints className="h-4 w-4" aria-hidden="true" />} label="Tjenestetid" value={row.serviceTimeLabel} />
        <Metric icon={<Gavel className="h-4 w-4" aria-hidden="true" />} label="Runder" value={row.roundsPlayed} />
        <Metric icon={<Crown className="h-4 w-4" aria-hidden="true" />} label="Poeng" value={formatNumber(row.lifetimePoints)} />
      </div>

      <div className="mt-4 rounded border border-[#d8c48c] bg-white/70 p-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-[#062b40]">
            {nextRank ? `Neste: ${nextRank.name}` : "Står ved øverste synlige port"}
          </span>
          <span className="font-semibold text-[#7c2430]">{nextRank ? `${row.progressToNext}%` : "100%"}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded bg-[#d8c48c]/45">
          <div
            className="h-full rounded bg-[#7c2430]"
            style={{ width: `${nextRank ? row.progressToNext : 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs leading-5 text-[#60553f]">
          Status: {row.status.publicLabel}. Fellesskapstillit inngår i opprykk, men føres ikke som offentlig tall.
        </p>
      </div>
    </article>
  );
}

function MiniList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded border border-[#d8c48c] bg-white/70 p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
        {icon}
        {title}
      </p>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <p key={item} className="text-sm leading-6 text-[#4f412b]">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-[#d8c48c] bg-white/70 p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
        {icon}
        {label}
      </p>
      <p className="font-display mt-1 text-2xl font-semibold text-[#062b40]">{value}</p>
    </div>
  );
}
