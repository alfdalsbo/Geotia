import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  Crown,
  Eye,
  FileText,
  Footprints,
  Gavel,
  History,
  KeyRound,
  Landmark,
  LockKeyhole,
  Milestone,
  PlusCircle,
  Scale,
  ScrollText,
  ShieldCheck,
  TableProperties,
  UserCog,
} from "lucide-react";

import {
  submitGeoterIndexAdjustmentAction,
  submitGeoticOrderAssessmentAction,
  updateGeotingProposalAction,
  withdrawGeotingProposalAction,
} from "@/app/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Section, StatTile } from "@/components/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Ornament } from "@/components/ui/ornament";
import { RankMark } from "@/components/ui/rank-mark";
import { Stamp } from "@/components/ui/stamp";
import { getCurrentGeot } from "@/lib/auth";
import {
  geoterIndexCategories,
  geoterIndexLaw,
  geoterIndexMotto,
  geoterIndexMultipliers,
  geoterIndexProcedures,
  geoterIndexTiers,
  getGeoterIndexAdjustmentTrail,
  getGeoterIndexRows,
  negativeIndexRules,
  positiveIndexRules,
} from "@/lib/geoterindeks";
import { getGeoterIndexDossier } from "@/lib/geoterindeks-dossier";
import {
  geoticOrderHiddenCategories,
  geoticOrderRanks,
  geoticOrderStatuses,
  getGeoticOrderRows,
  partyTrials,
} from "@/lib/geotisk-orden";
import {
  getThirdCollegeSeat,
  isThirdCollegeMember,
  thirdCollegeMotto,
  thirdCollegePrivileges,
  thirdCollegeSeats,
} from "@/lib/kollegium";
import { computeRound, computeStandings } from "@/lib/scoring";
import { getAppState } from "@/lib/store";
import type { GeoterIndexAdjustment, GeotingProposal, Player } from "@/lib/types";
import { dateLabel, dateTimeLabel, formatKm, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Tredje Kollegium",
};

const proposalRuleLabels = {
  grunnlov: "GeoGrunnlovsendring",
  mindre: "Mindre lovendring",
  annet: "Annet tingvedtak",
};

const proposalStatusLabels = {
  open: "Venter på geo-ed",
  voting: "I avstemning",
  passed: "Vedtatt",
  rejected: "Forkastet",
  archived: "Trukket",
};

