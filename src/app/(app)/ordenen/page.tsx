import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Crown,
  Footprints,
  Gavel,
  LockKeyhole,
  ScrollText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Section, StatTile } from "@/components/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Ornament } from "@/components/ui/ornament";
import { RankMark } from "@/components/ui/rank-mark";
import { Stamp } from "@/components/ui/stamp";
import { getCurrentGeot } from "@/lib/auth";
import {
  geoticOrderFoundingGate,
  geoticOrderMotto,
  geoticOrderRanks,
  getGeoticOrderRows,
  partyTrials,
} from "@/lib/geotisk-orden";
import { geotiaOrderLines, pickGeoticLine } from "@/lib/geotia-jargon";
import { getGeoticOnboardingPath, type OnboardingStep } from "@/lib/geotic-onboarding";
import { computeStandings } from "@/lib/scoring";
import { filterScoreBearingRounds } from "@/lib/slowgeo";
import { getOrderState } from "@/lib/store";
import type { GeoticOrderRank } from "@/lib/geotisk-orden";
import { formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Den Geotiske Orden",
};

type OrderRow = ReturnType<typeof getGeoticOrderRows>[number];

export default async function GeoticOrderPage() {
  const state = await getOrderState();
  const currentGeot = await getCurrentGeot();
  const standings = computeStandings(state.players, filterScoreBearingRounds(state.rounds));
  const rows = getGeoticOrderRows(
    state.players,
    standings,
    state.geoterIndexAdjustments,
    state.geoticOrderAssessments,
  );
  const currentRow = rows.find((row) => row.player.id === currentGeot?.id) ?? rows[0];
  const topRanks = rows.filter((row) => row.rank.id === "partigrunder").length;
  const candidates = rows.filter((row) => row.rank.number < 4).length;
  const currentPath = currentRow ? getGeoticOnboardingPath(currentRow) : null;
  const orderLine = pickGeoticLine(geotiaOrderLines, currentRow?.player.id ?? "ordenen");
  const candidatePaths = rows
    .filter((row) => row.rank.number < 4)
    .map((row) => ({ row, path: getGeoticOnboardingPath(row) }));

  return (
    <div className="space-y-7">
      <section className="geo-hero">
        <div className="geo-hero-grid">
          <div className="geo-hero-text">
            <Eyebrow>Fra borger til ordensmakt · Kapittel VI</Eyebrow>
            <h1 className="geo-hero-title">Den Geotiske Orden</h1>
            <p className="geo-hero-lead geo-hero-lead-dropcap">
              Geotia er ikke bare et rom man går inn i. Det er en kultur man
              opptas i, prøves av og langsomt blir farlig nok til å forvalte.
              Nye deltakere starter som Borgere og kan arbeide seg oppover
              gjennom tid, spill, poeng, engasjement og fellesskap.
            </p>
            <Ornament>{geoticOrderMotto}</Ornament>
            <div className="geo-hero-actions">
              <a href="#ordensstigen" className="btn btn-wax">
                Se rangstigen
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href="#protokollen" className="btn btn-quiet">
                Se geotenes vei
                <UsersRound className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="geo-hero-poster">
            <Image
              src="/illustrations/vapen-ordenen.svg"
              alt="Riksvåpen for Den Geotiske Orden"
              width={300}
              height={350}
              priority
              style={{ width: "auto", maxHeight: "440px" }}
            />
          </div>
        </div>
        {currentRow ? (
          <div className="geo-winner-band">
            <div>
              <p className="label">Din ordensvei</p>
              <p className="value">{currentRow.rank.name} — {currentRow.rank.motto}</p>
            </div>
          </div>
        ) : null}
      </section>

      {currentRow ? (
        <Section title="Din personlige sti" eyebrow="Hva som mangler før neste rang">
          <PersonalPathCard row={currentRow} />
        </Section>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile
          label="Ordensnivåer"
          value={geoticOrderRanks.length}
          detail="Fra Borger til Partigründer"
          tone="gold"
          index={0}
        />
        <StatTile
          label="Ordensborgere"
          value={rows.length}
          detail="Ført i den synlige protokollen"
          tone="blue"
          index={1}
        />
        <StatTile
          label="Under herding"
          value={candidates}
          detail="Borger, Anerkjent Borger eller Aspirant"
          tone="green"
          index={2}
        />
        <StatTile
          label="Partigründere"
          value={topRanks}
          detail="Farlige nok til å starte sin egen orden"
          tone="red"
          index={3}
        />
      </div>

      <Section title={geoticOrderFoundingGate.title} eyebrow="Ingen snarvei til eget parti">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-5 shadow-sm">
            <p className="text-lg leading-8 text-[#4f412b]">{geoticOrderFoundingGate.body}</p>
            <p className="mt-4 rounded border border-[#c49a3c]/55 bg-[#061d2b] px-4 py-3 text-sm font-semibold text-[#fdf7e8]">
              {orderLine}
            </p>
          </div>
          <div className="grid gap-3">
            {geoticOrderFoundingGate.requirements.map((requirement) => (
              <p key={requirement} className="flex items-start gap-2 rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-3 text-sm leading-6 text-[#4f412b] shadow-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[#194832]" aria-hidden="true" />
                {requirement}
              </p>
            ))}
          </div>
        </div>
      </Section>

      {currentPath ? (
        <Section title="Prøvestien" eyebrow="Onboarding uten skjema">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7c2430]">
                    {currentRow.player.shortName}
                  </p>
                  <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
                    {currentPath.nextStep ? `Neste: ${currentPath.nextStep.title}` : "Prøvestien er fullført"}
                  </h2>
                </div>
                <p className="font-display text-4xl font-semibold text-[#7c2430]">{currentPath.progress}%</p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded bg-[#d8c48c]/45">
                <div className="h-full rounded bg-[#7c2430]" style={{ width: `${currentPath.progress}%` }} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {currentPath.steps.map((step) => (
                  <OnboardingStepCard key={step.id} step={step} />
                ))}
              </div>
            </div>
            <aside className="rounded border border-[#c49a3c]/55 bg-[#061d2b] p-4 text-[#fdf7e8] shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">
                Aspirantens prøvedør
              </p>
              <p className="mt-2 text-sm leading-6 text-[#eadcbd]">
                {currentPath.recommendedTrial}
              </p>
              <div className="mt-4 grid gap-2">
                {candidatePaths.slice(0, 4).map(({ row, path }) => (
                  <div key={row.player.id} className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] px-3 py-2 text-sm text-[#4f412b]">
                    <p className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[#062b40]">{row.player.shortName}</span>
                      <span className="font-semibold text-[#7c2430]">{path.completed}/{path.total}</span>
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#60553f]">
                      {path.nextStep ? path.nextStep.title : "Klar for videre rang"}
                    </p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </Section>
      ) : null}

      <details id="ordensstigen" className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4 shadow-sm">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
                Den synlige rangstigen
              </p>
              <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
                Veien opp gjennom Geotia
              </h2>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7e5a18]">
              Åpne rangstigen
            </p>
          </div>
        </summary>
        <div className="mt-4 space-y-4">
          <p className="max-w-xl text-sm leading-6 text-[#60553f]">
            Rang er ikke vern mot hån. Rang er bare en større blink, båret med
            mer ansvar og bedre protokollføring.
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            {geoticOrderRanks.map((rank) => (
              <RankCard key={rank.id} rank={rank} current={rank.id === currentRow?.rank.id} />
            ))}
          </div>
        </div>
      </details>

      <details id="protokollen" className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4 shadow-sm">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
                Rikets ordensprotokoll
              </p>
              <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
                Geotenes nåværende rang
              </h2>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7e5a18]">
              Åpne protokollen
            </p>
          </div>
        </summary>
        <div className="mt-4 space-y-4">
          <Link
            href="/stilling"
            className="inline-flex h-10 items-center justify-center gap-2 rounded border border-[#062b40]/30 bg-[#fdf7e8] px-3 text-sm font-semibold text-[#062b40] transition hover:border-[#c49a3c]"
          >
            Se poenggrunnlaget
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <div className="grid gap-4 lg:grid-cols-2">
            {rows.map((row) => (
              <OrderPersonCard key={row.player.id} row={row} current={row.player.id === currentGeot?.id} />
            ))}
          </div>
        </div>
      </details>

      <details className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-4 shadow-sm">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
                Ordensstoff
              </p>
              <h2 className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
                Ritualer og partiprøver
              </h2>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#7e5a18]">
              Åpne prøvene
            </p>
          </div>
        </summary>
        <div className="mt-4 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
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
      </details>
    </div>
  );
}

function PersonalPathCard({ row }: { row: OrderRow }) {
  const nextRank = row.nextRank;
  const statusLabel = row.promotionReady ? "PROTOKOLL" : nextRank ? "PÅ VEI" : "FULLFØRT";
  return (
    <div className="rounded border border-[#c49a3c]/55 bg-[#fdf7e8] p-5 shadow-sm" data-testid="personal-order-path">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
            Neste steg
          </p>
          <p className="font-display mt-1 text-3xl font-semibold text-[#062b40]">
            {nextRank?.name ?? "Ordensstigen er foreløpig toppet"}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Stamp tone={row.promotionReady ? "alarm" : nextRank ? "navy" : "brass"}>{statusLabel}</Stamp>
          <p className="font-display text-3xl font-semibold text-[#7c2430]">
            {nextRank ? `${row.progressToNext}%` : "Fullført"}
          </p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded bg-[#d8c48c]/45">
        <div
          className="h-full rounded bg-[#7c2430]"
          style={{ width: `${nextRank ? row.progressToNext : 100}%` }}
        />
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <PathFact label="Tjenestetid" value={row.serviceTimeLabel} />
        <PathFact label="Tellende runder" value={row.roundsPlayed} />
        <PathFact label="Livstidspoeng" value={formatNumber(row.lifetimePoints)} />
        <PathFact label="Fellesskapstillit" value="Vurderes i ordenen" />
      </div>
      {row.promotionReady ? (
        <p className="mt-4 rounded border border-[#c49a3c]/45 bg-[#fffaf0] px-3 py-2 text-sm font-semibold text-[#654517]">
          Kriteriene er oppfylt. Protokollen føres videre før ny rang vises.
        </p>
      ) : null}
    </div>
  );
}

function OnboardingStepCard({ step }: { step: OnboardingStep }) {
  const Icon = step.status === "done" ? CheckCircle2 : step.status === "current" ? Clock : LockKeyhole;
  const classes =
    step.status === "done"
      ? "border-[#194832]/35 bg-[#fdf7e8] text-[#194832]"
      : step.status === "current"
        ? "border-[#7c2430]/45 bg-[#fdf7e8] text-[#4f1d24] shadow-sm"
        : "border-[#d8c48c] bg-[#fdf7e8] text-[#60553f]";
  const fill = step.status === "done" ? "bg-[#194832]" : step.status === "current" ? "bg-[#7c2430]" : "bg-[#c49a3c]";

  return (
    <article className={`rounded border p-4 ${classes}`}>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {step.status === "done" ? "Ført" : step.status === "current" ? "Neste" : "Venter"}
      </p>
      <h3 className="font-display mt-2 text-2xl font-semibold">{step.title}</h3>
      <p className="mt-2 text-sm leading-6">{step.detail}</p>
      <div className="mt-3 h-2 overflow-hidden rounded bg-[#d8c48c]/45">
        <div className={`h-full rounded ${fill}`} style={{ width: `${step.progress}%` }} />
      </div>
    </article>
  );
}

function RankCard({ rank, current }: { rank: GeoticOrderRank; current: boolean }) {
  return (
    <article
      className={
        current
          ? "overflow-hidden rounded border-2 border-[#7c2430] bg-[#fdf7e8] shadow-[0_18px_35px_rgba(124,36,48,0.18)]"
          : "overflow-hidden rounded border border-[#c49a3c]/50 bg-[#fdf7e8] shadow-sm"
      }
    >
      <div className="flex items-start gap-4 border-b border-[#d8c48c] bg-[#061d2b] p-4 text-[#fdf7e8]">
        <RankMark rank={rank.number} className="mt-1 flex-none" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">
            Ordensrang
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl font-semibold leading-7">{rank.name}</h3>
            {current ? <Stamp tone="alarm">DIN RANG</Stamp> : null}
          </div>
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
          {rank.limitations?.length ? (
            <MiniList icon={<LockKeyhole className="h-4 w-4" aria-hidden="true" />} title="Begrensninger" items={rank.limitations} />
          ) : null}
        </div>
      </div>
    </article>
  );
}

function OrderPersonCard({ row, current }: { row: OrderRow; current: boolean }) {
  const nextRank = row.nextRank;
  return (
    <article
      className={
        current
          ? "overflow-hidden rounded border-2 border-[#7c2430] bg-[#fdf7e8] shadow-[0_18px_35px_rgba(124,36,48,0.16)]"
          : "overflow-hidden rounded border border-[#c49a3c]/55 bg-[#fdf7e8] shadow-sm"
      }
    >
      <div className="flex flex-col gap-4 border-b border-[#c49a3c]/45 bg-[#061d2b] p-4 text-[#fdf7e8] sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 h-12 w-2 flex-none rounded-full border border-[#e1c06c]/45" style={{ background: row.player.color }} />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">
              {current ? "Din plass i ordenen" : "Ordensført geot"}
            </p>
            <h3 className="font-display mt-1 text-2xl font-semibold">{row.player.shortName}</h3>
            <p className="text-sm text-[#eadcbd]">{row.player.title}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Stamp tone={current ? "alarm" : "navy"}>{current ? "DIN RANG" : row.status.publicLabel}</Stamp>
          <p className="font-display text-xl font-semibold text-[#fdf7e8]">{row.rank.name}</p>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm leading-6 text-[#4f412b]">
          {row.publicNote || row.rank.description}
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Metric icon={<Footprints className="h-4 w-4" aria-hidden="true" />} label="Tjenestetid" value={row.serviceTimeLabel} />
          <Metric icon={<Gavel className="h-4 w-4" aria-hidden="true" />} label="Runder" value={row.roundsPlayed} />
          <Metric icon={<Crown className="h-4 w-4" aria-hidden="true" />} label="Poeng" value={formatNumber(row.lifetimePoints)} />
        </div>

        <div className="mt-4 rounded border border-[#d8c48c] bg-[#fdf7e8] p-3">
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
            Status: {row.promotionReady ? "Kriterier oppfylt · protokollen føres" : row.status.publicLabel}. Fellesskapstillit inngår i opprykk, men føres ikke som offentlig tall.
          </p>
        </div>
      </div>
    </article>
  );
}

function MiniList({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded border border-[#d8c48c] bg-[#fdf7e8] p-3">
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
    <div className="mobile-metric rounded border border-[#d8c48c] bg-[#fdf7e8] p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
        {icon}
        {label}
      </p>
      <p className="mobile-metric-value font-display mt-1 text-2xl font-semibold text-[#062b40]">{value}</p>
    </div>
  );
}

function PathFact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-[#d8c48c] bg-[#fffaf0] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-[#062b40]">{value}</p>
    </div>
  );
}