export default async function ThirdCollegePage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const currentGeot = await getCurrentGeot();
  if (!currentGeot || !isThirdCollegeMember(currentGeot.id)) {
    notFound();
  }

  const state = await getAppState();
  const currentSeat = getThirdCollegeSeat(currentGeot.id);
  const standings = computeStandings(state.players, state.rounds);
  const standingByPlayerId = new Map(standings.map((standing) => [standing.player.id, standing]));
  const playerById = new Map(state.players.map((player) => [player.id, player]));
  const partyById = new Map(state.parties.map((party) => [party.id, party]));
  const lockedRounds = state.rounds.filter((round) => round.status === "locked");
  const draftRounds = state.rounds.filter((round) => round.status === "draft");
  const latestRound = lockedRounds.at(-1);
  const computedLatest = latestRound ? computeRound(latestRound, state.players) : null;
  const openProposals = state.geotingProposals.filter((proposal) => proposal.status === "open");
  const votingProposals = state.geotingProposals.filter((proposal) => proposal.status === "voting");
  const collegeStandings = standings.filter((standing) => isThirdCollegeMember(standing.player.id));
  const collegePoints = collegeStandings.reduce((sum, standing) => sum + standing.totalPoints, 0);
  const totalPoints = standings.reduce((sum, standing) => sum + standing.totalPoints, 0);
  const collegePointShare = totalPoints > 0 ? Math.round((collegePoints / totalPoints) * 100) : 0;
  const topNonCollege = standings.find((standing) => !isThirdCollegeMember(standing.player.id));
  const skam = [...standings].sort((a, b) => b.totalKattometer - a.totalKattometer)[0];
  const precision = [...standings]
    .filter((standing) => standing.lockedRounds > 0)
    .sort((a, b) => a.totalKattometer - b.totalKattometer)[0];
  const geoterIndexRows = getGeoterIndexRows(state.players, state.geoterIndexAdjustments);
  const geoterIndexDossier = getGeoterIndexDossier(geoterIndexRows);
  const geoterIndexAverage =
    geoterIndexRows.length > 0
      ? Math.round(geoterIndexRows.reduce((sum, row) => sum + row.score, 0) / geoterIndexRows.length)
      : 0;
  const geoterIndexLeader = geoterIndexRows[0];
  const geoterIndexRisk = [...geoterIndexRows].sort((a, b) => a.score - b.score)[0];
  const latestIndexAdjustments = [...state.geoterIndexAdjustments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const geoticOrderRows = getGeoticOrderRows(
    state.players,
    standings,
    state.geoterIndexAdjustments,
    state.geoticOrderAssessments,
  );

  const memberRows = thirdCollegeSeats.map((seat) => {
    const player = playerById.get(seat.playerId);
    const party = partyById.get(seat.partyId);
    const standing = standingByPlayerId.get(seat.playerId);
    return { seat, player, party, standing };
  });

  return (
    <div className="space-y-7">
      <section className="geo-hero geo-hero--dark">
        <div className="geo-hero-grid">
          <div className="geo-hero-text">
            <Eyebrow>
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              Strengt internt · 3K
            </Eyebrow>
            <h1 className="geo-hero-title">Tredje Kollegium</h1>
            <p className="geo-hero-lead geo-hero-lead-dropcap">
              Geotias dype stat er ikke et organ. Det er et blikk, tre stoler
              og en usedvanlig høytidelig mistanke om at riket trenger en sal
              bak salen. SS, PKK og IRA samles her når statsapparatet må vite
              mer enn det offisielt vet.
            </p>
            <Ornament>{thirdCollegeMotto}</Ornament>

            <div className="mt-7 grid gap-3 md:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3">
              <div className="rounded border border-[#c49a3c]/45 bg-[#fff7e6]/10 p-4">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#e1c06c]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Din stol
                </p>
                <p
                  className="mt-2 text-xl font-semibold leading-7 break-words text-[#fff7e6] 2xl:text-2xl"
                  style={{ fontFamily: "var(--font-numerals)" }}
                >
                  {currentSeat?.seal ?? "Skjult segl"}
                </p>
                <p className="mt-2 text-sm text-[#eadcbd]">{currentSeat?.office}</p>
              </div>
              <div className="rounded border border-[#c49a3c]/45 bg-[#fff7e6]/10 p-4">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#e1c06c]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Dekknavn
                </p>
                <p
                  className="mt-2 text-xl font-semibold leading-7 break-words text-[#fff7e6] 2xl:text-2xl"
                  style={{ fontFamily: "var(--font-numerals)" }}
                >
                  {currentSeat?.codename ?? "Ingen spor"}
                </p>
                <p className="mt-2 text-sm text-[#eadcbd]">Innlogget som {currentGeot.shortName}</p>
              </div>
              <div className="rounded border border-[#c49a3c]/45 bg-[#fff7e6]/10 p-4">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#e1c06c]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Synlighet
                </p>
                <p
                  className="mt-2 text-xl font-semibold leading-7 break-words text-[#fff7e6] 2xl:text-2xl"
                  style={{ fontFamily: "var(--font-numerals)" }}
                >
                  Null
                </p>
                <p className="mt-2 text-sm text-[#eadcbd]">For resten av riket finnes ikke fanen.</p>
              </div>
            </div>
          </div>

          <div className="geo-hero-poster">
            <Image
              src="/illustrations/vapen-kollegium.svg"
              alt="Riksvåpen for Tredje Kollegium"
              width={300}
              height={350}
              priority
              style={{ width: "auto", maxHeight: "440px" }}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile
          label="Kollegiets poengandel"
          value={totalPoints > 0 ? `${collegePointShare}%` : "-"}
          detail={`${formatNumber(collegePoints)} av ${formatNumber(totalPoints)} førte poeng`}
          tone="gold"
          index={0}
        />
        <StatTile
          label="Åpne saker"
          value={openProposals.length + votingProposals.length}
          detail={votingProposals.length ? `${votingProposals.length} sak i urnen` : "Ingen urne brenner"}
          tone="red"
          index={1}
        />
        <StatTile
          label="Utkast under duken"
          value={draftRounds.length}
          detail="Runder som ennå kan formes i stillhet"
          tone="blue"
          index={2}
        />
        <StatTile
          label="Ytre utfordrer"
          value={topNonCollege?.player.shortName ?? "-"}
          detail={topNonCollege ? `${topNonCollege.totalPoints} poeng utenfor salen` : "Ingen data"}
          tone="green"
          index={3}
        />
      </div>

      <ThirdCollegeStatus status={params.status} error={params.error} />

      <div className="grid gap-3 md:grid-cols-3">
        <StatTile
          label="Indeksleder"
          value={geoterIndexLeader?.player.shortName ?? "-"}
          detail={geoterIndexLeader ? `${geoterIndexLeader.score} · ${geoterIndexLeader.tier.name}` : "GEO-OBS venter"}
          tone="gold"
          index={0}
        />
        <StatTile
          label="Indekssnitt"
          value={geoterIndexAverage || "-"}
          detail="Normaltilstand er 700"
          tone="blue"
          index={1}
        />
        <StatTile
          label="Laveste tillitssone"
          value={geoterIndexRisk?.player.shortName ?? "-"}
          detail={geoterIndexRisk ? `${geoterIndexRisk.score} · ${geoterIndexRisk.tier.name}` : "Ingen mistenkt ennå"}
          tone="red"
          index={2}
        />
      </div>

      <GeoterIndexSection
        currentGeot={currentGeot}
        dossier={geoterIndexDossier}
        latestAdjustments={latestIndexAdjustments}
        rows={geoterIndexRows}
        players={state.players}
      />

      <GeoticOrderControlSection currentGeot={currentGeot} rows={geoticOrderRows} players={state.players} />

      <GeotingAdminSection proposals={state.geotingProposals} players={state.players} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Section
          title="Indre protokoll"
          eyebrow="SS · PKK · IRA"
          action={
            <span className="inline-flex h-10 items-center gap-2 rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]">
              <Eye className="h-4 w-4" aria-hidden="true" />
              Kun tre par øyne
            </span>
          }
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {memberRows.map(({ seat, player, party, standing }) => (
              <article
                key={seat.playerId}
                className="archive-card relative"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7c2430]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {seat.seal} · {seat.partyId.toUpperCase()}
                    </p>
                    <h3 className="mt-1 break-words">{player?.shortName ?? seat.playerId}</h3>
                  </div>
                  <span
                    className="h-10 w-2 flex-none rounded-full"
                    style={{ background: player?.color ?? party?.color ?? "#c49a3c" }}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#0a2b3f]">{seat.office}</p>
                <p className="lead-detail">{seat.oversight}</p>
                <div className="mt-4 grid gap-2 border-t border-[#c49a3c]/35 pt-3 text-sm">
                  <p className="flex items-center justify-between">
                    <span className="text-[#60553f]">Rang</span>
                    {standing ? <RankMark rank={standing.rank} /> : <span>—</span>}
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#60553f]">Poeng</span>
                    <span className="num-display text-lg">{standing?.totalPoints ?? 0}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#60553f]">Kattometer</span>
                    <span className="font-semibold">{formatKm(standing?.totalKattometer)}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Utvidede rettigheter" eyebrow="Mørkelysmandat">
          <div className="space-y-3">
            {thirdCollegePrivileges.map((privilege) => (
              <div
                key={privilege}
                className="flex items-start gap-3 rounded border border-[#d8c48c] bg-white/72 p-3 text-sm leading-6"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[#194832]" aria-hidden="true" />
                <span>{privilege}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded border border-[#7c2430]/25 bg-[#7c2430]/10 p-4 text-sm leading-6 text-[#4f1d24]">
            <p className="font-semibold">Sirkulær 3K-001</p>
            <p className="mt-1">
              Dersom hele riket mener saken er ferdig, kan Tredje Kollegium
              protokollføre at etterarbeidet nettopp har begynt.
            </p>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Operativt overblikk"
          eyebrow="Dypstatens tavle"
          action={
            <Link
              href="/geotinget"
              className="inline-flex h-10 items-center gap-2 rounded bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]"
            >
              Til GeoTinget
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Gavel className="mt-0.5 h-5 w-5 text-[#7c2430]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#062b40]">Saker i bevegelse</p>
                <p className="mt-1 text-[#60553f]">
                  {openProposals.length} åpne og {votingProposals.length} i avstemning.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TableProperties className="mt-0.5 h-5 w-5 text-[#194832]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#062b40]">Siste låste runde</p>
                <p className="mt-1 text-[#60553f]">
                  {computedLatest
                    ? `${computedLatest.name} · ${dateLabel(computedLatest.date)} · vinner ${computedLatest.winnerNames.join(", ")}`
                    : "Ingen låst runde ennå."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Scale className="mt-0.5 h-5 w-5 text-[#654517]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#062b40]">Kattometerets skygge</p>
                <p className="mt-1 text-[#60553f]">
                  {skam ? `${skam.player.shortName} bærer ${formatKm(skam.totalKattometer)}.` : "Ingen skam ført."}
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Maktbalanse" eyebrow="Offisielt uoffisielt">
          <div className="space-y-3 text-sm">
            {collegeStandings.map((standing) => (
              <div
                key={standing.player.id}
                className="flex items-center justify-between rounded border border-[#d8ded0] bg-white p-3"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Crown className="h-4 w-4 text-[#b8892f]" aria-hidden="true" />
                  {standing.player.shortName}
                </span>
                <span>{standing.totalPoints} p</span>
              </div>
            ))}
            <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6] p-3 text-[#60553f]">
              Kollegiets samlede kattometer:{" "}
              <span className="font-semibold text-[#161713]">
                {formatKm(collegeStandings.reduce((sum, standing) => sum + standing.totalKattometer, 0))}
              </span>
            </div>
          </div>
        </Section>

        <Section title="Varsellamper" eyebrow="Taus alarm">
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Landmark className="mt-0.5 h-5 w-5 text-[#062b40]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#062b40]">Rikets front</p>
                <p className="mt-1 text-[#60553f]">
                  {standings[0]
                    ? `${standings[0].player.shortName} leder med ${standings[0].totalPoints} poeng.`
                    : "Ingen leder er ført."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 h-5 w-5 text-[#7c2430]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#062b40]">Presisjonsnøkkel</p>
                <p className="mt-1 text-[#60553f]">
                  {precision
                    ? `${precision.player.shortName} har lavest kattometer: ${formatKm(precision.totalKattometer)}.`
                    : "Kattometeret venter på data."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ScrollText className="mt-0.5 h-5 w-5 text-[#654517]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#062b40]">Nærmeste pergament</p>
                <p className="mt-1 text-[#60553f]">
                  {draftRounds.at(-1)?.name || "Ingen åpne rundeutkast ligger fremme."}
                </p>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function ThirdCollegeStatus({ status, error }: { status?: string; error?: string }) {
  if (error === "indeks") {
    return (
      <div className="rounded border border-[#7c2430]/30 bg-[#7c2430]/10 px-4 py-3 text-sm font-semibold text-[#7c2430]">
        GEO-OBS 3K avviste justeringen. Delta må være annet enn null, og geoten må finnes.
      </div>
    );
  }

  if (error === "orden") {
    return (
      <div className="rounded border border-[#7c2430]/30 bg-[#7c2430]/10 px-4 py-3 text-sm font-semibold text-[#7c2430]">
        Ordensprotokollen avviste føringen. Geoten må finnes før Kollegiet kan skyve ham opp eller ned trappen.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-[#7c2430]/30 bg-[#7c2430]/10 px-4 py-3 text-sm font-semibold text-[#7c2430]">
        {error}
      </div>
    );
  }

  if (status === "geoterindeks") {
    return (
      <div className="rounded border border-[#194832]/30 bg-[#194832]/10 px-4 py-3 text-sm font-semibold text-[#194832]">
        Geoterindeksen er justert. Ingen utenfor rommet skal merke annet enn en svak sosial temperaturendring.
      </div>
    );
  }

  if (status === "orden") {
    return (
      <div className="rounded border border-[#194832]/30 bg-[#194832]/10 px-4 py-3 text-sm font-semibold text-[#194832]">
        Ordensrang er ført. Den offentlige veien ser høytidelig ut; årsaken forblir bak døren.
      </div>
    );
  }

  if (status === "geoting-redigert") {
    return (
      <div className="rounded border border-[#194832]/30 bg-[#194832]/10 px-4 py-3 text-sm font-semibold text-[#194832]">
        GeoTing-saken er endret av Tredje Kollegium.
      </div>
    );
  }

  if (status === "geoting-trukket") {
    return (
      <div className="rounded border border-[#194832]/30 bg-[#194832]/10 px-4 py-3 text-sm font-semibold text-[#194832]">
        GeoTing-saken er trukket og arkivert.
      </div>
    );
  }

  return null;
}

type GeoterIndexRow = ReturnType<typeof getGeoterIndexRows>[number];
type GeoticOrderRow = ReturnType<typeof getGeoticOrderRows>[number];

function GeotingAdminSection({
  players,
  proposals,
}: {
  players: Player[];
  proposals: GeotingProposal[];
}) {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const visibleProposals = proposals.slice(0, 8);

  return (
    <Section title="GeoTing-administrasjon" eyebrow="Tredje Kollegiums tekniske mandat">
      {visibleProposals.length ? (
        <div className="grid gap-4">
          {visibleProposals.map((proposal) => {
            const proposer = playerById.get(proposal.proposedBy);
            const canWithdraw = proposal.status === "open" || proposal.status === "voting";

            return (
              <article key={proposal.id} className="rounded border border-[#d8c48c] bg-[#fff7e6] p-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c2430]">
                      {proposalStatusLabels[proposal.status]} · fremmet av {proposer?.shortName ?? proposal.proposedBy}
                    </p>
                    <h3 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">
                      {proposal.title}
                    </h3>
                  </div>
                  <span className="w-fit rounded border border-[#c49a3c]/35 bg-white px-2 py-1 text-xs font-semibold text-[#654517]">
                    {proposalRuleLabels[proposal.ruleType]}
                  </span>
                </div>

                <form action={updateGeotingProposalAction} className="mt-4 grid gap-3 lg:grid-cols-[1fr_230px]">
                  <input type="hidden" name="proposalId" value={proposal.id} />
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[#273125]">Tittel</span>
                    <input
                      name="title"
                      defaultValue={proposal.title}
                      className="h-10 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
                      required
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-[#273125]">Sakstype</span>
                    <select
                      name="ruleType"
                      defaultValue={proposal.ruleType}
                      className="h-10 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
                    >
                      <option value="grunnlov">GeoGrunnlovsendring</option>
                      <option value="mindre">Mindre lovendring</option>
                      <option value="annet">Annet tingvedtak</option>
                    </select>
                  </label>
                  <label className="space-y-2 lg:col-span-2">
                    <span className="text-sm font-semibold text-[#273125]">Forslag / innhold</span>
                    <textarea
                      name="body"
                      defaultValue={proposal.body}
                      className="min-h-28 w-full rounded border border-[#d8ded0] bg-white px-3 py-2 outline-none focus:border-[#203c62]"
                      required
                    />
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:col-span-2">
                    <PendingSubmitButton className="btn btn-brass btn-small">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      Lagre endring
                    </PendingSubmitButton>
                  </div>
                </form>

                {canWithdraw ? (
                  <form action={withdrawGeotingProposalAction} className="mt-3">
                    <input type="hidden" name="proposalId" value={proposal.id} />
                    <PendingSubmitButton className="btn btn-wax btn-small">
                      <Gavel className="h-4 w-4" aria-hidden="true" />
                      Trekk forslag
                    </PendingSubmitButton>
                  </form>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded border border-dashed border-[#c49a3c] bg-[#c49a3c]/10 p-5 text-sm text-[#60553f]">
          Ingen innsendte GeoTing-saker ligger under Kollegiets hånd.
        </div>
      )}
    </Section>
  );
}

function GeoterIndexSection({
  currentGeot,
  dossier,
  latestAdjustments,
  players,
  rows,
}: {
  currentGeot: Player;
  dossier: ReturnType<typeof getGeoterIndexDossier>;
  latestAdjustments: GeoterIndexAdjustment[];
  players: Player[];
  rows: GeoterIndexRow[];
}) {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const categoryById = new Map(geoterIndexCategories.map((category) => [category.id, category]));

  return (
    <section className="overflow-hidden rounded border border-[#c49a3c]/70 bg-[#061d2b] text-[#fff7e6] shadow-[0_22px_48px_rgba(0,0,0,0.24)]">
      <div className="grid gap-0 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="p-5 sm:p-7">
          <p className="inline-flex items-center gap-2 rounded border border-[#c49a3c]/55 bg-[#020b11]/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#e1c06c]">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            GEO-OBS 3K · hemmelig indeks
          </p>
          <h2 className="font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            GEOTERINDEKSEN
          </h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-[#eadcbd]">
            Geotias skjulte sosiale kredittsystem måler tillit, deltakelse,
            initiativ, lojalitet, geografisk dømmekraft og evnen til å bygge
            fellesskapet gjennom produktiv krangling. Den er ikke vedtatt, ikke
            kjent, ikke diskutert og kan ikke klages på. Likevel avgjør den alt.
          </p>
          <div className="geotia-ornament mt-5 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">
            <span>{geoterIndexMotto}</span>
          </div>

          <div className="mt-6 rounded border border-[#c49a3c]/45 bg-[#fff7e6]/8 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">
                  Synlig for Kollegiet
                </p>
                <h3 className="font-display mt-1 text-2xl font-semibold">Alle geoter under observasjon</h3>
              </div>
              <p className="text-sm text-[#eadcbd]">
                Grunnscore: <span className="font-semibold text-[#fff7e6]">700</span>. Fri, men ikke troverdig.
              </p>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="protocol protocol--dark w-full min-w-[880px]">
                <thead>
                  <tr>
                    <th>Geot</th>
                    <th className="right">Score</th>
                    <th>Nivå</th>
                    <th>Siste justering</th>
                    <th>Historikk</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.player.id}>
                      <td>
                        <div className="geot-cell">
                          <span className="geot-flag" style={{ background: row.player.color }} />
                          <div className="min-w-0">
                            <div className="geot-name">{row.player.shortName}</div>
                            <div className="geot-title">{row.player.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="right">
                        <span className="num-display text-3xl">{row.score}</span>
                      </td>
                      <td>
                        <Stamp tone="brass">{row.tier.name}</Stamp>
                        <p className="mt-1 max-w-xs text-xs leading-5 text-[#eadcbd]">{row.tier.description}</p>
                      </td>
                      <td className="text-[#eadcbd]">
                        {row.lastAdjustment ? (
                          <>
                            <span className={row.lastAdjustment.delta > 0 ? "font-semibold text-[#97d9a8]" : "font-semibold text-[#ffb3a6]"}>
                              {row.lastAdjustment.delta > 0 ? "+" : ""}
                              {row.lastAdjustment.delta}
                            </span>{" "}
                            {row.lastAdjustment.title}
                          </>
                        ) : (
                          <span className="italic" style={{ fontFamily: "var(--font-italic)" }}>
                            Ingen justering. Mistanken hviler.
                          </span>
                        )}
                      </td>
                      <td>
                        <IndexSparkline row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 rounded border border-[#c49a3c]/45 bg-[#020b11]/45 p-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">
                  Operativ vurdering
                </p>
                <h3 className="font-display mt-1 text-2xl font-semibold">Indeksens dagsorden</h3>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold uppercase tracking-[0.1em] text-[#eadcbd]">
                <IndexSignal label="Risiko" value={dossier.summary.risk} />
                <IndexSignal label="Fall" value={dossier.summary.falling} />
                <IndexSignal label="Løft" value={dossier.summary.rising} />
                <IndexSignal label="Tomrom" value={dossier.summary.unobserved} />
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="grid gap-2 md:grid-cols-2">
                {dossier.items.length ? (
                  dossier.items.map((item) => (
                    <div key={`${item.playerId}-${item.title}`} className={`rounded border px-3 py-2 text-sm ${indexDossierToneClasses[item.tone]}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em]">{item.playerName} · {item.title}</p>
                      <p className="mt-1 leading-6">{item.detail}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em]">{item.action}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded border border-[#c49a3c]/30 bg-[#fff7e6]/8 px-3 py-2 text-sm text-[#eadcbd]">
                    Ingen signaler. Det er enten fred eller dårlig observasjon.
                  </p>
                )}
              </div>
              <div className="rounded border border-[#c49a3c]/30 bg-[#fff7e6]/8 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e1c06c]">Mest ustabile kurver</p>
                <div className="mt-3 grid gap-2">
                  {dossier.volatile.map((item) => (
                    <div key={item.playerId} className="rounded border border-[#c49a3c]/25 bg-[#020b11]/45 px-3 py-2 text-sm">
                      <p className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-[#fff7e6]">{item.playerName}</span>
                        <span className="font-mono text-[#e1c06c]">{item.weight}</span>
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#eadcbd]">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded border border-[#c49a3c]/45 bg-[#020b11]/45 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">
                <History className="h-4 w-4" aria-hidden="true" />
                Historisk utvikling
              </p>
              <IndexHistoryGraph rows={rows} />
            </div>
            <div className="rounded border border-[#c49a3c]/45 bg-[#fff7e6]/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">
                Justeringslogg
              </p>
              <div className="mt-3 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                {latestAdjustments.length ? (
                  latestAdjustments.map((adjustment) => {
                    const player = playerById.get(adjustment.playerId);
                    const category = categoryById.get(adjustment.category);
                    const operator = playerById.get(adjustment.createdBy);
                    const trailPoint = getGeoterIndexAdjustmentTrail(adjustment.playerId, latestAdjustments).find(
                      (point) => point.id === adjustment.id,
                    );
                    return (
                      <div key={adjustment.id} className="rounded border border-[#c49a3c]/30 bg-[#020b11]/35 p-3 text-sm">
                        <p className="flex items-center justify-between gap-3">
                          <span className="font-semibold">{player?.shortName ?? adjustment.playerId}</span>
                          <span className={adjustment.delta > 0 ? "text-[#97d9a8]" : "text-[#ffb3a6]"}>
                            {adjustment.delta > 0 ? "+" : ""}
                            {adjustment.delta}
                          </span>
                        </p>
                        <p className="mt-1 text-[#eadcbd]">{adjustment.title}</p>
                        <p className="mt-1 text-xs leading-5 text-[#cdbd97]">
                          {category?.label ?? adjustment.category} · {dateTimeLabel(adjustment.createdAt)} · ført av{" "}
                          {operator?.shortName ?? adjustment.createdBy}
                        </p>
                        {trailPoint ? (
                          <p className="mt-2 rounded border border-[#c49a3c]/20 bg-[#fff7e6]/8 px-2 py-1 font-mono text-xs text-[#fff7e6]">
                            {trailPoint.scoreBefore} → {trailPoint.scoreAfter}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs leading-5 text-[#eadcbd]">
                          {adjustment.reason || "Ingen begrunnelse ført. Mistenkelig, men lovlig."}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm leading-6 text-[#eadcbd]">
                    Ingen justeringer er ført ennå. Dette er ikke rettferdighet. Det er bare et tomt regneark.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="border-t border-[#c49a3c]/45 bg-[#020b11] p-5 2xl:border-l 2xl:border-t-0">
          <form action={submitGeoterIndexAdjustmentAction} className="rounded border border-[#c49a3c]/45 bg-[#fff7e6]/8 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Før skjult justering
            </p>
            <p className="mt-2 text-sm leading-6 text-[#eadcbd]">
              Operatør: {currentGeot.shortName}. Justeringer er synlige kun i dette rommet, men merkes i rikets sosiale lufttrykk.
            </p>
            <label className="mt-4 block text-sm font-semibold text-[#fff7e6]">
              Geot
              <select name="playerId" className="mt-2 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713]">
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.shortName}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#fff7e6]">
              Kategori
              <select name="category" className="mt-2 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713]">
                {geoterIndexCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#fff7e6]">
              Poengjustering
              <input
                name="delta"
                type="number"
                min="-100"
                max="100"
                step="1"
                defaultValue="10"
                className="mt-2 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713]"
                required
              />
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#fff7e6]">
              Tittel
              <input
                name="title"
                className="mt-2 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713]"
                placeholder="F.eks. Redning fra India"
                required
              />
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#fff7e6]">
              Begrunnelse
              <textarea
                name="reason"
                className="mt-2 min-h-24 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 py-2 text-[#161713]"
                placeholder="Kort protokolltekst. Husk: ankeinstansen er Kollegiet selv i mørkere rom."
              />
            </label>
            <PendingSubmitButton className="btn btn-wax mt-4 w-full justify-center">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Juster indeksen
            </PendingSubmitButton>
          </form>
        </aside>
      </div>

      <details className="border-t border-[#c49a3c]/45 bg-[#f4e6c7] text-[#161713]">
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-[#062b40] marker:text-[#7c2430] sm:px-7">
          <span className="inline-flex items-center gap-2">
            <FileText className="h-4 w-4" aria-hidden="true" />
            Åpne poengsystemet
          </span>
          <span className="hidden text-xs uppercase tracking-[0.16em] text-[#7c2430] sm:inline">
            nivåer · regler · multiplikatorer
          </span>
        </summary>
        <div className="grid gap-6 border-t border-[#c49a3c]/30 p-5 sm:p-7 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded border border-[#7c2430]/35 bg-[#7c2430]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7c2430]">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Lovtekst som ikke finnes
            </p>
            <h3 className="font-display mt-4 text-3xl font-semibold text-[#062b40]">
              Systemet kan ikke avskaffes. Det kan ikke nevnes.
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#4f412b]">
              Dokumentet beskriver et tredelt apparat: Tillit, Engasjement og
              Fellesskap, pluss den skjulte fanen “IKKE SLETT - VEGARD”. Her
              er læren omsatt til levende statsapparat.
            </p>
            <div className="mt-4 grid gap-2">
              {geoterIndexLaw.map((line) => (
                <p key={line} className="rounded border border-[#d8c48c] bg-white/70 px-3 py-2 text-sm leading-6">
                  {line}
                </p>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <RulePanel title="Nivåer i indeksen" items={geoterIndexTiers.map((tier) => `${tier.min}-${tier.max}: ${tier.name}. ${tier.consequence}`)} />
            <div className="grid gap-4 lg:grid-cols-2">
              <RulePanel title="Plusspoeng" items={positiveIndexRules.map((rule) => `+${rule.delta}: ${rule.title}. ${rule.description}`)} />
              <RulePanel title="Minuspoeng" items={negativeIndexRules.map((rule) => `${rule.delta}: ${rule.title}. ${rule.description}`)} />
            </div>
            <RulePanel title="Multiplikatorer" items={geoterIndexMultipliers} />
            <RulePanel title="Kollegiets prosedyrer" items={geoterIndexProcedures} />
          </div>
        </div>
      </details>
    </section>
  );
}

function GeoticOrderControlSection({
  currentGeot,
  players,
  rows,
}: {
  currentGeot: Player;
  players: Player[];
  rows: GeoticOrderRow[];
}) {
  const firstRow = rows[0];

  return (
    <section className="overflow-hidden rounded border border-[#c49a3c]/70 bg-[#061d2b] text-[#fff7e6] shadow-[0_22px_48px_rgba(0,0,0,0.24)]">
      <div className="grid gap-0 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="p-5 sm:p-7">
          <p className="inline-flex items-center gap-2 rounded border border-[#c49a3c]/55 bg-[#020b11]/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#e1c06c]">
            <Milestone className="h-4 w-4" aria-hidden="true" />
            Den Geotiske Orden · skjult kontroll
          </p>
          <h2 className="font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Ordensforvaltningen
          </h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-[#eadcbd]">
            Utenfor rommet ser geotene en høytidelig vei oppover. Her inne ser
            Kollegiet selve mekanikken: rang, tjenestetid, frys, degradering,
            partiprøver og den tause vurderingen av hvem som bærer, brenner,
            støtter eller bare turisterer.
          </p>
          <div className="geotia-ornament mt-5 text-center text-sm font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">
            <span>Offentlig stige. Skjult hånd på gelenderet.</span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6]/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">Høyeste rang</p>
              <p className="font-display mt-2 text-2xl font-semibold">{firstRow?.rank.name ?? "-"}</p>
            </div>
            <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6]/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">Under prøving</p>
              <p className="font-display mt-2 text-2xl font-semibold">
                {rows.filter((row) => row.status.id === "provetid").length}
              </p>
            </div>
            <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6]/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">Frosset</p>
              <p className="font-display mt-2 text-2xl font-semibold">
                {rows.filter((row) => row.status.id === "frosset").length}
              </p>
            </div>
            <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6]/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">Turistfare</p>
              <p className="font-display mt-2 text-2xl font-semibold">
                {rows.filter((row) => row.hiddenCategory.id === "turist").length}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded border border-[#c49a3c]/45 bg-[#fff7e6]/8 p-2">
            <table className="protocol protocol--dark w-full min-w-[980px]">
              <thead>
                <tr>
                  <th>Geot</th>
                  <th>Synlig rang</th>
                  <th>Skjult type</th>
                  <th className="right">Uker</th>
                  <th className="right">Poeng</th>
                  <th className="right">Indeks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.player.id}>
                    <td>
                      <div className="geot-cell">
                        <span className="geot-flag" style={{ background: row.player.color }} />
                        <div className="min-w-0">
                          <div className="geot-name">{row.player.shortName}</div>
                          <div className="geot-title">{row.player.title}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-semibold text-[#fff7e6]">{row.rank.name}</p>
                      <p className="text-xs text-[#cdbd97]">Rå terskel: {row.eligibleRank.name}</p>
                    </td>
                    <td>
                      <p className="font-semibold text-[#e1c06c]">{row.hiddenCategory.label}</p>
                      <p className="max-w-xs text-xs leading-5 text-[#eadcbd]">{row.hiddenCategory.description}</p>
                    </td>
                    <td className="right font-semibold">{row.serviceTimeLabel}</td>
                    <td className="right"><span className="num-display">{formatNumber(row.lifetimePoints)}</span></td>
                    <td className="right"><span className="num-display">{row.trustScore}</span></td>
                    <td><Stamp tone="brass">{row.status.label}</Stamp></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded border border-[#c49a3c]/45 bg-[#020b11]/45 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                Kollegiets skjulte kategorier
              </p>
              <div className="mt-3 grid gap-2">
                {geoticOrderHiddenCategories.map((category) => (
                  <p key={category.id} className="rounded border border-[#c49a3c]/30 bg-[#fff7e6]/8 px-3 py-2 text-sm leading-6">
                    <span className="font-semibold text-[#fff7e6]">{category.label}:</span>{" "}
                    <span className="text-[#eadcbd]">{category.description}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded border border-[#c49a3c]/45 bg-[#020b11]/45 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">
                <Footprints className="h-4 w-4" aria-hidden="true" />
                Aspirantprøver
              </p>
              <div className="mt-3 grid gap-2">
                {partyTrials.map((trial) => (
                  <p key={trial} className="rounded border border-[#c49a3c]/30 bg-[#fff7e6]/8 px-3 py-2 text-sm leading-6 text-[#eadcbd]">
                    {trial}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="border-t border-[#c49a3c]/45 bg-[#020b11] p-5 2xl:border-l 2xl:border-t-0">
          <form action={submitGeoticOrderAssessmentAction} className="rounded border border-[#c49a3c]/45 bg-[#fff7e6]/8 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">
              <UserCog className="h-4 w-4" aria-hidden="true" />
              Før ordensrang
            </p>
            <p className="mt-2 text-sm leading-6 text-[#eadcbd]">
              Operatør: {currentGeot.shortName}. Dette endrer den synlige ordensveien uten å forklare hvem som vippet vekten.
            </p>
            <label className="mt-4 block text-sm font-semibold text-[#fff7e6]">
              Geot
              <select name="playerId" className="mt-2 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713]">
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.shortName}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#fff7e6]">
              Synlig rang
              <select name="rankId" defaultValue={firstRow?.rank.id} className="mt-2 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713]">
                {geoticOrderRanks.map((rank) => (
                  <option key={rank.id} value={rank.id}>
                    {rank.number}. {rank.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#fff7e6]">
              Tjenesteuker
              <input
                name="serviceWeeks"
                type="number"
                min="0"
                max="999"
                defaultValue={firstRow?.serviceWeeks ?? 0}
                className="mt-2 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713]"
                required
              />
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#fff7e6]">
              Skjult kategori
              <select name="hiddenCategory" defaultValue={firstRow?.hiddenCategory.id} className="mt-2 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713]">
                {geoticOrderHiddenCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#fff7e6]">
              Status
              <select name="status" defaultValue={firstRow?.status.id} className="mt-2 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713]">
                {geoticOrderStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#fff7e6]">
              Sponsor / parti
              <input
                name="sponsor"
                className="mt-2 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713]"
                placeholder="F.eks. SS, PKK eller Vegard med hevet bryn"
              />
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#fff7e6]">
              Prøve / ritual
              <input
                name="trial"
                className="mt-2 h-10 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 text-[#161713]"
                placeholder="F.eks. PKK-prøven gjennomført uten sosial kollaps"
              />
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#fff7e6]">
              Offentlig merknad
              <textarea
                name="publicNote"
                className="mt-2 min-h-20 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 py-2 text-[#161713]"
                placeholder="Tekst som kan vises på ordenssiden uten å avsløre Kollegiet."
              />
            </label>
            <label className="mt-3 block text-sm font-semibold text-[#fff7e6]">
              Intern merknad
              <textarea
                name="internalNote"
                className="mt-2 min-h-24 w-full rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-2 py-2 text-[#161713]"
                placeholder="Det egentlige notatet. Her kan mistanken ha navn."
              />
            </label>
            <PendingSubmitButton className="btn btn-wax mt-4 w-full justify-center">
              <UserCog className="h-4 w-4" aria-hidden="true" />
              Før rang i ordenen
            </PendingSubmitButton>
          </form>
        </aside>
      </div>
    </section>
  );
}

const indexDossierToneClasses = {
  blue: "border-[#203c62]/30 bg-[#203c62]/14 text-[#d9e8f5]",
  green: "border-[#194832]/30 bg-[#194832]/18 text-[#dff3e4]",
  gold: "border-[#c49a3c]/45 bg-[#c49a3c]/14 text-[#fff7e6]",
  red: "border-[#7c2430]/35 bg-[#7c2430]/18 text-[#ffd8d0]",
} as const;

function IndexSignal({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-[#c49a3c]/30 bg-[#fff7e6]/8 px-2 py-2">
      <p className="font-display text-2xl font-semibold text-[#e1c06c]">{value}</p>
      <p className="mt-1">{label}</p>
    </div>
  );
}

function RulePanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded border border-[#c49a3c]/45 bg-white/70 p-4">
      <h4 className="font-display text-2xl font-semibold text-[#062b40]">{title}</h4>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <p key={item} className="rounded border border-[#d8c48c] bg-[#fff7e6] px-3 py-2 text-sm leading-6 text-[#4f412b]">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function IndexSparkline({ row }: { row: GeoterIndexRow }) {
  const points = row.history;
  const width = 150;
  const height = 44;
  const path = points
    .map((point, index) => {
      const x = points.length <= 1 ? 0 : (index / (points.length - 1)) * width;
      const y = height - ((point.score - 0) / 1000) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg aria-label={`Historikk for ${row.player.shortName}`} className="h-12 w-40" role="img" viewBox={`0 0 ${width} ${height}`}>
      <line stroke="rgba(225,192,108,0.28)" x1="0" x2={width} y1={height * 0.3} y2={height * 0.3} />
      <line stroke="rgba(225,192,108,0.18)" x1="0" x2={width} y1={height * 0.7} y2={height * 0.7} />
      <path d={path} fill="none" stroke={row.tier.tone} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      {points.map((point, index) => {
        const x = points.length <= 1 ? 0 : (index / (points.length - 1)) * width;
        const y = height - (point.score / 1000) * height;
        return <circle key={point.id} cx={x} cy={y} fill={row.tier.tone} r="3" />;
      })}
    </svg>
  );
}

function IndexHistoryGraph({ rows }: { rows: GeoterIndexRow[] }) {
  const width = 760;
  const height = 290;
  const plot = { left: 46, right: 132, top: 20, bottom: 32 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const maxPoints = Math.max(...rows.map((row) => row.history.length), 1);
  const xFor = (index: number) => plot.left + (maxPoints <= 1 ? 0 : (index / (maxPoints - 1)) * plotWidth);
  const yFor = (score: number) => plot.top + (1 - score / 1000) * plotHeight;

  return (
    <div className="mt-4 overflow-x-auto rounded border border-[#c49a3c]/25 bg-[#020b11]/55 p-2">
      <svg aria-label="Samlet historikk for Geoterindeksen" className="min-w-[720px]" role="img" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="indexGraphFade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(225,192,108,0.22)" />
            <stop offset="55%" stopColor="rgba(255,247,230,0.08)" />
            <stop offset="100%" stopColor="rgba(124,36,48,0.18)" />
          </linearGradient>
        </defs>
        <rect fill="rgba(255,247,230,0.04)" height={height} rx="12" width={width} />
        {geoterIndexTiers.map((tier) => {
          const yTop = yFor(tier.max);
          const yBottom = yFor(tier.min);
          return (
            <g key={tier.name}>
              <rect
                fill={tier.tone}
                height={Math.max(2, yBottom - yTop)}
                opacity="0.08"
                width={plotWidth}
                x={plot.left}
                y={yTop}
              />
              <text fill="rgba(255,247,230,0.46)" fontSize="10" x={plot.left + plotWidth + 10} y={Math.max(plot.top + 10, yTop + 13)}>
                {tier.name}
              </text>
            </g>
          );
        })}
        <rect fill="url(#indexGraphFade)" height={plotHeight} opacity="0.35" width={plotWidth} x={plot.left} y={plot.top} />
        {[1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 0].map((score) => {
          const y = yFor(score);
          return (
            <g key={score}>
              <line stroke="rgba(225,192,108,0.14)" x1={plot.left} x2={plot.left + plotWidth} y1={y} y2={y} />
              <text fill="rgba(255,247,230,0.58)" fontSize="11" textAnchor="end" x={plot.left - 8} y={Math.max(12, y + 4)}>
                {score}
              </text>
            </g>
          );
        })}
        <line stroke="rgba(255,247,230,0.55)" strokeWidth="2" x1={plot.left} x2={plot.left + plotWidth} y1={yFor(700)} y2={yFor(700)} />
        <text fill="#fff7e6" fontSize="11" fontWeight="700" x={plot.left + 8} y={yFor(700) - 7}>
          grunnscore 700
        </text>
        {rows.map((row, index) => {
          const d = row.history
            .map((point, pointIndex) => {
              const x = xFor(pointIndex);
              const y = yFor(point.score);
              return `${pointIndex === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(" ");
          const lastPoint = row.history.at(-1)!;
          const lastX = xFor(row.history.length - 1);
          const lastY = yFor(lastPoint.score);
          const labelY = Math.min(
            height - plot.bottom + 4,
            Math.max(plot.top + 12, lastY + (index - (rows.length - 1) / 2) * 13),
          );
          return (
            <g key={row.player.id}>
              <path d={d} fill="none" opacity="0.92" stroke={row.player.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
              {row.history.map((point, pointIndex) => (
                <circle key={`${row.player.id}-${point.id}`} cx={xFor(pointIndex)} cy={yFor(point.score)} fill="#061d2b" r="4.5" stroke={row.player.color} strokeWidth="2" />
              ))}
              <circle cx={lastX} cy={lastY} fill={row.player.color} r="6" stroke="#fff7e6" strokeWidth="2" />
              <text
                fill="#fff7e6"
                fontSize="12"
                fontWeight="700"
                paintOrder="stroke"
                stroke="#061d2b"
                strokeWidth="4"
                x={Math.min(width - 110, lastX + 12)}
                y={labelY}
              >
                {row.player.shortName} {row.score}
              </text>
            </g>
          );
        })}
        <text fill="rgba(255,247,230,0.54)" fontSize="11" x={plot.left} y={height - 8}>
          Hver prikk er en protokollført justering. Tom historikk hviler på 700.
        </text>
      </svg>
    </div>
  );
}
